import {
  appendSessionEvent,
  evaluateToolOutputPolicy,
  extractReadPath,
  extractSessionId,
  extractToolInput,
  extractToolName,
  extractToolOutput,
  formatTruncationNotice,
  loadConfig,
  normalizeToolName,
  recordRead,
  saveToolArtifact,
} from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

function toolDetail(toolInput: unknown): string {
  if (typeof toolInput === "string") return toolInput;
  if (!toolInput || typeof toolInput !== "object") return "";
  const input = toolInput as Record<string, unknown>;
  return String(
    input.command ??
      input.pattern ??
      input.path ??
      input.file_path ??
      "",
  );
}

void runHook(async (input) => {
  const sessionId = extractSessionId(input);
  const tool = normalizeToolName(extractToolName(input));
  const output = extractToolOutput(input);
  const toolInput = extractToolInput(input);
  const config = await loadConfig();
  const policy = evaluateToolOutputPolicy(tool, output, config);

  await appendSessionEvent(sessionId, {
    type: "tool_use",
    tool,
    detail: toolDetail(toolInput),
    input: toolInput,
    outputChars: policy.outputChars,
    estimatedTokens: policy.estimatedTokens,
    warning: policy.message,
    metadata: policy.flag ? { flag: policy.flag } : undefined,
  });

  if (tool.toLowerCase().includes("read")) {
    const path = extractReadPath(toolInput);
    if (path) await recordRead(sessionId, path);
  }

  if (policy.action === "warn") {
    return {
      additional_context: policy.agentMessage ?? `[token-opt] ${policy.message}`,
    };
  }

  if (policy.action === "truncate" && policy.truncatedOutput !== undefined) {
    const artifactPath = await saveToolArtifact(sessionId, tool, output);
    const notice = formatTruncationNotice(
      policy.agentMessage ?? `[token-opt] ${policy.message}`,
      artifactPath,
    );
    const toolLower = tool.toLowerCase();
    if (toolLower.includes("mcp")) {
      return {
        updated_mcp_tool_output: policy.truncatedOutput,
        additional_context: notice,
      };
    }
    return {
      additional_context: `${notice}\n\n[truncated output]\n${policy.truncatedOutput}`,
    };
  }

  return {};
});
