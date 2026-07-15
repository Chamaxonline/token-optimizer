import { createServer } from "node:http";
import { exec } from "node:child_process";
import pc from "picocolors";
import { getDashboardOverview, getDashboardSession } from "../dashboard/data.js";
import { getDashboardHtml } from "../dashboard/page.js";

export interface DashboardOptions {
  port?: number;
  open?: boolean;
  host?: string;
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    // ignore open failures — user can open URL manually
  });
}

export async function runDashboard(options: DashboardOptions = {}): Promise<void> {
  const port = options.port ?? 3847;
  const host = options.host ?? "127.0.0.1";
  const shouldOpen = options.open !== false;

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${host}:${port}`);

      if (url.pathname === "/" || url.pathname === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(getDashboardHtml());
        return;
      }

      if (url.pathname === "/api/overview") {
        const limit = Number(url.searchParams.get("limit") ?? "50");
        const overview = await getDashboardOverview(Number.isFinite(limit) ? limit : 50);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(overview));
        return;
      }

      const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/);
      if (sessionMatch) {
        const sessionId = decodeURIComponent(sessionMatch[1]!);
        const detail = await getDashboardSession(sessionId);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(detail));
        return;
      }

      if (url.pathname === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: message }));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, host, () => resolve());
    server.on("error", reject);
  });

  const url = `http://${host}:${port}`;
  console.log("");
  console.log(pc.bold("token-opt dashboard"));
  console.log(`  Local UI:  ${pc.cyan(url)}`);
  console.log(`  API:       ${url}/api/overview`);
  console.log("  Press Ctrl+C to stop.");
  console.log("");

  if (shouldOpen) openBrowser(url);
}
