import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { saveToolArtifact } from "./artifacts.js";
import { DEFAULT_CONFIG, setConfigMode } from "./config.js";
import { normalizeToolName, extractToolOutput } from "./hook-utils.js";

describe("artifacts and enforce helpers", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "token-opt-art-"));
    configPath = join(tempDir, "config.yaml");
    await writeFile(
      configPath,
      stringify({
        ...DEFAULT_CONFIG,
        behavior: { ...DEFAULT_CONFIG.behavior, store_artifacts: true, mode: "enforce" },
        storage: { dir: join(tempDir, "data") },
      }),
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("saves truncated tool output as an artifact", async () => {
    const path = await saveToolArtifact("sess-1", "Shell", "full output here", configPath);
    expect(path).toBeTruthy();
    const content = await readFile(path!, "utf8");
    expect(content).toBe("full output here");
  });

  it("persists mode changes via setConfigMode", async () => {
    const next = await setConfigMode("enforce", configPath);
    expect(next.behavior.mode).toBe("enforce");
    const reloaded = await setConfigMode("warn", configPath);
    expect(reloaded.behavior.mode).toBe("warn");
  });
});

describe("hook utils for Claude parity", () => {
  it("normalizes Bash to Shell", () => {
    expect(normalizeToolName("Bash")).toBe("Shell");
    expect(normalizeToolName("bash")).toBe("Shell");
  });

  it("reads Claude tool_response output", () => {
    const output = extractToolOutput({
      tool_response: { content: "hello" },
    });
    expect(output).toContain("hello");
  });
});
