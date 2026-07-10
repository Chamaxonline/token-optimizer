import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { checkDuplicateRead, recordRead } from "./read-tracker.js";
import { DEFAULT_CONFIG } from "./config.js";

describe("read-tracker", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "token-opt-read-"));
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

  it("detects duplicate reads within TTL", async () => {
    const sessionId = "sess-1";
    await recordRead(sessionId, "src/app.ts", configPath);

    const first = await checkDuplicateRead(
      sessionId,
      "src/app.ts",
      DEFAULT_CONFIG.budgets.duplicate_read_ttl_sec,
      configPath,
    );
    expect(first.isDuplicate).toBe(true);

    const other = await checkDuplicateRead(
      sessionId,
      "src/other.ts",
      DEFAULT_CONFIG.budgets.duplicate_read_ttl_sec,
      configPath,
    );
    expect(other.isDuplicate).toBe(false);
  });
});
