import { stdin } from "node:process";

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readHookInput<T extends Record<string, unknown>>(): Promise<T> {
  const raw = await readStdin();
  if (!raw.trim()) return {} as T;
  return JSON.parse(raw) as T;
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
  } catch {
    // Fail open — never block agent work due to token-opt errors
    process.exit(0);
  }
}
