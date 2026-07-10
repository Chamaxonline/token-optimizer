import { resolve } from "node:path";
import { scanStaticContext } from "@token-opt/core";
import { renderScanHuman, renderScanJson } from "../format.js";

export interface ScanCommandOptions {
  json?: boolean;
  cursor?: boolean;
  claude?: boolean;
  fixSuggestions?: boolean;
  path?: string;
}

export async function runScan(options: ScanCommandOptions): Promise<void> {
  const rootDir = resolve(options.path ?? process.cwd());

  const result = await scanStaticContext({
    rootDir,
    includeUserCursor: options.cursor ?? false,
    includeUserClaude: options.claude ?? false,
  });

  if (options.json) {
    console.log(renderScanJson(result));
    return;
  }

  console.log(renderScanHuman(result));

  if (options.fixSuggestions && result.suggestions.length > 0) {
    console.log("Run with --json for machine-readable fix suggestions.");
  }
}
