import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ensureStorageDirs, getArtifactsDir as getArtifactsRoot, loadConfig } from "./config.js";
import type { TokenOptConfig } from "./session-types.js";

export function getSessionArtifactsDir(
  config: TokenOptConfig,
  sessionId: string,
): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(getArtifactsRoot(config), safe);
}

export async function saveToolArtifact(
  sessionId: string,
  tool: string,
  fullOutput: string,
  configPath?: string,
): Promise<string | null> {
  const config = await loadConfig(configPath);
  if (!config.behavior.store_artifacts) return null;

  await ensureStorageDirs(config);
  const dir = getSessionArtifactsDir(config, sessionId);
  await mkdir(dir, { recursive: true });

  const id = randomUUID().slice(0, 8);
  const safeTool = tool.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = join(dir, `${Date.now()}-${safeTool}-${id}.txt`);
  await writeFile(filePath, fullOutput, "utf8");
  return filePath;
}

export function formatTruncationNotice(
  message: string,
  artifactPath: string | null,
): string {
  if (!artifactPath) return message;
  return `${message}\nFull output saved to: ${artifactPath}`;
}
