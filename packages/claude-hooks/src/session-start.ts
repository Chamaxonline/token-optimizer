import {
  appendSessionEvent,
  clearSessionState,
  extractSessionId,
} from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

await runHook(async (input) => {
  const sessionId = extractSessionId(input);
  await clearSessionState(sessionId);

  await appendSessionEvent(sessionId, {
    type: "session_start",
    metadata: {
      workspace: input.cwd ?? process.env.CLAUDE_PROJECT_DIR,
      source: "claude",
      sessionSource: input.source,
    },
  });

  return {};
});
