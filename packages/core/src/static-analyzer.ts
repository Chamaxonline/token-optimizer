import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, relative, resolve } from "node:path";
import fg from "fast-glob";
import {
  estimateTokens,
  MCP_SERVER_TOKEN_HEURISTIC,
  SKILL_FILE_TOKEN_HEURISTIC,
} from "./tokenizer.js";
import type {
  McpServerInfo,
  ScanCategory,
  ScanOptions,
  ScanResult,
  ScanSuggestion,
} from "./types.js";

interface FileScanTarget {
  id: string;
  label: string;
  patterns: string[];
  baseDir: string;
}

interface McpConfigShape {
  mcpServers?: Record<string, unknown>;
  servers?: Record<string, unknown>;
}

async function readTextSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function relPath(rootDir: string, filePath: string): string {
  return relative(rootDir, filePath).replace(/\\/g, "/");
}

async function scanFiles(
  rootDir: string,
  targets: FileScanTarget[],
): Promise<ScanCategory[]> {
  const categories: ScanCategory[] = [];

  for (const target of targets) {
    const matches = await fg(target.patterns, {
      cwd: target.baseDir,
      absolute: true,
      onlyFiles: true,
      dot: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
    });

    let totalTokens = 0;
    const files: string[] = [];

    for (const filePath of matches) {
      const content = await readTextSafe(filePath);
      if (content === null) continue;

      totalTokens += estimateTokens(content);
      files.push(relPath(rootDir, filePath));
    }

    if (files.length > 0) {
      categories.push({
        id: target.id,
        label: target.label,
        tokens: totalTokens,
        files,
      });
    }
  }

  return categories;
}

async function parseMcpConfig(filePath: string): Promise<McpServerInfo[]> {
  const content = await readTextSafe(filePath);
  if (!content) return [];

  let parsed: McpConfigShape;
  try {
    parsed = JSON.parse(content) as McpConfigShape;
  } catch {
    return [];
  }

  const servers = parsed.mcpServers ?? parsed.servers ?? {};
  return Object.keys(servers).map((name) => ({
    name,
    estimatedTokens: MCP_SERVER_TOKEN_HEURISTIC,
    source: filePath,
  }));
}

async function scanMcpConfigs(
  rootDir: string,
  configPaths: string[],
): Promise<ScanCategory | null> {
  const allServers: McpServerInfo[] = [];

  for (const configPath of configPaths) {
    const servers = await parseMcpConfig(configPath);
    allServers.push(...servers);
  }

  if (allServers.length === 0) return null;

  const totalTokens = allServers.reduce((sum, s) => sum + s.estimatedTokens, 0);

  return {
    id: "mcp-schemas",
    label: "MCP tool schemas (estimated)",
    tokens: totalTokens,
    files: allServers.map(
      (s) => `${relPath(rootDir, s.source)} → ${s.name}`,
    ),
  };
}

function findDuplicateRuleThemes(categories: ScanCategory[]): ScanSuggestion[] {
  const rules = categories.find((c) => c.id === "cursor-rules");
  if (!rules || rules.files.length < 2) return [];

  const suggestions: ScanSuggestion[] = [];
  const fileNames = rules.files.map((f) => f.toLowerCase());

  const pairs: Array<[string, string]> = [["testing", "quality"]];

  for (const [a, b] of pairs) {
    const hasA = fileNames.some((f) => f.includes(a));
    const hasB = fileNames.some((f) => f.includes(b));
    if (hasA && hasB) {
      suggestions.push({
        message: `Review rules mentioning "${a}" and "${b}" for overlap — consider merging duplicate guidance`,
        estimatedSavings: 600,
        severity: "info",
      });
    }
  }

  return suggestions;
}

function buildMcpSuggestions(mcpCategory: ScanCategory | null): ScanSuggestion[] {
  if (!mcpCategory) return [];

  const suggestions: ScanSuggestion[] = [];
  const serverCount = mcpCategory.files.length;

  if (serverCount >= 6) {
    suggestions.push({
      message: `${serverCount} MCP servers configured — disable unused servers or load them on demand`,
      estimatedSavings: Math.round(mcpCategory.tokens * 0.3),
      severity: "warning",
    });
  }

  if (serverCount >= 3) {
    suggestions.push({
      message:
        "MCP tool schemas are loaded per session — use an MCP proxy to trim verbose tool descriptions",
      estimatedSavings: Math.round(mcpCategory.tokens * 0.2),
      severity: "info",
    });
  }

  return suggestions;
}

