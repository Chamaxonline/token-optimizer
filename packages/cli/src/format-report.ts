import pc from "picocolors";
import type { SessionReport } from "@token-opt/core";

function formatPct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function flagLabel(flag?: string): string {
  if (flag === "over_budget") return pc.yellow(" ⚠ over budget");
  if (flag === "duplicate") return pc.yellow(" ⚠ duplicate");
  if (flag === "large_output") return pc.cyan(" large");
  return "";
}

export function renderReportHuman(
  report: SessionReport,
  options: { title?: string; sessionCount?: number } = {},
): string {
  const lines: string[] = [];
  const title = options.title ?? `Session ${report.sessionId}`;

  lines.push("");
  lines.push(pc.bold(title));

  if (report.durationMin !== null) {
    lines.push(pc.dim(`Duration: ${report.durationMin} min`));
  }

  lines.push("");
  lines.push(`${"Category".padEnd(24)}${"Tokens".padStart(10)}  ${"Count".padStart(8)}`);
  lines.push(pc.dim("─".repeat(46)));
  lines.push(
    `${"Tool outputs".padEnd(24)}${report.estimatedTokens.toolOutputs.toLocaleString().padStart(10)}  ${String(report.toolCallCount).padStart(8)}`,
  );
  lines.push(
    `${"MCP calls".padEnd(24)}${report.estimatedTokens.mcpCalls.toLocaleString().padStart(10)}`,
  );
  lines.push(
    `${"Warnings".padEnd(24)}${"".padStart(10)}  ${String(report.warnCount).padStart(8)}`,
  );
  lines.push(
    `${"Duplicate reads".padEnd(24)}${"".padStart(10)}  ${String(report.duplicateReads).padStart(8)}`,
  );

  if (report.projectedSavings > 0) {
    lines.push("");
    lines.push(
      pc.bold(
        `Projected savings (enforce): ~${report.projectedSavings.toLocaleString()} tokens (${formatPct(report.projectedSavings, Math.max(report.estimatedTokens.total, 1))})`,
      ),
    );
  }

  if (report.topOffenders.length > 0) {
    lines.push("");
    lines.push(pc.bold("Top offenders:"));
    report.topOffenders.slice(0, 5).forEach((offender, index) => {
      const detail = offender.detail ? `  ${offender.detail}` : "";
      lines.push(
        `  ${index + 1}. ${offender.tool}${detail}`.padEnd(50) +
          `${offender.tokens.toLocaleString().padStart(6)} tokens${flagLabel(offender.flag)}`,
      );
    });
  }

  if (options.sessionCount && options.sessionCount > 1) {
    lines.push("");
    lines.push(pc.dim(`Aggregated across ${options.sessionCount} sessions`));
  }

  lines.push("");
  return lines.join("\n");
}

export function renderReportJson(
  report: SessionReport,
  meta: Record<string, unknown> = {},
): string {
  return JSON.stringify({ ...report, ...meta }, null, 2);
}

export function renderReportCsv(reports: SessionReport[]): string {
  const header =
    "sessionId,startedAt,endedAt,durationMin,toolOutputs,mcpCalls,warnCount,duplicateReads,projectedSavings,toolCallCount";
  const rows = reports.map((r) =>
    [
      r.sessionId,
      r.startedAt ?? "",
      r.endedAt ?? "",
      r.durationMin ?? "",
      r.estimatedTokens.toolOutputs,
      r.estimatedTokens.mcpCalls,
      r.warnCount,
      r.duplicateReads,
      r.projectedSavings,
      r.toolCallCount,
    ].join(","),
  );
  return [header, ...rows].join("\n");
}
