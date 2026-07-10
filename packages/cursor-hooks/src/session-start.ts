import { appendSessionEvent } from "@token-opt/core/session";
import { extractSessionId } from "@token-opt/core/session";
import { runHook } from "./lib/hook-io.js";

await runHook(async (input) => {
  const sessionId = extractSessionId(input);

  await appendSessionEvent(sessionId, {
    type: "session_start",
    metadata: {
      workspace: input.workspace ?? input.cwd ?? input.project_path,
      source: "cursor",
    },
  });

  return {};
});
