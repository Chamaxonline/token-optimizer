import { Command } from "commander";
import { runScan } from "./commands/scan.js";
import { runReport } from "./commands/report.js";
import { runInit } from "./commands/init.js";
import { runStatus, runDoctor } from "./commands/status.js";

const program = new Command();

program
  .name("token-opt")
  .description("Scan and optimize token usage for Cursor and Claude Code")
  .version("0.3.0");

program
  .command("scan")
  .description("Estimate static context token cost (rules, MCP, project docs)")
  .option("--json", "Output machine-readable JSON")
  .option("--cursor", "Include user-level Cursor config (~/.cursor)")
  .option("--claude", "Include user-level Claude Code config (~/.claude)")
  .option("--fix-suggestions", "Print remediation hints (default: on in human mode)")
  .option("-p, --path <dir>", "Project directory to scan", process.cwd())
  .action(async (options) => {
    try {
      await runScan({
        json: options.json,
        cursor: options.cursor,
        claude: options.claude,
        fixSuggestions: options.fixSuggestions ?? !options.json,
        path: options.path,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt scan failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("report")
  .description("Show token usage report from recorded agent sessions")
  .option("--session <id>", "Report a specific session id")
  .option("--last <n>", "Report the last N sessions", (v) => Number(v))
  .option("--all", "Aggregate all recorded sessions")
  .option("--json", "Output machine-readable JSON")
  .option("--export <format>", "Export format: json or csv")
  .action(async (options) => {
    try {
      await runReport({
        session: options.session,
        last: options.last,
        all: options.all,
        json: options.json,
        exportFormat: options.export,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt report failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("init")
  .description("Install Cursor hooks and default config for session tracking")
  .option("-p, --path <dir>", "Project directory", process.cwd())
  .action(async (options) => {
    try {
      await runInit({ path: options.path });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt init failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("status")
  .description("Show token-opt config and hook status")
  .action(async () => {
    try {
      await runStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt status failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("doctor")
  .description("Verify token-opt installation and configuration")
  .action(async () => {
    await runDoctor();
  });

program.parseAsync(process.argv);
