import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getConfigPath, saveDefaultConfig } from "@token-opt/core";

const CURSOR_HOOK_FILES = [
  "session-start.js",
  "session-end.js",
  "post-tool-use.js",
  "pre-tool-use-read.js",
  "before-submit-prompt.js",
  "pre-compact.js",
];

const CLAUDE_HOOK_FILES = [
  "session-start.js",
  "session-end.js",
  "post-tool-use.js",
  "pre-tool-use-read.js",
  "user-prompt-submit.js",
  "pre-compact.js",
];

function packageRoot(name: "cursor-hooks" | "claude-hooks"): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), `../../${name}`);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function installCursorHooks(projectRoot: string): Promise<string> {
  const hooksDir = join(projectRoot, ".cursor", "hooks");
  const hooksJsonPath = join(projectRoot, ".cursor", "hooks.json");
  const distDir = join(packageRoot("cursor-hooks"), "dist");
  const templatePath = join(packageRoot("cursor-hooks"), "hooks.json");

  await mkdir(hooksDir, { recursive: true });
  for (const file of CURSOR_HOOK_FILES) {
    await copyFile(join(distDir, file), join(hooksDir, file));
  }
  await copyFile(templatePath, hooksJsonPath);
  return hooksJsonPath;
}

function mergeClaudeHooks(
  existing: Record<string, unknown>,
  tokenOptHooks: Record<string, unknown>,
): Record<string, unknown> {
  const existingHooks =
    existing.hooks && typeof existing.hooks === "object"
      ? (existing.hooks as Record<string, unknown>)
      : {};

  return {
    ...existing,
    hooks: {
      ...existingHooks,
      ...tokenOptHooks,
    },
  };
}

async function installClaudeHooks(projectRoot: string): Promise<string> {
  const hooksDir = join(projectRoot, ".claude", "hooks");
  const settingsPath = join(projectRoot, ".claude", "settings.json");
  const distDir = join(packageRoot("claude-hooks"), "dist");
  const templatePath = join(packageRoot("claude-hooks"), "settings.hooks.json");

  await mkdir(hooksDir, { recursive: true });
  for (const file of CLAUDE_HOOK_FILES) {
    await copyFile(join(distDir, file), join(hooksDir, file));
  }

  const template = JSON.parse(await readFile(templatePath, "utf8")) as {
    hooks: Record<string, unknown>;
  };

  let existing: Record<string, unknown> = {};
  if (await pathExists(settingsPath)) {
    try {
      existing = JSON.parse(await readFile(settingsPath, "utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      existing = {};
    }
  }

  const merged = mergeClaudeHooks(existing, template.hooks);
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return settingsPath;
}

export interface InitOptions {
  path?: string;
  cursor?: boolean;
  claude?: boolean;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const projectRoot = resolve(options.path ?? process.cwd());
  // Default: install both when neither flag is set
  const installCursor = options.cursor || options.claude ? Boolean(options.cursor) : true;
  const installClaude = options.cursor || options.claude ? Boolean(options.claude) : true;

  const installed: string[] = [];

  if (installCursor) {
    installed.push(`Cursor: ${await installCursorHooks(projectRoot)}`);
  }
  if (installClaude) {
    installed.push(`Claude: ${await installClaudeHooks(projectRoot)}`);
  }

  const configPath = await saveDefaultConfig();

  console.log("token-opt hooks installed.");
  for (const line of installed) {
    console.log(`  ${line}`);
  }
  console.log(`  Config: ${configPath}`);
  console.log("");
  console.log("Restart Cursor / Claude Code, then run an agent session.");
  console.log("Afterwards: token-opt report");
  console.log("Enable enforce mode: token-opt config set mode enforce");
}

export async function getStatus(projectRoot = process.cwd()): Promise<{
  cursorHooksInstalled: boolean;
  claudeHooksInstalled: boolean;
  cursorHooksJsonPath: string;
  claudeSettingsPath: string;
  configPath: string;
}> {
  const root = resolve(projectRoot);
  const cursorHooksJsonPath = join(root, ".cursor", "hooks.json");
  const claudeSettingsPath = join(root, ".claude", "settings.json");

  return {
    cursorHooksInstalled: await pathExists(cursorHooksJsonPath),
    claudeHooksInstalled: await pathExists(claudeSettingsPath),
    cursorHooksJsonPath,
    claudeSettingsPath,
    configPath: getConfigPath(),
  };
}
