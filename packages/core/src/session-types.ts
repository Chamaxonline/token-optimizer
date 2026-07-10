export type PolicyMode = "warn" | "enforce";

export type PolicyAction = "allow" | "warn" | "truncate" | "deny";

export interface PolicyResult {
  action: PolicyAction;
  message?: string;
  userMessage?: string;
  agentMessage?: string;
  outputChars?: number;
  estimatedTokens?: number;
  estimatedTokensSaved?: number;
  truncatedOutput?: string;
  flag?: "over_budget" | "duplicate" | "large_file" | "large_output";
}

export interface TokenOptConfig {
  version: number;
  budgets: {
    shell_output_chars: number;
    grep_max_lines: number;
    mcp_output_chars: number;
    duplicate_read_ttl_sec: number;
    prompt_max_file_lines: number;
  };
  behavior: {
    mode: PolicyMode;
    fail_closed: boolean;
    store_artifacts: boolean;
  };
  storage: {
    dir: string;
  };
}

export type SessionEventType =
  | "session_start"
  | "session_end"
  | "tool_use"
  | "pre_compact"
  | "policy_warning";

export interface SessionEvent {
  type: SessionEventType;
  timestamp: string;
  sessionId: string;
  tool?: string;
  detail?: string;
  input?: unknown;
  outputChars?: number;
  estimatedTokens?: number;
  warning?: string;
  metadata?: Record<string, unknown>;
}

export interface TopOffender {
  tool: string;
  detail: string;
  tokens: number;
  flag?: "over_budget" | "duplicate" | "large_output";
  timestamp: string;
}

export interface SessionReport {
  sessionId: string;
  startedAt: string | null;
  endedAt: string | null;
  durationMin: number | null;
  estimatedTokens: {
    toolOutputs: number;
    mcpCalls: number;
    total: number;
  };
  warnCount: number;
  duplicateReads: number;
  toolCallCount: number;
  projectedSavings: number;
  topOffenders: TopOffender[];
}

export interface ReportSummary extends SessionReport {
  source: "session" | "aggregate";
  sessionCount?: number;
}
