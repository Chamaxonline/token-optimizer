export interface ScanCategory {
  id: string;
  label: string;
  tokens: number;
  files: string[];
}

export interface ScanSuggestion {
  message: string;
  estimatedSavings: number;
  severity: "info" | "warning";
}

export interface ScanResult {
  rootDir: string;
  totalEstimatedTokens: number;
  categories: ScanCategory[];
  suggestions: ScanSuggestion[];
  scannedAt: string;
}

export interface ScanOptions {
  rootDir: string;
  includeUserCursor?: boolean;
  includeUserClaude?: boolean;
}

export interface McpServerInfo {
  name: string;
  estimatedTokens: number;
  source: string;
}
