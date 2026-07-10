import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { saveDefaultConfig, getConfigPath } from "@token-opt/core";

const HOOK_FILES = [
  "session-start.js",
  "session-end.js",
  "post-tool-use.js",
  "pre-tool-use-read.js",
  "before-submit-prompt.js",
  "pre-compact.js",
];

function findHooksDistDir(): string {
  const fromCwd = resolve(process.cwd(), "packages/cursor-hooks/dist");
  const fromPackage = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../cursor-hooks/dist",
  );
  return fromPackage;
}

function findHooksJsonTemplate(): string {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../cursor-hooks/hooks.json",
  );
}

export interface InitOptions {
  path?: string;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const projectRoot = resolve(options.path ?? process.cwd());
  const hooksDir = join(projectRoot, ".cursor", "hooks");
  const hooksJsonPath = join(projectRoot, ".cursor", "hooks.json");
  const distDir = findHooksDistDir();
  const templatePath = findHooksJsonTemplate();

  await mkdir(hooksDir, { recursive: true });

  for (const file of HOOK_FILES) {
    await copyFile(join(distDir, file), join(hooksDir, file));
  }

  await copyFile(templatePath, hooksJsonPath);

  const configPath = await saveDefaultConfig();

  console.log("token-opt hooks installed.");
  console.log(`  Hooks:  ${hooksJsonPath}`);
  console.log(`  Config: ${configPath}`);
  console.log("");
  console.log("Restart Cursor, then use Agent mode. Run `token-opt report` after a session.");
}

export async function getStatus(projectRoot = process.cwd()): Promise<{
  hooksInstalled: boolean;
  hooksJsonPath: string;
  configPath: string;
}> {
  const hooksJsonPath = join(resolve(projectRoot), ".cursor", "hooks.json");
  let hooksInstalled = false;

  try {
    const { access } = await import("node:fs/promises");
    await access(hooksJsonPath);
    hooksInstalled = true;
  } catch {
    hooksInstalled = false;
  }

  return {
    hooksInstalled,
    hooksJsonPath,
    configPath: getConfigPath(),
  };
}
