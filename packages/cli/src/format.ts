import pc from "picocolors";
import type { ScanResult } from "@token-opt/core";

function formatPct(tokens: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((tokens / total) * 100)}%`;
}

function warnFlag(tokens: number, total: number): string {
  const pct = total === 0 ? 0 : tokens / total;
  return pct >= 0.5 ? pc.yellow(" ⚠") : "";
}

export function renderScanHuman(result: ScanResult): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(
    pc.bold(
      `Static context estimate: ${result.totalEstimatedTokens.toLocaleString()} tokens (estimated)`,
    ),
  );
  lines.push(pc.dim(`Scanned: ${result.rootDir}`));
  lines.push("");

  if (result.categories.length === 0) {
    lines.push(pc.dim("No static context files found."));
    lines.push("");
    lines.push(pc.dim("Looked for:"));
    lines.push(pc.dim("  .cursor/rules/**  AGENTS.md  .cursor/mcp.json"));
    lines.push(pc.dim("  CLAUDE.md  .claude/**  .mcp.json"));
    lines.push("");
    return lines.join("\n");
  }

  const labelWidth = 32;
  lines.push(
    `${"Category".padEnd(labelWidth)}${"Tokens".padStart(8)}  ${"Share".padStart(6)}`,
  );
  lines.push(pc.dim("─".repeat(labelWidth + 18)));

  for (const category of result.categories) {
    const label = category.label.padEnd(labelWidth);
    const tokens = category.tokens.toLocaleString().padStart(8);
    const share = formatPct(category.tokens, result.totalEstimatedTokens).padStart(6);
    lines.push(`${label}${tokens}  ${share}${warnFlag(category.tokens, result.totalEstimatedTokens)}`);
  }

  if (result.suggestions.length > 0) {
    lines.push("");
    lines.push(pc.bold("Suggestions:"));
    result.suggestions.forEach((s, i) => {
      const icon = s.severity === "warning" ? pc.yellow("⚠") : pc.cyan("•");
      const savings = s.estimatedSavings > 0 ? pc.dim(` (~-${s.estimatedSavings.toLocaleString()} tokens)`) : "";
      lines.push(`  ${i + 1}. ${icon} ${s.message}${savings}`);
    });
  }

  lines.push("");
  lines.push(pc.dim(`Files scanned: ${result.categories.reduce((n, c) => n + c.files.length, 0)}`));
  lines.push("");

  return lines.join("\n");
}

export function renderScanJson(result: ScanResult): string {
  const breakdown = Object.fromEntries(
    result.categories.map((c) => [
      c.id,
      {
        label: c.label,
        tokens: c.tokens,
        pct: result.totalEstimatedTokens
          ? Math.round((c.tokens / result.totalEstimatedTokens) * 1000) / 10
          : 0,
        files: c.files,
      },
    ]),
  );

  return JSON.stringify(
    {
      totalEstimatedTokens: result.totalEstimatedTokens,
      breakdown,
      suggestions: result.suggestions,
      rootDir: result.rootDir,
      scannedAt: result.scannedAt,
    },
    null,
    2,
  );
}
