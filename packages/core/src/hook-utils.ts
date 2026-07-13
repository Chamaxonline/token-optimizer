import type { TokenOptConfig } from "./session-types.js";
import { evaluateToolOutputPolicy } from "./policy-engine.js";

export function readHookField(
  input: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

export function extractSessionId(input: Record<string, unknown>): string {
  return (
    readHookField(input, [
      "session_id",
      "sessionId",
      "conversation_id",
      "conversationId",
    ]) ?? "unknown-session"
  );
}

export function extractToolName(input: Record<string, unknown>): string {
  return (
    readHookField(input, ["tool_name", "toolName", "tool", "name"]) ?? "unknown"
  );
}

export function extractToolOutput(input: Record<string, unknown>): string {
  const direct = readHookField(input, [
    "tool_output",
    "toolOutput",
    "output",
    "result",
    "content",
  ]);
  if (direct) return direct;

  // Claude Code PostToolUse uses tool_response
  const toolResponse = input.tool_response ?? input.toolResponse;
  if (typeof toolResponse === "string") return toolResponse;
  if (toolResponse && typeof toolResponse === "object") {
    return JSON.stringify(toolResponse);
  }

  const output = input.output;
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    return JSON.stringify(output);
  }

  return "";
}

/** Normalize Cursor Shell / Claude Bash / Grep / Read names for policy matching. */
export function normalizeToolName(tool: string): string {
  const lower = tool.toLowerCase();
  if (lower === "bash" || lower === "shell") return "Shell";
  if (lower.startsWith("mcp__") || lower.startsWith("mcp:")) return `MCP:${tool}`;
  return tool;
}

export function extractToolInput(input: Record<string, unknown>): unknown {
  return (
    input.tool_input ??
    input.toolInput ??
    input.input ??
    input.arguments ??
    input.args
  );
}

export function extractWorkspaceRoot(input: Record<string, unknown>): string {
  const root = readHookField(input, [
    "workspace",
    "workspace_root",
    "workspaceRoot",
    "cwd",
    "project_path",
    "projectPath",
  ]);
  return root ?? process.cwd();
}

/** @deprecated Use evaluateToolOutputPolicy from policy-engine */
export function evaluateToolOutput(
  tool: string,
  output: string,
  config: TokenOptConfig,
): { outputChars: number; estimatedTokens: number; warning?: string } {
  const result = evaluateToolOutputPolicy(tool, output, config);
  return {
    outputChars: result.outputChars ?? output.length,
    estimatedTokens: result.estimatedTokens ?? 0,
    warning: result.action === "warn" || result.action === "truncate" ? result.message : undefined,
  };
}

export function policyToHookPermission(
  result: import("./session-types.js").PolicyResult,
): "allow" | "deny" | "ask" {
  if (result.action === "deny") return "deny";
  return "allow";
}
