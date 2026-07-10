import {
  aggregateReports,
  buildSessionReport,
  finalizeSession,
  listSessionLogs,
  loadConfig,
  loadSessionSummary,
  readSessionEvents,
} from "@token-opt/core";
import {
  renderReportCsv,
  renderReportHuman,
  renderReportJson,
} from "../format-report.js";

export interface ReportCommandOptions {
  session?: string;
  last?: number;
  all?: boolean;
  json?: boolean;
  exportFormat?: "json" | "csv";
}

async function loadReportForSession(sessionId: string): Promise<import("@token-opt/core").SessionReport> {
  const summary = await loadSessionSummary(sessionId);
  if (summary) return summary;

  const events = await readSessionEvents(sessionId);
  if (events.length > 0) {
    const config = await loadConfig();
    return buildSessionReport(sessionId, events, config);
  }

  return finalizeSession(sessionId);
}

export async function runReport(options: ReportCommandOptions): Promise<void> {
  const sessions = await listSessionLogs();

  if (sessions.length === 0) {
    console.log("No sessions recorded yet.");
    console.log("Run `token-opt init` in your project, use Cursor Agent, then try again.");
    return;
  }

  let reports: import("@token-opt/core").SessionReport[] = [];

  if (options.all || (options.last && options.last > 1)) {
    const count = options.all ? sessions.length : options.last!;
    const selected = sessions.slice(0, count);
    reports = await Promise.all(
      selected.map((entry) => loadReportForSession(entry.sessionId)),
    );
  } else if (options.session) {
    reports = [await loadReportForSession(options.session)];
  } else {
    const latest = sessions[0]!;
    reports = [await loadReportForSession(latest.sessionId)];
  }

  if (options.exportFormat === "csv") {
    console.log(renderReportCsv(reports));
    return;
  }

  if (options.json) {
    if (reports.length === 1) {
      console.log(renderReportJson(reports[0]!));
      return;
    }
    const aggregate = aggregateReports(reports);
    console.log(
      renderReportJson(aggregate, {
        sessions: reports,
        sessionCount: reports.length,
      }),
    );
    return;
  }

  if (reports.length === 1) {
    console.log(renderReportHuman(reports[0]!));
    return;
  }

  const aggregate = aggregateReports(reports);
  console.log(
    renderReportHuman(aggregate, {
      title: "Aggregate session report",
      sessionCount: reports.length,
    }),
  );
}
