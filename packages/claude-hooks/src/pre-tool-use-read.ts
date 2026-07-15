import {
  appendSessionEvent,
  checkDuplicateRead,
  evaluateDuplicateReadPolicy,
  extractReadPath,
  extractSessionId,
  extractToolInput,
  extractToolName,
  loadConfig,
} from "@token-opt/core/session";
import { claudeHookOutput, runHook } from "./lib/hook-io.js";

void runHook(async (input) => {
  const tool = extractToolName(input);
  if (!tool.toLowerCase().includes("read")) {
    return {};
  }

  const sessionId = extractSessionId(input);
  const toolInput = extractToolInput(input);
  const filePath = extractReadPath(toolInput);
  if (!filePath) return {};

  const config = await loadConfig();
  const { isDuplicate } = await checkDuplicateRead(
    sessionId,
    filePath,
    config.budgets.duplicate_read_ttl_sec,
  );

  const policy = evaluateDuplicateReadPolicy(filePath, isDuplicate, config);
  if (policy.action === "allow") return {};

  await appendSessionEvent(sessionId, {
    type: "policy_warning",
    tool: "Read",
    detail: filePath,
    warning: policy.message,
    metadata: { flag: policy.flag, source: "claude" },
  });

  if (policy.action === "deny") {
    return claudeHookOutput("PreToolUse", {
      permissionDecision: "deny",
      permissionDecisionReason:
        policy.agentMessage ?? policy.message ?? "Duplicate read blocked by token-opt",
    });
  }

  // warn mode: allow but inject context
  return claudeHookOutput("PreToolUse", {
    permissionDecision: "allow",
    additionalContext: policy.agentMessage ?? `[token-opt] ${policy.message}`,
  });
});
