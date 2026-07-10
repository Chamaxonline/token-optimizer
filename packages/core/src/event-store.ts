import { appendFile, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ensureStorageDirs,
  getSessionsDir,
  getSummariesDir,
  loadConfig,
} from "./config.js";
import type { SessionEvent, SessionReport } from "./session-types.js";
import { buildSessionReport } from "./reporter.js";

export function getSessionLogPath(sessionId: string, sessionsDir: string): string {
  return join(sessionsDir, `${sanitizeSessionId(sessionId)}.jsonl`);
}

function sanitizeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function appendSessionEvent(
  sessionId: string,
  event: Omit<SessionEvent, "sessionId" | "timestamp"> & { timestamp?: string },
  configPath?: string,
): Promise<void> {
  const config = await loadConfig(configPath);
  await ensureStorageDirs(config);

  const record: SessionEvent = {
    ...event,
    sessionId,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  const logPath = getSessionLogPath(sessionId, getSessionsDir(config));
  await appendFile(logPath, `${JSON.stringify(record)}\n`, "utf8");
}

export async function readSessionEvents(
  sessionId: string,
  configPath?: string,
): Promise<SessionEvent[]> {
  const config = await loadConfig(configPath);
  const logPath = getSessionLogPath(sessionId, getSessionsDir(config));

  try {
    const raw = await readFile(logPath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SessionEvent);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

export interface SessionIndexEntry {
  sessionId: string;
  logPath: string;
  mtimeMs: number;
}

export async function listSessionLogs(configPath?: string): Promise<SessionIndexEntry[]> {
  const config = await loadConfig(configPath);
  const sessionsDir = getSessionsDir(config);

  try {
    const files = await readdir(sessionsDir);
    const entries: SessionIndexEntry[] = [];

    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const sessionId = file.replace(/\.jsonl$/, "");
      const logPath = join(sessionsDir, file);
      const { mtimeMs } = await stat(logPath);
      entries.push({ sessionId, logPath, mtimeMs });
    }

    return entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

export async function saveSessionSummary(
  report: SessionReport,
  configPath?: string,
): Promise<void> {
  const config = await loadConfig(configPath);
  await ensureStorageDirs(config);
  const summaryPath = join(
    getSummariesDir(config),
    `${sanitizeSessionId(report.sessionId)}.json`,
  );
  await writeFile(summaryPath, JSON.stringify(report, null, 2), "utf8");
}

export async function loadSessionSummary(
  sessionId: string,
  configPath?: string,
): Promise<SessionReport | null> {
  const config = await loadConfig(configPath);
  const summaryPath = join(
    getSummariesDir(config),
    `${sanitizeSessionId(sessionId)}.json`,
  );

  try {
    const raw = await readFile(summaryPath, "utf8");
    return JSON.parse(raw) as SessionReport;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

export async function finalizeSession(
  sessionId: string,
  configPath?: string,
): Promise<SessionReport> {
  const events = await readSessionEvents(sessionId, configPath);
  const config = await loadConfig(configPath);
  const report = buildSessionReport(sessionId, events, config);
  await saveSessionSummary(report, configPath);
  return report;
}
