import {
  appendSessionEvent,
  evaluatePromptPolicy,
  extractPromptText,
  extractSessionId,
  extractWorkspaceRoot,
  findLargeFilesInPrompt,
  loadConfig,
} from "@token-opt/core/session";
import { claudeHookOutput, runHook } from "./lib/hook-io.js";

await runHook(async (input) => {
  const config = await loadConfig();
  const prompt = extractPromptText(input);
  if (!prompt) return {};

  const workspace =
    extractWorkspaceRoot(input) || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const largeFiles = await findLargeFilesInPrompt(
    prompt,
    workspace,
    config.budgets.prompt_max_file_lines,
  );

  const policy = evaluatePromptPolicy(prompt, largeFiles, config);
  if (!policy) return {};

  const sessionId = extractSessionId(input);
  await appendSessionEvent(sessionId, {
    type: "policy_warning",
    tool: "UserPromptSubmit",
    detail: largeFiles.map((f) => f.path).join(", "),
    warning: policy.message,
    metadata: { flag: policy.flag, largeFiles, source: "claude" },
  });

  return claudeHookOutput("UserPromptSubmit", {
    additionalContext: policy.agentMessage ?? `[token-opt] ${policy.message}`,
  });
});
