import { listSessionLogs, loadConfig } from "@token-opt/core";
import { getStatus } from "./init.js";

export async function runStatus(projectRoot = process.cwd()): Promise<void> {
  const config = await loadConfig();
  const status = await getStatus(projectRoot);
  const sessions = await listSessionLogs();

  console.log("");
  console.log(`Config:      ${status.configPath}`);
  console.log(`Mode:        ${config.behavior.mode}`);
  console.log(`Artifacts:   ${config.behavior.store_artifacts ? "on" : "off"}`);
  console.log(`Storage:     ${config.storage.dir}`);
  console.log(`Sessions:    ${sessions.length} recorded`);
  console.log(
    `Cursor:      ${status.cursorHooksInstalled ? "installed" : "not installed"} (${status.cursorHooksJsonPath})`,
  );
  console.log(
    `Claude:      ${status.claudeHooksInstalled ? "installed" : "not installed"} (${status.claudeSettingsPath})`,
  );
  console.log("");
}

export async function runDoctor(projectRoot = process.cwd()): Promise<void> {
  const issues: string[] = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 20) {
    issues.push(`Node.js 20+ required (found ${process.versions.node})`);
  }

  const status = await getStatus(projectRoot);
  if (!status.cursorHooksInstalled && !status.claudeHooksInstalled) {
    issues.push("No hooks installed — run `token-opt init` (or `--cursor` / `--claude`)");
  }

  try {
    await loadConfig();
  } catch (err) {
    issues.push(`Config error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (issues.length === 0) {
    console.log("token-opt doctor: all checks passed.");
    return;
  }

  console.log("token-opt doctor found issues:");
  issues.forEach((issue, index) => {
    console.log(`  ${index + 1}. ${issue}`);
  });
  process.exitCode = 1;
}
