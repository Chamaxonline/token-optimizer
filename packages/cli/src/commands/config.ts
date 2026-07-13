import { loadConfig, setConfigMode } from "@token-opt/core";

export async function runConfigShow(): Promise<void> {
  const config = await loadConfig();
  console.log("");
  console.log(`mode:                 ${config.behavior.mode}`);
  console.log(`fail_closed:          ${config.behavior.fail_closed}`);
  console.log(`store_artifacts:      ${config.behavior.store_artifacts}`);
  console.log(`shell_output_chars:   ${config.budgets.shell_output_chars}`);
  console.log(`grep_max_lines:       ${config.budgets.grep_max_lines}`);
  console.log(`mcp_output_chars:     ${config.budgets.mcp_output_chars}`);
  console.log(`duplicate_read_ttl:   ${config.budgets.duplicate_read_ttl_sec}s`);
  console.log(`prompt_max_file_lines:${config.budgets.prompt_max_file_lines}`);
  console.log(`storage:              ${config.storage.dir}`);
  console.log("");
}

export async function runConfigSetMode(mode: string): Promise<void> {
  if (mode !== "warn" && mode !== "enforce") {
    console.error(`Invalid mode "${mode}". Use "warn" or "enforce".`);
    process.exitCode = 1;
    return;
  }

  const next = await setConfigMode(mode);
  console.log(`Mode set to ${next.behavior.mode}.`);
  if (mode === "enforce") {
    console.log("Enforce: over-budget outputs are truncated; duplicate reads are blocked.");
    console.log("Full truncated outputs are saved under ~/.token-optimizer/artifacts/");
  } else {
    console.log("Warn: policies log and warn without blocking or truncating.");
  }
}
