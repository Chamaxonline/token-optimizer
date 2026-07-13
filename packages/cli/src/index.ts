import { Command } from "commander";
import { runScan } from "./commands/scan.js";
import { runReport } from "./commands/report.js";
import { runInit } from "./commands/init.js";
import { runStatus, runDoctor } from "./commands/status.js";
import { runConfigSetMode, runConfigShow } from "./commands/config.js";

const program = new Command();

program
  .name("token-opt")
  .description("Scan and optimize token usage for Cursor and Claude Code")
  .version("0.4.0");

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
  .description("Install Cursor and/or Claude Code hooks plus default config")
  .option("-p, --path <dir>", "Project directory", process.cwd())
  .option("--cursor", "Install Cursor hooks only")
  .option("--claude", "Install Claude Code hooks only")
  .action(async (options) => {
    try {
      await runInit({
        path: options.path,
        cursor: options.cursor,
        claude: options.claude,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt init failed: ${message}`);
      process.exitCode = 1;
    }
  });

const configCmd = program
  .command("config")
  .description("View or update token-opt configuration");

configCmd
  .command("show")
  .description("Show current config values")
  .action(async () => {
    try {
      await runConfigShow();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt config show failed: ${message}`);
      process.exitCode = 1;
    }
  });

configCmd
  .command("set")
  .description("Set a config value")
  .argument("<key>", "Config key (currently: mode)")
  .argument("<value>", "Value (for mode: warn | enforce)")
  .action(async (key: string, value: string) => {
    try {
      if (key === "mode") {
        await runConfigSetMode(value);
        return;
      }
      console.error(`Unknown config key "${key}". Supported: mode`);
      process.exitCode = 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt config set failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("status")
  .description("Show token-opt config and hook status")
  .option("-p, --path <dir>", "Project directory", process.cwd())
  .action(async (options) => {
    try {
      await runStatus(options.path);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`token-opt status failed: ${message}`);
      process.exitCode = 1;
    }
  });

program
  .command("doctor")
  .description("Verify token-opt installation and configuration")
  .option("-p, --path <dir>", "Project directory", process.cwd())
  .action(async (options) => {
    await runDoctor(options.path);
  });

program.parseAsync(process.argv);
