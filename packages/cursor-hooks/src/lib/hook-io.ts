import { stdin } from "node:process";

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Cursor may prepend BOM / invisible bytes before the JSON payload. */
export function parseHookJson<T extends Record<string, unknown>>(raw: string): T {
  let text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new SyntaxError(
      `Unexpected token in hook stdin (len=${raw.length}, first=${JSON.stringify(raw.slice(0, 8))})`,
    );
  }
}

export async function readHookInput<T extends Record<string, unknown>>(): Promise<T> {
  const raw = await readStdin();
  return parseHookJson<T>(raw);
}

export function writeHookOutput(output: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(output)}\n`);
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
    // Fail open — never block agent work due to token-opt errors
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    try {
      process.stderr.write(`[token-opt] hook error: ${message}\n`);
    } catch {
      // ignore
    }
    process.exit(0);
  }
}
