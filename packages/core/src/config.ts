import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import type { TokenOptConfig } from "./session-types.js";

const configSchema = z.object({
  version: z.number().default(1),
  budgets: z
    .object({
      shell_output_chars: z.number().default(8000),
      grep_max_lines: z.number().default(200),
      mcp_output_chars: z.number().default(16000),
      duplicate_read_ttl_sec: z.number().default(600),
      prompt_max_file_lines: z.number().default(500),
    })
    .default({}),
  behavior: z
    .object({
      mode: z.enum(["warn", "enforce"]).default("warn"),
      fail_closed: z.boolean().default(false),
      store_artifacts: z.boolean().default(true),
    })
    .default({}),
  storage: z
    .object({
      dir: z.string().default(join(homedir(), ".token-optimizer")),
    })
    .default({}),
});

export const DEFAULT_CONFIG: TokenOptConfig = {
  version: 1,
  budgets: {
    shell_output_chars: 8000,
    grep_max_lines: 200,
    mcp_output_chars: 16000,
    duplicate_read_ttl_sec: 600,
    prompt_max_file_lines: 500,
  },
  behavior: {
    mode: "warn",
    fail_closed: false,
    store_artifacts: true,
  },
  storage: {
    dir: join(homedir(), ".token-optimizer"),
  },
};

function expandHome(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

export function getConfigPath(config?: TokenOptConfig): string {
  const dir = config?.storage.dir ?? DEFAULT_CONFIG.storage.dir;
  return join(expandHome(dir), "config.yaml");
}

export async function loadConfig(configPath?: string): Promise<TokenOptConfig> {
  const path = configPath ?? getConfigPath();

  try {
    const raw = await readFile(path, "utf8");
    const parsed = configSchema.parse(parseYaml(raw));
    return {
      ...parsed,
      storage: {
        dir: expandHome(parsed.storage.dir),
      },
    };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { ...DEFAULT_CONFIG };
    }
    throw err;
  }
}

export async function saveDefaultConfig(configPath?: string): Promise<string> {
  const path = configPath ?? getConfigPath();
  const dir = join(path, "..");
  await mkdir(dir, { recursive: true });
  await writeFile(path, stringifyYaml(DEFAULT_CONFIG), "utf8");
  return path;
}

export function getSessionsDir(config: TokenOptConfig): string {
  return join(expandHome(config.storage.dir), "sessions");
}

export function getSummariesDir(config: TokenOptConfig): string {
  return join(expandHome(config.storage.dir), "summaries");
}

export function getStateDir(config: TokenOptConfig): string {
  return join(expandHome(config.storage.dir), "state");
}

export function getArtifactsDir(config: TokenOptConfig): string {
  return join(expandHome(config.storage.dir), "artifacts");
}

export async function ensureStorageDirs(config: TokenOptConfig): Promise<void> {
  await mkdir(getSessionsDir(config), { recursive: true });
  await mkdir(getSummariesDir(config), { recursive: true });
  await mkdir(getStateDir(config), { recursive: true });
  await mkdir(getArtifactsDir(config), { recursive: true });
}

export async function saveConfig(
  config: TokenOptConfig,
  configPath?: string,
): Promise<string> {
  const path = configPath ?? getConfigPath(config);
  const dir = join(path, "..");
  await mkdir(dir, { recursive: true });
  const toWrite: TokenOptConfig = {
    ...config,
    storage: {
      dir: config.storage.dir.startsWith(homedir())
        ? `~/${config.storage.dir.slice(homedir().length + 1).replace(/\\/g, "/")}`
        : config.storage.dir,
    },
  };
  await writeFile(path, stringifyYaml(toWrite), "utf8");
  return path;
}

export async function setConfigMode(
  mode: "warn" | "enforce",
  configPath?: string,
): Promise<TokenOptConfig> {
  const path = configPath ?? getConfigPath();
  const current = await loadConfig(path);
  const next: TokenOptConfig = {
    ...current,
    behavior: {
      ...current.behavior,
      mode,
    },
  };
  await saveConfig(next, path);
  return next;
}
