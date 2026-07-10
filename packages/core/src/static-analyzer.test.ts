import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scanStaticContext } from "./static-analyzer.js";

const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

describe("scanStaticContext", () => {
  it("finds rules, MCP, and Claude context in sample repo", async () => {
    const sampleRoot = resolve(repoRoot, "examples/sample-repo");
    const result = await scanStaticContext({ rootDir: sampleRoot });

    expect(result.totalEstimatedTokens).toBeGreaterThan(0);
    expect(result.categories.some((c) => c.id === "cursor-rules")).toBe(true);
    expect(result.categories.some((c) => c.id === "mcp-schemas")).toBe(true);
    expect(result.categories.some((c) => c.id === "claude-context")).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
