import type { TokenOptConfig } from "./session-types.js";
import type { SessionEvent, SessionReport, TopOffender } from "./session-types.js";
import { estimateTokens } from "./tokenizer.js";

function isMcpTool(tool: string): boolean {
  return tool.toLowerCase().includes("mcp");
}

function toolBudgetChars(tool: string, config: TokenOptConfig): number {
  const name = tool.toLowerCase();
  if (name.includes("grep")) {
    return config.budgets.grep_max_lines * 80;
  }
  if (isMcpTool(tool)) {
    return config.budgets.mcp_output_chars;
  }
  if (name.includes("shell") || name === "bash") {
    return config.budgets.shell_output_chars;
  }
  return config.budgets.shell_output_chars;
}

function extractToolDetail(event: SessionEvent): string {
  if (event.detail) return event.detail;
  if (typeof event.input === "string") return event.input.slice(0, 120);
  if (event.input && typeof event.input === "object") {
    const input = event.input as Record<string, unknown>;
    const command = input.command ?? input.pattern ?? input.path ?? input.file_path;
    if (typeof command === "string") return command.slice(0, 120);
  }
  return "";
}

function minutesBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return null;
  return Math.round(ms / 60000);
}

export function buildSessionReport(
  sessionId: string,
  events: SessionEvent[],
  config: TokenOptConfig,
): SessionReport {
  const startedAt =
    events.find((e) => e.type === "session_start")?.timestamp ?? null;
  const endedAt = events.find((e) => e.type === "session_end")?.timestamp ?? null;

  const toolEvents = events.filter((e) => e.type === "tool_use");
  const readPaths = new Map<string, number>();

  let toolOutputs = 0;
  let mcpCalls = 0;
  let warnCount = 0;
  let duplicateReads = 0;
  let projectedSavings = 0;

  const offenders: TopOffender[] = [];

  for (const event of toolEvents) {
    const tool = event.tool ?? "unknown";
    const tokens = event.estimatedTokens ?? estimateTokens(String(event.detail ?? ""));
    const outputChars = event.outputChars ?? 0;
    const detail = extractToolDetail(event);

    toolOutputs += tokens;
    if (isMcpTool(tool)) mcpCalls += tokens;
    if (event.warning) warnCount += 1;

    let flag: TopOffender["flag"] | undefined;

    const budget = toolBudgetChars(tool, config);
    if (outputChars > budget) {
      flag = "over_budget";
      projectedSavings += Math.max(0, tokens - estimateTokens("x".repeat(budget)));
    } else if (outputChars > config.budgets.shell_output_chars * 0.75) {
      flag = "large_output";
    }

    if (tool.toLowerCase().includes("read") && detail) {
      const count = (readPaths.get(detail) ?? 0) + 1;
      readPaths.set(detail, count);
      if (count > 1) {
        duplicateReads += 1;
        flag = "duplicate";
        projectedSavings += tokens;
      }
    }

    offenders.push({
      tool,
      detail,
      tokens,
      flag,
      timestamp: event.timestamp,
    });
  }

  offenders.sort((a, b) => b.tokens - a.tokens);

  return {
    sessionId,
    startedAt,
    endedAt,
    durationMin: minutesBetween(startedAt, endedAt),
    estimatedTokens: {
      toolOutputs,
      mcpCalls,
      total: toolOutputs,
    },
    warnCount,
    duplicateReads,
    toolCallCount: toolEvents.length,
    projectedSavings,
    topOffenders: offenders.slice(0, 10),
  };
}

export function aggregateReports(reports: SessionReport[]): SessionReport {
  if (reports.length === 0) {
    return {
      sessionId: "aggregate",
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

  const allOffenders = reports.flatMap((r) => r.topOffenders);
  allOffenders.sort((a, b) => b.tokens - a.tokens);

  return {
    sessionId: "aggregate",
    startedAt: reports.at(-1)?.startedAt ?? null,
    endedAt: reports[0]?.endedAt ?? null,
    durationMin: reports.reduce((sum, r) => sum + (r.durationMin ?? 0), 0),
    estimatedTokens: {
      toolOutputs: reports.reduce((sum, r) => sum + r.estimatedTokens.toolOutputs, 0),
      mcpCalls: reports.reduce((sum, r) => sum + r.estimatedTokens.mcpCalls, 0),
      total: reports.reduce((sum, r) => sum + r.estimatedTokens.total, 0),
    },
    warnCount: reports.reduce((sum, r) => sum + r.warnCount, 0),
    duplicateReads: reports.reduce((sum, r) => sum + r.duplicateReads, 0),
    toolCallCount: reports.reduce((sum, r) => sum + r.toolCallCount, 0),
    projectedSavings: reports.reduce((sum, r) => sum + r.projectedSavings, 0),
    topOffenders: allOffenders.slice(0, 10),
  };
}
