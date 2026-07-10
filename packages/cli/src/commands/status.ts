import { loadConfig } from "@token-opt/core";
import { getStatus } from "./init.js";

export async function runStatus(): Promise<void> {
  const config = await loadConfig();
  const status = await getStatus();
  const sessions = await import("@token-opt/core").then((m) => m.listSessionLogs());

  console.log("");
  console.log(`Config:     ${status.configPath}`);
  console.log(`Mode:       ${config.behavior.mode}`);
  console.log(`Storage:    ${config.storage.dir}`);
  console.log(`Sessions:   ${sessions.length} recorded`);
  console.log(`Hooks:      ${status.hooksInstalled ? "installed" : "not installed"} (${status.hooksJsonPath})`);
  console.log("");
}

export async function runDoctor(): Promise<void> {
  const issues: string[] = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 20) {
    issues.push(`Node.js 20+ required (found ${process.versions.node})`);
  }

  const status = await getStatus();
  if (!status.hooksInstalled) {
    issues.push("Cursor hooks not installed — run `token-opt init`");
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
