import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("cl100k_base");

/** Estimate token count using cl100k_base (approximates Claude/GPT-4 family). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return encoding.encode(text).length;
}

/** Heuristic tokens-per-server when full MCP schemas are unavailable. */
export const MCP_SERVER_TOKEN_HEURISTIC = 1100;

/** Rough tokens for a typical Cursor/Claude skill file. */
export const SKILL_FILE_TOKEN_HEURISTIC = 600;
