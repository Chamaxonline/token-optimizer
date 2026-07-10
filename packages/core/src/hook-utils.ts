import { estimateTokens } from "./tokenizer.js";
import type { TokenOptConfig } from "./session-types.js";

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

  const output = input.output;
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    return JSON.stringify(output);
  }

  return "";
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

export function evaluateToolOutput(
  tool: string,
  output: string,
  config: TokenOptConfig,
): { outputChars: number; estimatedTokens: number; warning?: string } {
  const outputChars = output.length;
  const estimatedTokens = estimateTokens(output);
  const toolLower = tool.toLowerCase();

  let budget = config.budgets.shell_output_chars;
  if (toolLower.includes("grep")) {
    budget = config.budgets.grep_max_lines * 80;
  } else if (toolLower.includes("mcp")) {
    budget = config.budgets.mcp_output_chars;
  }

  if (outputChars > budget && config.behavior.mode === "warn") {
    return {
      outputChars,
      estimatedTokens,
      warning: `Output is ${outputChars} chars (~${estimatedTokens} tokens), over budget of ${budget}`,
    };
  }

  return { outputChars, estimatedTokens };
}
