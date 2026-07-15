export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>token-opt · local dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #f3f0e8;
      --bg-2: #e7efe8;
      --ink: #1c2420;
      --muted: #5c6b63;
      --line: #c9d2cb;
      --panel: rgba(255, 252, 247, 0.82);
      --accent: #0f6b5c;
      --accent-2: #c45c26;
      --warn: #a15c00;
      --ok: #1f7a4d;
      --shadow: 0 18px 50px rgba(28, 36, 32, 0.08);
      --radius: 18px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: Manrope, system-ui, sans-serif;
      background:
        radial-gradient(900px 500px at 10% -10%, #d9ebe3 0%, transparent 55%),
        radial-gradient(700px 420px at 100% 0%, #f0dac8 0%, transparent 50%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(28,36,32,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(28,36,32,0.04) 1px, transparent 1px);
      background-size: 28px 28px;
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.35), transparent 80%);
    }
    .shell {
      position: relative;
      max-width: 1280px;
      margin: 0 auto;
      padding: 28px 22px 48px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 24px;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 28px;
    }
    .brand {
      font-family: Fraunces, Georgia, serif;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 0.95;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .brand span { color: var(--accent); }
    .tagline {
      margin: 8px 0 0;
      color: var(--muted);
      max-width: 42ch;
    }
    .meta {
      text-align: right;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 12px;
      color: var(--muted);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--panel);
      backdrop-filter: blur(8px);
      margin-top: 10px;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--ok);
      box-shadow: 0 0 0 4px rgba(31,122,77,0.15);
    }
    .dot.warn { background: var(--warn); box-shadow: 0 0 0 4px rgba(161,92,0,0.12); }
    .layout {
      display: grid;
      grid-template-columns: 1.05fr 1.4fr;
      gap: 18px;
    }
    @media (max-width: 960px) {
      .layout { grid-template-columns: 1fr; }
      .meta { text-align: left; }
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
      overflow: hidden;
    }
    .panel h2 {
      margin: 0;
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 700;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    @media (max-width: 960px) {
      .metrics { grid-template-columns: repeat(2, 1fr); }
    }
    .metric {
      padding: 16px 18px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--panel);
      box-shadow: var(--shadow);
    }
    .metric .label {
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .metric .value {
      margin-top: 8px;
      font-family: Fraunces, Georgia, serif;
      font-size: 2rem;
      letter-spacing: -0.03em;
    }
    .metric .sub {
      margin-top: 4px;
      font-size: 12px;
      color: var(--muted);
      font-family: "IBM Plex Mono", monospace;
    }
    .session-list { max-height: 620px; overflow: auto; }
    .session {
      width: 100%;
      text-align: left;
      border: 0;
      border-bottom: 1px solid var(--line);
      background: transparent;
      padding: 14px 18px;
      cursor: pointer;
      font: inherit;
      color: inherit;
    }
    .session:hover, .session.active { background: rgba(15, 107, 92, 0.08); }
    .session .id {
      font-family: "IBM Plex Mono", monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .session .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 6px;
      color: var(--muted);
      font-size: 13px;
    }
    .detail { padding: 18px; min-height: 420px; }
    .empty {
      color: var(--muted);
      padding: 28px 8px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .mono { font-family: "IBM Plex Mono", monospace; font-size: 12px; }
    .flag {
      color: var(--accent-2);
      font-weight: 600;
    }
    footer {
      margin-top: 22px;
      color: var(--muted);
      font-size: 12px;
      font-family: "IBM Plex Mono", monospace;
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div>
        <h1 class="brand">token<span>-opt</span></h1>
        <p class="tagline">Local dashboard for Cursor &amp; Claude Code session token waste.</p>
      </div>
      <div class="meta">
        <div id="generated">loading…</div>
        <div class="pill"><span class="dot" id="mode-dot"></span><span id="mode-label">mode</span></div>
      </div>
    </header>

    <section class="metrics" id="metrics"></section>

    <div class="layout">
      <section class="panel">
        <h2>Sessions</h2>
        <div class="session-list" id="sessions"></div>
      </section>
      <section class="panel">
        <h2>Detail</h2>
        <div class="detail" id="detail">
          <div class="empty">Select a session</div>
        </div>
      </section>
    </div>

    <footer>Auto-refreshes every 5s · data from ~/.token-optimizer · never leaves this machine</footer>
  </div>
  <script>
    const fmt = (n) => Number(n || 0).toLocaleString();
    const shortId = (id) => id.length > 18 ? id.slice(0, 8) + "…" + id.slice(-6) : id;
    let selectedId = null;
    let overviewCache = null;

    async function fetchJson(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function renderMetrics(overview) {
      const t = overview.totals;
      const cards = [
        ["Sessions", t.sessionCount, "recorded locally"],
        ["Tool tokens", t.toolOutputs, t.toolCallCount + " tool calls"],
        ["Warnings", t.warnCount, t.duplicateReads + " duplicate reads"],
        ["Projected save", t.projectedSavings, "if enforce mode"],
      ];
      document.getElementById("metrics").innerHTML = cards.map(([label, value, sub]) => \`
        <div class="metric">
          <div class="label">\${label}</div>
          <div class="value">\${fmt(value)}</div>
          <div class="sub">\${sub}</div>
        </div>
      \`).join("");
    }

    function renderSessions(overview) {
      const root = document.getElementById("sessions");
      if (!overview.sessions.length) {
        root.innerHTML = '<div class="empty">No sessions yet. Run an Agent chat with hooks installed.</div>';
        return;
      }
      root.innerHTML = overview.sessions.map((s) => \`
        <button class="session \${s.sessionId === selectedId ? "active" : ""}" data-id="\${s.sessionId}">
          <div class="id">\${shortId(s.sessionId)}</div>
          <div class="row">
            <span>\${fmt(s.totalTokens)} tokens · \${s.toolCallCount} tools</span>
            <span>\${s.warnCount ? s.warnCount + " warn" : "clean"}</span>
          </div>
        </button>
      \`).join("");
      root.querySelectorAll(".session").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedId = btn.getAttribute("data-id");
          renderSessions(overviewCache);
          loadDetail(selectedId);
        });
      });
    }

    async function loadDetail(id) {
      const detail = document.getElementById("detail");
      detail.innerHTML = '<div class="empty">Loading…</div>';
      try {
        const data = await fetchJson("/api/sessions/" + encodeURIComponent(id));
        const offenders = (data.topOffenders || []).slice(0, 8).map((o) => \`
          <tr>
            <td class="mono">\${o.tool}</td>
            <td>\${o.detail || "—"}</td>
            <td class="mono">\${fmt(o.tokens)}</td>
            <td class="flag">\${o.flag || ""}</td>
          </tr>
        \`).join("") || '<tr><td colspan="4">No offenders</td></tr>';

        const events = (data.events || []).slice(-20).reverse().map((e) => \`
          <tr>
            <td class="mono">\${(e.timestamp || "").replace("T", " ").slice(0, 19)}</td>
            <td class="mono">\${e.type}</td>
            <td>\${e.tool || "—"} \${e.detail ? "· " + e.detail : ""}</td>
            <td class="mono">\${e.estimatedTokens != null ? fmt(e.estimatedTokens) : "—"}</td>
          </tr>
        \`).join("") || '<tr><td colspan="4">No events</td></tr>';

        detail.innerHTML = \`
          <div class="mono" style="margin-bottom:12px">\${data.sessionId}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">
            <div><div class="label" style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em">Tokens</div><div style="font-family:Fraunces,serif;font-size:1.6rem">\${fmt(data.estimatedTokens.total)}</div></div>
            <div><div class="label" style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em">Warnings</div><div style="font-family:Fraunces,serif;font-size:1.6rem">\${fmt(data.warnCount)}</div></div>
            <div><div class="label" style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em">Duration</div><div style="font-family:Fraunces,serif;font-size:1.6rem">\${data.durationMin ?? "—"}m</div></div>
          </div>
          <h3 style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Top offenders</h3>
          <table><thead><tr><th>Tool</th><th>Detail</th><th>Tokens</th><th>Flag</th></tr></thead><tbody>\${offenders}</tbody></table>
          <h3 style="margin:18px 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Recent events</h3>
          <table><thead><tr><th>Time</th><th>Type</th><th>Detail</th><th>Tokens</th></tr></thead><tbody>\${events}</tbody></table>
        \`;
      } catch (err) {
        detail.innerHTML = '<div class="empty">Failed to load session</div>';
        console.error(err);
      }
    }

    async function refresh() {
      try {
        const overview = await fetchJson("/api/overview");
        overviewCache = overview;
        document.getElementById("generated").textContent = "updated " + new Date(overview.generatedAt).toLocaleString();
        const mode = overview.config.mode;
        document.getElementById("mode-label").textContent = mode + " mode";
        const dot = document.getElementById("mode-dot");
        dot.className = "dot" + (mode === "enforce" ? "" : " warn");
        renderMetrics(overview);
        if (!selectedId && overview.sessions[0]) selectedId = overview.sessions[0].sessionId;
        renderSessions(overview);
        if (selectedId) await loadDetail(selectedId);
      } catch (err) {
        document.getElementById("generated").textContent = "failed to load overview";
        console.error(err);
      }
    }

    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`;
}
