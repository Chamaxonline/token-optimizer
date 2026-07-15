import { appendSessionEvent, extractSessionId, finalizeSession, clearSessionState } from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

void runHook(async (input) => {
  const sessionId = extractSessionId(input);

  await appendSessionEvent(sessionId, {
    type: "session_end",
    metadata: { source: "cursor" },
  });

  await finalizeSession(sessionId);
  await clearSessionState(sessionId);

  return {};
});
