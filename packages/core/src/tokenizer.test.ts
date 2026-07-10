import { describe, expect, it } from "vitest";
import { estimateTokens } from "./tokenizer.js";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("counts tokens for known text", () => {
    const tokens = estimateTokens("Hello, world!");
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });
});