function buildRulesSuggestions(rulesCategory: ScanCategory | undefined): ScanSuggestion[] {
  if (!rulesCategory) return [];

  const suggestions: ScanSuggestion[] = [];

  if (rulesCategory.tokens > 3000) {
    suggestions.push({
      message: `Cursor rules total ~${rulesCategory.tokens.toLocaleString()} tokens — split into scoped rules loaded only when needed`,
      estimatedSavings: Math.round(rulesCategory.tokens * 0.25),
      severity: "warning",
    });
  }

  return suggestions;
}

export async function scanStaticContext(options: ScanOptions): Promise<ScanResult> {
  const rootDir = resolve(options.rootDir);
  const home = homedir();

  const projectTargets: FileScanTarget[] = [
    {
      id: "cursor-rules",
      label: "Cursor rules",
      patterns: [".cursor/rules/**/*.md", ".cursor/rules/**/*.mdc", "AGENTS.md"],
      baseDir: rootDir,
    },
    {
      id: "claude-context",
      label: "Claude project context",
      patterns: ["CLAUDE.md", ".claude/**/*.md"],
      baseDir: rootDir,
    },
  ];

  const userTargets: FileScanTarget[] = [];

  if (options.includeUserCursor) {
    userTargets.push({
      id: "cursor-skills",
      label: "Cursor skills (user)",
      patterns: ["skills-cursor/**/*.md", "skills/**/*.md"],
      baseDir: join(home, ".cursor"),
    });
  }

  const categories = [
    ...(await scanFiles(rootDir, projectTargets)),
    ...(await scanFiles(rootDir, userTargets)),
  ];

  const mcpConfigPaths: string[] = [];

  const projectMcp = join(rootDir, ".cursor", "mcp.json");
  const claudeMcp = join(rootDir, ".mcp.json");

  mcpConfigPaths.push(projectMcp, claudeMcp);

  if (options.includeUserCursor) {
    mcpConfigPaths.push(join(home, ".cursor", "mcp.json"));
  }

  if (options.includeUserClaude) {
    mcpConfigPaths.push(join(home, ".claude", "mcp.json"));
  }

  const existingMcpPaths: string[] = [];
  for (const p of mcpConfigPaths) {
    if (await readTextSafe(p)) existingMcpPaths.push(p);
  }

  const mcpCategory = await scanMcpConfigs(rootDir, existingMcpPaths);
  if (mcpCategory) categories.push(mcpCategory);

  // Estimate skill files when glob didn't find them but user flag is on
  if (options.includeUserCursor && !categories.some((c) => c.id === "cursor-skills")) {
    const skillMatches = await fg(["skills-cursor/**/*.md", "skills/**/*.md"], {
      cwd: join(home, ".cursor"),
      absolute: true,
      onlyFiles: true,
      dot: true,
    });

    if (skillMatches.length > 0) {
      categories.push({
        id: "cursor-skills",
        label: "Cursor skills (user)",
        tokens: skillMatches.length * SKILL_FILE_TOKEN_HEURISTIC,
        files: skillMatches.map((f) => relPath(rootDir, f)),
      });
    }
  }

  const totalEstimatedTokens = categories.reduce((sum, c) => sum + c.tokens, 0);

  const suggestions: ScanSuggestion[] = [
    ...buildMcpSuggestions(mcpCategory),
    ...buildRulesSuggestions(categories.find((c) => c.id === "cursor-rules")),
    ...findDuplicateRuleThemes(categories),
  ];

  // Deduplicate suggestions by message
  const seen = new Set<string>();
  const uniqueSuggestions = suggestions.filter((s) => {
    if (seen.has(s.message)) return false;
    seen.add(s.message);
    return true;
  });

  uniqueSuggestions.sort((a, b) => b.estimatedSavings - a.estimatedSavings);

  return {
    rootDir,
    totalEstimatedTokens,
    categories: categories.sort((a, b) => b.tokens - a.tokens),
    suggestions: uniqueSuggestions,
    scannedAt: new Date().toISOString(),
  };
}
