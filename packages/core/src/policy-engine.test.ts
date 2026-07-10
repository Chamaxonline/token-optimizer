import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config.js";
import {
  evaluateDuplicateReadPolicy,
  evaluateToolOutputPolicy,
  findPromptFileReferences,
} from "./policy-engine.js";

describe("policy-engine", () => {
  it("warns when shell output exceeds budget in warn mode", () => {
    const output = "x".repeat(DEFAULT_CONFIG.budgets.shell_output_chars + 10);
    const result = evaluateToolOutputPolicy("Shell", output, DEFAULT_CONFIG);
    expect(result.action).toBe("warn");
    expect(result.flag).toBe("over_budget");
  });

  it("truncates shell output in enforce mode", () => {
    const config = {
      ...DEFAULT_CONFIG,
      behavior: { ...DEFAULT_CONFIG.behavior, mode: "enforce" as const },
    };
    const output = "x".repeat(config.budgets.shell_output_chars + 10);
    const result = evaluateToolOutputPolicy("Shell", output, config);
    expect(result.action).toBe("truncate");
    expect(result.truncatedOutput?.length).toBe(config.budgets.shell_output_chars);
  });

  it("warns on duplicate reads in warn mode", () => {
    const result = evaluateDuplicateReadPolicy("src/app.ts", true, DEFAULT_CONFIG);
    expect(result.action).toBe("warn");
    expect(result.flag).toBe("duplicate");
  });

  it("denies duplicate reads in enforce mode", () => {
    const config = {
      ...DEFAULT_CONFIG,
      behavior: { ...DEFAULT_CONFIG.behavior, mode: "enforce" as const },
    };
    const result = evaluateDuplicateReadPolicy("src/app.ts", true, config);
    expect(result.action).toBe("deny");
  });

  it("finds file references in prompts", () => {
    const refs = findPromptFileReferences(
      'Please review @src/app.ts and "lib/utils.js" for issues',
    );
    expect(refs).toContain("src/app.ts");
    expect(refs).toContain("lib/utils.js");
  });
});
