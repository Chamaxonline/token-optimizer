import {
  appendSessionEvent,
  checkDuplicateRead,
  evaluateDuplicateReadPolicy,
  extractReadPath,
  extractSessionId,
  extractToolInput,
  extractToolName,
  loadConfig,
  policyToHookPermission,
} from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

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
    metadata: { flag: policy.flag },
  });

  return {
    permission: policyToHookPermission(policy),
    user_message: policy.userMessage,
    agent_message: policy.agentMessage,
  };
});
