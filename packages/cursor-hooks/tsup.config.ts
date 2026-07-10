import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "session-start": "src/session-start.ts",
    "session-end": "src/session-end.ts",
    "post-tool-use": "src/post-tool-use.ts",
    "pre-tool-use-read": "src/pre-tool-use-read.ts",
    "before-submit-prompt": "src/before-submit-prompt.ts",
    "pre-compact": "src/pre-compact.ts",
  },
  format: ["esm"],
  clean: true,
  splitting: false,
  noExternal: [/@token-opt\/.*/],
});
