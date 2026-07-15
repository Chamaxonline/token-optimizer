import {
  appendSessionEvent,
  clearSessionState,
  extractSessionId,
  finalizeSession,
} from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

void runHook(async (input) => {
  const sessionId = extractSessionId(input);

  await appendSessionEvent(sessionId, {
    type: "session_end",
    metadata: { source: "claude", reason: input.reason },
  });

  await finalizeSession(sessionId);
  await clearSessionState(sessionId);

  return {};
});
