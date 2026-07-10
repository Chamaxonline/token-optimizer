import { estimateTokens } from "./tokenizer.js";
import type { PolicyResult, TokenOptConfig } from "./session-types.js";

function toolBudgetChars(tool: string, config: TokenOptConfig): number {
  const name = tool.toLowerCase();
  if (name.includes("grep")) {
    return config.budgets.grep_max_lines * 80;
  }
  if (name.includes("mcp")) {
    return config.budgets.mcp_output_chars;
  }
  return config.budgets.shell_output_chars;
}

function countLines(text: string): number {
  if (!text) return 0;
  return text.split("\n").length;
}

export function evaluateToolOutputPolicy(
  tool: string,
  output: string,
  config: TokenOptConfig,
): PolicyResult {
  const outputChars = output.length;
  const estimatedTokens = estimateTokens(output);
  const toolLower = tool.toLowerCase();
  const budget = toolBudgetChars(tool, config);

  const lineCount = toolLower.includes("grep") ? countLines(output) : null;
  const overLineBudget =
    lineCount !== null && lineCount > config.budgets.grep_max_lines;
  const overCharBudget = outputChars > budget;

  if (!overLineBudget && !overCharBudget) {
    return { action: "allow", outputChars, estimatedTokens };
  }

  const detail =
    overLineBudget && lineCount !== null
      ? `${lineCount} lines (budget: ${config.budgets.grep_max_lines})`
      : `${outputChars} chars (budget: ${budget})`;

  const message = `Output is ${detail}, ~${estimatedTokens} tokens`;

  if (config.behavior.mode === "enforce") {
    const truncated = output.slice(0, budget);
    return {
      action: "truncate",
      message,
      userMessage: `[token-opt] Truncated ${tool} output — ${message}`,
      agentMessage: `[token-opt] Tool output was truncated to stay within budget. Full output saved locally.`,
      outputChars,
      estimatedTokens,
      estimatedTokensSaved: Math.max(0, outputChars - budget),
      truncatedOutput: truncated,
      flag: overLineBudget ? "over_budget" : "large_output",
    };
  }

  return {
    action: "warn",
    message,
    userMessage: `[token-opt] ${tool} output exceeded budget: ${message}`,
    agentMessage: `[token-opt] Consider narrowing this ${tool} call — ${message}`,
    outputChars,
    estimatedTokens,
    flag: "over_budget",
  };
}

export function evaluateDuplicateReadPolicy(
  filePath: string,
  isDuplicate: boolean,
  config: TokenOptConfig,
): PolicyResult {
  if (!isDuplicate) {
    return { action: "allow" };
  }

  const message = `File "${filePath}" was read recently (within ${config.budgets.duplicate_read_ttl_sec}s)`;

  if (config.behavior.mode === "enforce") {
    return {
      action: "deny",
      message,
      userMessage: `[token-opt] Blocked duplicate read: ${message}`,
      agentMessage: `[token-opt] This file is already in context from a recent read. Use prior output instead of re-reading.`,
      flag: "duplicate",
    };
  }

  return {
    action: "warn",
    message,
    userMessage: `[token-opt] Duplicate read: ${message}`,
    agentMessage: `[token-opt] ${message}. Avoid re-reading unless necessary.`,
    flag: "duplicate",
  };
}

export function extractReadPath(toolInput: unknown): string | null {
  if (typeof toolInput === "string") return toolInput;
  if (!toolInput || typeof toolInput !== "object") return null;

  const input = toolInput as Record<string, unknown>;
  const path = input.path ?? input.file_path ?? input.filePath ?? input.target;
  return typeof path === "string" ? path : null;
}

export function extractPromptText(input: Record<string, unknown>): string {
  const prompt =
    input.prompt ??
    input.text ??
    input.message ??
    input.user_message ??
    input.userMessage;
  return typeof prompt === "string" ? prompt : "";
}

const FILE_REF_PATTERN =
  /(?:@|["'`])([^\s"'`]+?\.(?:ts|tsx|js|jsx|py|go|rs|java|md|json|yaml|yml|css|html|vue|svelte))\b/gi;

export function findPromptFileReferences(prompt: string): string[] {
  const refs = new Set<string>();
  for (const match of prompt.matchAll(FILE_REF_PATTERN)) {
    if (match[1]) refs.add(match[1]);
  }
  return [...refs];
}

export function evaluatePromptPolicy(
  _prompt: string,
  largeFiles: Array<{ path: string; lines: number }>,
  config: TokenOptConfig,
): PolicyResult | null {
  if (largeFiles.length === 0) return null;

  const fileList = largeFiles
    .map((f) => `${f.path} (${f.lines} lines)`)
    .join(", ");
  const message = `Prompt references large files: ${fileList} (budget: ${config.budgets.prompt_max_file_lines} lines/file)`;

  if (config.behavior.mode === "enforce") {
    return {
      action: "warn",
      message,
      userMessage: `[token-opt] ${message}`,
      agentMessage: `[token-opt] Prefer @-mentioning specific symbols or line ranges instead of full files.`,
      flag: "large_file",
    };
  }

  return {
    action: "warn",
    message,
    userMessage: `[token-opt] ${message}`,
    agentMessage: `[token-opt] Large files in prompt increase token cost. Consider narrower context.`,
    flag: "large_file",
  };
}

export async function countFileLines(filePath: string): Promise<number | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(filePath, "utf8");
    return countLines(content);
  } catch {
    return null;
  }
}

export async function findLargeFilesInPrompt(
  prompt: string,
  workspaceRoot: string,
  maxLines: number,
): Promise<Array<{ path: string; lines: number }>> {
  const refs = findPromptFileReferences(prompt);
  const large: Array<{ path: string; lines: number }> = [];
  const { resolve, isAbsolute } = await import("node:path");

  for (const ref of refs) {
    const fullPath = isAbsolute(ref) ? ref : resolve(workspaceRoot, ref);
    const lines = await countFileLines(fullPath);
    if (lines !== null && lines > maxLines) {
      large.push({ path: ref, lines });
    }
  }

  return large;
}
