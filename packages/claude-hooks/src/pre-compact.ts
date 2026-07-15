import { appendSessionEvent, extractSessionId } from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

void runHook(async (input) => {
  const sessionId = extractSessionId(input);

  await appendSessionEvent(sessionId, {
    type: "pre_compact",
    metadata: {
      source: "claude",
      trigger: input.trigger ?? input.reason,
    },
  });

  return {};
});
