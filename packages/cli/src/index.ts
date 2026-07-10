import { Command } from "commander";
import { runScan } from "./commands/scan.js";

const program = new Command();

program
  .name("token-opt")
  .description("Scan and optimize token usage for Cursor and Claude Code")
  .version("0.1.0");

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

program.parseAsync(process.argv);
