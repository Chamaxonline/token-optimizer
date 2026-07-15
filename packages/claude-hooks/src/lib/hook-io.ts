import { stdin } from "node:process";

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Cursor/Claude may prepend NUL/BOM/invisible bytes before the JSON payload. */
export function parseHookJson<T extends Record<string, unknown>>(raw: string): T {
  let text = raw.replace(/^[\u0000-\u001F\uFEFF]+/, "").trim();
  if (!text) return {} as T;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }

  return JSON.parse(text) as T;
}

export async function readHookInput<T extends Record<string, unknown>>(): Promise<T> {
  const raw = await readStdin();
  return parseHookJson<T>(raw);
}

export function writeHookOutput(output: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

export function claudeHookOutput(
  eventName: string,
  specific: Record<string, unknown>,
  topLevel: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...topLevel,
    hookSpecificOutput: {
      hookEventName: eventName,
      ...specific,
    },
  };
}

export async function runHook(
  handler: (input: Record<string, unknown>) => Promise<Record<string, unknown> | void>,
): Promise<void> {
  try {
    const input = await readHookInput<Record<string, unknown>>();
    const output = await handler(input);
    if (output && Object.keys(output).length > 0) {
      writeHookOutput(output);
    }
  } catch (err) {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    try {
      process.stderr.write(`[token-opt] hook error: ${message}\n`);
    } catch {
      // ignore
    }
    process.exit(0);
  }
}
