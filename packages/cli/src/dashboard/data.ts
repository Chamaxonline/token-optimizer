import {
  aggregateReports,
  buildSessionReport,
  listSessionLogs,
  loadConfig,
  loadSessionSummary,
  readSessionEvents,
  type SessionReport,
  type TokenOptConfig,
} from "@token-opt/core";

export interface DashboardSessionRow {
  sessionId: string;
  mtimeMs: number;
  toolCallCount: number;
  totalTokens: number;
  warnCount: number;
  duplicateReads: number;
  projectedSavings: number;
  startedAt: string | null;
  endedAt: string | null;
  durationMin: number | null;
}

export interface DashboardOverview {
  generatedAt: string;
  config: {
    mode: TokenOptConfig["behavior"]["mode"];
    storeArtifacts: boolean;
    storageDir: string;
    budgets: TokenOptConfig["budgets"];
  };
  totals: {
    sessionCount: number;
    toolOutputs: number;
    mcpCalls: number;
    warnCount: number;
    duplicateReads: number;
    projectedSavings: number;
    toolCallCount: number;
  };
  sessions: DashboardSessionRow[];
  aggregateTopOffenders: SessionReport["topOffenders"];
}

async function loadReportForSession(sessionId: string): Promise<SessionReport> {
  const summary = await loadSessionSummary(sessionId);
  if (summary) return summary;

  const events = await readSessionEvents(sessionId);
  const config = await loadConfig();
  if (events.length > 0) {
    return buildSessionReport(sessionId, events, config);
  }

  return {
    sessionId,
    startedAt: null,
    endedAt: null,
    durationMin: null,
    estimatedTokens: { toolOutputs: 0, mcpCalls: 0, total: 0 },
    warnCount: 0,
    duplicateReads: 0,
    toolCallCount: 0,
    projectedSavings: 0,
    topOffenders: [],
  };
}

export async function getDashboardOverview(limit = 50): Promise<DashboardOverview> {
  const config = await loadConfig();
  const logs = await listSessionLogs();
  const selected = logs.slice(0, limit);

  const reports = await Promise.all(
    selected.map(async (entry) => {
      const report = await loadReportForSession(entry.sessionId);
      return { entry, report };
    }),
  );

  const sessions: DashboardSessionRow[] = reports.map(({ entry, report }) => ({
    sessionId: entry.sessionId,
    mtimeMs: entry.mtimeMs,
    toolCallCount: report.toolCallCount,
    totalTokens: report.estimatedTokens.total,
    warnCount: report.warnCount,
    duplicateReads: report.duplicateReads,
    projectedSavings: report.projectedSavings,
    startedAt: report.startedAt,
    endedAt: report.endedAt,
    durationMin: report.durationMin,
  }));

  const aggregate = aggregateReports(reports.map((r) => r.report));

  return {
    generatedAt: new Date().toISOString(),
    config: {
      mode: config.behavior.mode,
      storeArtifacts: config.behavior.store_artifacts,
      storageDir: config.storage.dir,
      budgets: config.budgets,
    },
    totals: {
      sessionCount: logs.length,
      toolOutputs: aggregate.estimatedTokens.toolOutputs,
      mcpCalls: aggregate.estimatedTokens.mcpCalls,
      warnCount: aggregate.warnCount,
      duplicateReads: aggregate.duplicateReads,
      projectedSavings: aggregate.projectedSavings,
      toolCallCount: aggregate.toolCallCount,
    },
    sessions,
    aggregateTopOffenders: aggregate.topOffenders,
  };
}

export async function getDashboardSession(
  sessionId: string,
): Promise<SessionReport & { events: Awaited<ReturnType<typeof readSessionEvents>> }> {
  const report = await loadReportForSession(sessionId);
  const events = await readSessionEvents(sessionId);
  return { ...report, events };
}
