import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getStateDir, loadConfig } from "./config.js";

interface ReadRecord {
  path: string;
  readAt: number;
}

interface SessionReadState {
  reads: ReadRecord[];
}

function statePath(stateDir: string, sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(stateDir, `${safe}.json`);
}

async function loadState(
  stateDir: string,
  sessionId: string,
): Promise<SessionReadState> {
  try {
    const raw = await readFile(statePath(stateDir, sessionId), "utf8");
    return JSON.parse(raw) as SessionReadState;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { reads: [] };
    throw err;
  }
}

async function saveState(
  stateDir: string,
  sessionId: string,
  state: SessionReadState,
): Promise<void> {
  await writeFile(statePath(stateDir, sessionId), JSON.stringify(state), "utf8");
}

export async function recordRead(
  sessionId: string,
  filePath: string,
  configPath?: string,
): Promise<void> {
  const config = await loadConfig(configPath);
  const stateDir = getStateDir(config);
  await mkdir(stateDir, { recursive: true });

  const state = await loadState(stateDir, sessionId);
  const normalized = filePath.replace(/\\/g, "/");
  state.reads.push({ path: normalized, readAt: Date.now() });
  await saveState(stateDir, sessionId, state);
}

export async function checkDuplicateRead(
  sessionId: string,
  filePath: string,
  ttlSec: number,
  configPath?: string,
): Promise<{ isDuplicate: boolean; lastReadAt: number | null }> {
  const config = await loadConfig(configPath);
  const stateDir = getStateDir(config);
  const state = await loadState(stateDir, sessionId);
  const normalized = filePath.replace(/\\/g, "/");
  const cutoff = Date.now() - ttlSec * 1000;

  const prior = state.reads
    .filter((r) => r.path === normalized && r.readAt >= cutoff)
    .sort((a, b) => b.readAt - a.readAt);

  if (prior.length === 0) {
    return { isDuplicate: false, lastReadAt: null };
  }

  return { isDuplicate: true, lastReadAt: prior[0]!.readAt };
}

export async function clearSessionState(
  sessionId: string,
  configPath?: string,
): Promise<void> {
  const config = await loadConfig(configPath);
  const stateDir = getStateDir(config);
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(statePath(stateDir, sessionId));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}
