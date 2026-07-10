import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { appendSessionEvent, readSessionEvents } from "./event-store.js";
import { buildSessionReport } from "./reporter.js";
import { DEFAULT_CONFIG } from "./config.js";

describe("event store and reporter", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "token-opt-"));
    configPath = join(tempDir, "config.yaml");
    await writeFile(
      configPath,
      stringify({
        ...DEFAULT_CONFIG,
        storage: { dir: join(tempDir, "data") },
      }),
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("records tool events and builds a session report", async () => {
    const sessionId = "session-abc";

    await appendSessionEvent(
      sessionId,
      { type: "session_start", metadata: { source: "test" } },
      configPath,
    );

    await appendSessionEvent(
      sessionId,
      {
        type: "tool_use",
        tool: "Shell",
        detail: "npm test",
        outputChars: 12000,
        estimatedTokens: 3000,
        warning: "over budget",
      },
      configPath,
    );

    await appendSessionEvent(sessionId, { type: "session_end" }, configPath);

    const events = await readSessionEvents(sessionId, configPath);
    expect(events).toHaveLength(3);

    const report = buildSessionReport(sessionId, events, DEFAULT_CONFIG);
    expect(report.toolCallCount).toBe(1);
    expect(report.warnCount).toBe(1);
    expect(report.estimatedTokens.toolOutputs).toBe(3000);
    expect(report.topOffenders[0]?.tool).toBe("Shell");
  });

  it("aggregates duplicate reads in report", async () => {
    const sessionId = "session-read";
    const events = [
      {
        type: "tool_use" as const,
        sessionId,
        timestamp: "2026-01-01T00:00:00.000Z",
        tool: "Read",
        detail: "src/app.ts",
        outputChars: 1000,
        estimatedTokens: 250,
      },
      {
        type: "tool_use" as const,
        sessionId,
        timestamp: "2026-01-01T00:01:00.000Z",
        tool: "Read",
        detail: "src/app.ts",
        outputChars: 1000,
        estimatedTokens: 250,
      },
    ];

    const report = buildSessionReport(sessionId, events, DEFAULT_CONFIG);
    expect(report.duplicateReads).toBe(1);
    expect(report.topOffenders.some((o) => o.flag === "duplicate")).toBe(true);
  });
});
