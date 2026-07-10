import {
  appendSessionEvent,
  evaluateToolOutput,
  extractSessionId,
  extractToolInput,
  extractToolName,
  extractToolOutput,
  loadConfig,
} from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

await runHook(async (input) => {
  const sessionId = extractSessionId(input);
  const tool = extractToolName(input);
  const output = extractToolOutput(input);
  const toolInput = extractToolInput(input);
  const config = await loadConfig();
  const evaluation = evaluateToolOutput(tool, output, config);

  const detail =
    typeof toolInput === "string"
      ? toolInput
      : toolInput && typeof toolInput === "object"
        ? String(
            (toolInput as Record<string, unknown>).command ??
              (toolInput as Record<string, unknown>).pattern ??
              (toolInput as Record<string, unknown>).path ??
              (toolInput as Record<string, unknown>).file_path ??
              "",
          )
        : "";

  await appendSessionEvent(sessionId, {
    type: "tool_use",
    tool,
    detail,
    input: toolInput,
    outputChars: evaluation.outputChars,
    estimatedTokens: evaluation.estimatedTokens,
    warning: evaluation.warning,
  });

  if (evaluation.warning) {
    return {
      additional_context: `[token-opt] ${evaluation.warning}`,
    };
  }

  return {};
});
