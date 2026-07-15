export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>token-opt · AI usage dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0b1016;
      --panel: rgba(18, 24, 33, 0.78);
      --ink: #e8eef7;
      --muted: #8b9bb0;
      --line: rgba(140, 170, 200, 0.16);
      --accent: #3ddc97;
      --accent-dim: rgba(61, 220, 151, 0.14);
      --cyan: #5cc8ff;
      --warn: #ffb454;
      --ok: #3ddc97;
      --radius: 16px;
      --font: "DM Sans", system-ui, sans-serif;
      --display: Syne, "DM Sans", sans-serif;
      --mono: "JetBrains Mono", ui-monospace, monospace;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: var(--font);
      background: var(--bg);
      overflow-x: hidden;
    }
    .aurora {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 70% 45% at 15% -5%, rgba(61,220,151,0.18), transparent 55%),
        radial-gradient(ellipse 55% 40% at 90% 5%, rgba(92,200,255,0.14), transparent 50%),
        radial-gradient(ellipse 50% 35% at 50% 110%, rgba(61,220,151,0.08), transparent 55%);
    }
    .grid-fade {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.35;
      background-image:
        linear-gradient(rgba(140,170,200,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(140,170,200,0.06) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: linear-gradient(180deg, #000 0%, transparent 70%);
    }
    .shell {
      position: relative;
      z-index: 1;
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 20px 56px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      animation: rise 0.55s ease both;
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: none; }
    }
    .brand-block { max-width: 52ch; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 10px;
    }
    .eyebrow::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: var(--accent);
      box-shadow: 0 0 12px rgba(61,220,151,0.55);
    }
    .brand {
      font-family: var(--display);
      font-weight: 800;
      font-size: clamp(2.1rem, 5vw, 3.1rem);
      line-height: 0.95;
      letter-spacing: -0.04em;
      margin: 0;
    }
    .brand em {
      font-style: normal;
      background: linear-gradient(120deg, var(--accent), var(--cyan));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .tagline {
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 1.02rem;
      line-height: 1.5;
    }
    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }
    .live {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--panel);
      font-family: var(--mono);
      font-size: 12px;
      color: var(--muted);
    }
    .pulse {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--ok);
      animation: pulse 1.8s ease infinite;
    }
    .pulse.warn { background: var(--warn); }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }
    button.refresh {
      appearance: none;
      border: 1px solid var(--line);
      background: var(--accent-dim);
      color: var(--ink);
      font-family: var(--font);
      font-weight: 600;
      font-size: 13px;
      padding: 9px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    button.refresh:hover {
      border-color: rgba(61,220,151,0.45);
      background: rgba(61,220,151,0.22);
    }
    .hint-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
      align-items: center;
      padding: 14px 16px;
      margin-bottom: 22px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(135deg, rgba(61,220,151,0.08), rgba(92,200,255,0.06));
      color: var(--muted);
      font-size: 0.92rem;
      animation: rise 0.55s ease 0.05s both;
    }
    .hint-bar strong { color: var(--ink); font-weight: 600; }
    .hint-bar code, .steps code {
      font-family: var(--mono);
      font-size: 0.85em;
      color: var(--cyan);
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 22px;
      animation: rise 0.55s ease 0.1s both;
    }
    .metric {
      position: relative;
      overflow: hidden;
      padding: 18px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--line);
      background: var(--panel);
      backdrop-filter: blur(12px);
    }
    .metric::after {
      content: "";
      position: absolute;
      inset: auto -20% -40% auto;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(61,220,151,0.12), transparent 70%);
      pointer-events: none;
    }
    .metric.highlight {
      border-color: rgba(61,220,151,0.35);
      background: linear-gradient(160deg, rgba(61,220,151,0.12), var(--panel));
    }
    .metric .label {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .metric .value {
      font-family: var(--display);
      font-weight: 700;
      font-size: clamp(1.45rem, 2.5vw, 1.85rem);
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .metric .sub {
      margin-top: 8px;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.35;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(280px, 0.95fr) 1.35fr;
      gap: 16px;
      align-items: start;
      animation: rise 0.55s ease 0.15s both;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: calc(var(--radius) + 2px);
      background: var(--panel);
      backdrop-filter: blur(14px);
      overflow: hidden;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--line);
    }
    .panel-head h2 {
      margin: 0;
      font-family: var(--display);
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .panel-head .count {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
    }
    .sessions { max-height: 640px; overflow: auto; }
    .session {
      width: 100%;
      text-align: left;
      border: 0;
      border-bottom: 1px solid var(--line);
      background: transparent;
      color: inherit;
      padding: 14px 16px;
      cursor: pointer;
      display: grid;
      gap: 8px;
      transition: background 0.15s;
      font: inherit;
    }
    .session:hover { background: rgba(92,200,255,0.05); }
    .session.active {
      background: rgba(61,220,151,0.1);
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .session-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }
    .sid {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--cyan);
    }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      font-family: var(--mono);
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid var(--line);
      color: var(--muted);
      background: rgba(255,255,255,0.03);
    }
    .chip.ok { color: var(--ok); border-color: rgba(61,220,151,0.35); background: var(--accent-dim); }
    .chip.warn { color: var(--warn); border-color: rgba(255,180,84,0.35); background: rgba(255,180,84,0.1); }
    .chip.mode { color: var(--cyan); border-color: rgba(92,200,255,0.3); }
    .session-meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      color: var(--muted);
      font-size: 12px;
    }
    .session-meta b { color: var(--ink); font-weight: 600; }
    .detail { padding: 18px; min-height: 420px; }
    .empty {
      display: grid;
      place-items: center;
      text-align: center;
      min-height: 360px;
      color: var(--muted);
      padding: 24px;
    }
    .empty h3 {
      margin: 0 0 8px;
      color: var(--ink);
      font-family: var(--display);
      font-size: 1.35rem;
    }
    .empty p { margin: 0 0 18px; max-width: 42ch; line-height: 1.5; }
    .steps {
      text-align: left;
      margin: 0 auto;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 10px;
      max-width: 360px;
    }
    .steps li {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 10px;
      align-items: start;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
      font-size: 0.9rem;
      color: var(--ink);
    }
    .steps span {
      display: grid;
      place-items: center;
      width: 28px; height: 28px;
      border-radius: 8px;
      background: var(--accent-dim);
      color: var(--accent);
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 500;
    }
    .detail-title {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }
    .detail-title h2 {
      margin: 0;
      font-family: var(--mono);
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--cyan);
      word-break: break-all;
    }
    .detail-sub {
      color: var(--muted);
      font-size: 0.9rem;
      margin-bottom: 18px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 8px;
    }
    .stat {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
    }
    .stat .label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .stat .value {
      font-family: var(--display);
      font-weight: 700;
      font-size: 1.35rem;
      letter-spacing: -0.02em;
    }
    .section-label {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 18px 0 10px;
    }
    .offenders, .events {
      display: grid;
      gap: 8px;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      padding: 11px 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
      font-size: 0.9rem;
    }
    .row .muted { color: var(--muted); font-size: 12px; margin-top: 4px; }
    .row .right {
      text-align: right;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--accent);
      white-space: nowrap;
    }
    .row.warn-row { border-color: rgba(255,180,84,0.28); background: rgba(255,180,84,0.06); }
    .flag {
      color: var(--warn);
      font-family: var(--mono);
      font-size: 11px;
    }
    .loader {
      display: grid;
      place-items: center;
      gap: 14px;
      text-align: center;
      color: var(--muted);
      padding: 28px 16px;
    }
    .loader.compact { padding: 18px 8px; gap: 10px; }
    .loader p {
      margin: 0;
      font-size: 0.92rem;
      max-width: 28ch;
      line-height: 1.4;
    }
    .orbit {
      position: relative;
      width: 44px;
      height: 44px;
    }
    .orbit.sm { width: 28px; height: 28px; }
    .orbit::before,
    .orbit::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid transparent;
    }
    .orbit::before {
      border-top-color: var(--accent);
      border-right-color: rgba(61,220,151,0.25);
      animation: spin 0.9s linear infinite;
    }
    .orbit::after {
      inset: 8px;
      border-bottom-color: var(--cyan);
      border-left-color: rgba(92,200,255,0.2);
      animation: spin 1.35s linear infinite reverse;
    }
    .orbit.sm::after { inset: 5px; }
    .orbit .core {
      position: absolute;
      inset: 50%;
      width: 6px; height: 6px;
      margin: -3px 0 0 -3px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px rgba(61,220,151,0.55);
      animation: pulse 1.4s ease infinite;
    }
    .orbit.sm .core { width: 4px; height: 4px; margin: -2px 0 0 -2px; }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .boot {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      background: rgba(11, 16, 22, 0.82);
      backdrop-filter: blur(10px);
      transition: opacity 0.28s ease, visibility 0.28s ease;
    }
    .boot.hide {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .boot .loader { color: var(--ink); }
    .boot .loader p { color: var(--muted); }
    button.refresh.is-loading {
      opacity: 0.7;
      pointer-events: none;
    }
    button.refresh .btn-spin {
      display: none;
      width: 12px; height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(232,238,247,0.25);
      border-top-color: var(--accent);
      animation: spin 0.7s linear infinite;
      margin-right: 8px;
      vertical-align: -2px;
    }
    button.refresh.is-loading .btn-spin { display: inline-block; }
    .skel {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 22px;
    }
    .skel-card {
      height: 108px;
      border-radius: var(--radius);
      border: 1px solid var(--line);
      background: linear-gradient(110deg, rgba(255,255,255,0.03) 25%, rgba(61,220,151,0.08) 37%, rgba(255,255,255,0.03) 63%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @media (max-width: 920px) {
      .skel { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 520px) {
      .skel { grid-template-columns: 1fr; }
    }
    footer {
      margin-top: 28px;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
      animation: rise 0.55s ease 0.2s both;
    }
    footer code {
      font-family: var(--mono);
      color: var(--cyan);
      font-size: 11px;
    }
    @media (max-width: 920px) {
      .metrics { grid-template-columns: 1fr 1fr; }
      .layout { grid-template-columns: 1fr; }
      .header-actions { align-items: flex-start; }
      .stats { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .metrics { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="aurora" aria-hidden="true"></div>
  <div class="grid-fade" aria-hidden="true"></div>
  <div class="shell">
    <header>
      <div class="brand-block">
        <div class="eyebrow">Local · private · live</div>
        <h1 class="brand">token-<em>opt</em></h1>
        <p class="tagline">See where your AI agents burn tokens — and how much you could reclaim with smarter budgets.</p>
      </div>
      <div class="header-actions">
        <div class="live" id="live"><span class="pulse" id="pulse"></span><span id="liveText">Connecting…</span></div>
        <button class="refresh" type="button" id="refreshBtn"><span class="btn-spin" aria-hidden="true"></span>Refresh now</button>
      </div>
    </header>

    <div class="hint-bar" id="hintBar">
      <strong>Tip:</strong>
      <span id="hintText">Loading your agent activity…</span>
    </div>

    <section class="skel" id="metrics" aria-busy="true" aria-label="Loading metrics">
      <div class="skel-card"></div><div class="skel-card"></div>
      <div class="skel-card"></div><div class="skel-card"></div>
    </section>

    <div class="layout">
      <section class="panel">
        <div class="panel-head">
          <h2>Agent sessions</h2>
          <span class="count" id="sessionCount">0</span>
        </div>
        <div class="sessions" id="sessions">
          <div class="loader" id="sessionsLoader">
            <div class="orbit" aria-hidden="true"><span class="core"></span></div>
            <p>Scanning local agent sessions…</p>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head">
          <h2>Session detail</h2>
          <span class="count" id="modeLabel">—</span>
        </div>
        <div class="detail" id="detail">
          <div class="loader">
            <div class="orbit" aria-hidden="true"><span class="core"></span></div>
            <p>Warming up session view…</p>
          </div>
        </div>
      </section>
    </div>

    <div class="boot" id="boot" role="status" aria-live="polite">
      <div class="loader">
        <div class="orbit" aria-hidden="true"><span class="core"></span></div>
        <p>Loading token-opt dashboard…</p>
      </div>
    </div>

    <footer>
      Data stays on this machine · refreshes every 5s · stored in <code>~/.token-optimizer</code>
    </footer>
  </div>
  <script>
    const fmt = (n) => Number(n || 0).toLocaleString();
    const shortId = (id) => id.length > 18 ? id.slice(0, 8) + "…" + id.slice(-6) : id;
    const ago = (iso) => {
      if (!iso) return "—";
      const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
      if (s < 60) return s + "s ago";
      if (s < 3600) return Math.floor(s / 60) + "m ago";
      if (s < 86400) return Math.floor(s / 3600) + "h ago";
      return Math.floor(s / 86400) + "d ago";
    };
    let selectedId = null;
    let overviewCache = null;
    let booted = false;
    let refreshing = false;

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function loaderHtml(message, compact) {
      return '<div class="loader' + (compact ? " compact" : "") + '" role="status">' +
        '<div class="orbit' + (compact ? " sm" : "") + '" aria-hidden="true"><span class="core"></span></div>' +
        "<p>" + escapeHtml(message) + "</p></div>";
    }

    function setRefreshing(on) {
      refreshing = on;
      const btn = document.getElementById("refreshBtn");
      btn.classList.toggle("is-loading", on);
      btn.setAttribute("aria-busy", on ? "true" : "false");
    }

    function hideBoot() {
      if (booted) return;
      booted = true;
      document.getElementById("boot").classList.add("hide");
    }

    async function fetchJson(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function metric(label, value, sub, highlight) {
      return '<div class="metric' + (highlight ? " highlight" : "") + '">' +
        '<div class="label">' + label + "</div>" +
        '<div class="value">' + value + "</div>" +
        '<div class="sub">' + sub + "</div></div>";
    }

    function renderMetrics(overview) {
      const t = overview.totals;
      const projected = Number(t.projectedSavings || 0);
      const el = document.getElementById("metrics");
      el.className = "metrics";
      el.removeAttribute("aria-busy");
      el.removeAttribute("aria-label");
      el.innerHTML = [
        metric("Sessions", fmt(t.sessionCount), "Agent chats tracked locally"),
        metric("Tool tokens", fmt(t.toolOutputs), fmt(t.toolCallCount) + " tool calls"),
        metric("Warnings", fmt(t.warnCount), fmt(t.duplicateReads) + " duplicate reads"),
        metric("Could save", fmt(projected), projected > 0
          ? "If enforce clipped over-budget tools"
          : "Appears when tools exceed budgets", true),
      ].join("");
    }

    function renderHint(overview) {
      const t = overview.totals;
      const mode = overview.config.mode;
      const sessions = Number(t.sessionCount || 0);
      const projected = Number(t.projectedSavings || 0);
      const warnings = Number(t.warnCount || 0);
      let text = "";
      if (sessions === 0) {
        text = "No sessions yet. Run <code>token-opt init --cursor</code> in a project, then chat in Cursor. This page updates automatically.";
      } else if (projected > 0) {
        text = "Nice signal — enforce mode could reclaim about <strong>" + fmt(projected) + " tokens</strong>. Try <code>token-opt config set mode enforce</code> when you're ready.";
      } else if (warnings > 0) {
        text = "You have warnings, but projected savings stay at 0 until a tool goes over budget. Mode is currently <strong>" + escapeHtml(mode) + "</strong>.";
      } else {
        text = "Usage looks healthy in <strong>" + escapeHtml(mode) + "</strong> mode. Watch rising tool tokens — that's where waste usually hides.";
      }
      document.getElementById("hintText").innerHTML = text;
    }

    function renderSessions(overview) {
      const el = document.getElementById("sessions");
      const sessions = overview.sessions || [];
      document.getElementById("sessionCount").textContent = sessions.length + " recent";
      if (!sessions.length) {
        el.innerHTML = '<div class="empty"><h3>Waiting for agents</h3><p>Once Cursor or Claude Code hooks fire, sessions show up here.</p>' +
          '<ol class="steps">' +
          '<li><span>1</span><div>Install hooks with <code>token-opt init --cursor</code></div></li>' +
          '<li><span>2</span><div>Use the agent in that project</div></li>' +
          '<li><span>3</span><div>Watch this dashboard light up</div></li>' +
          "</ol></div>";
        return;
      }
      el.innerHTML = sessions.map((s) => {
        const active = selectedId === s.sessionId ? " active" : "";
        const warnChip = Number(s.warnCount) > 0
          ? '<span class="chip warn">' + s.warnCount + " warn</span>"
          : '<span class="chip ok">clean</span>';
        const saveChip = Number(s.projectedSavings) > 0
          ? '<span class="chip mode">save ' + fmt(s.projectedSavings) + "</span>"
          : "";
        return '<button class="session' + active + '" data-id="' + escapeHtml(s.sessionId) + '">' +
          '<div class="session-top"><span class="sid">' + escapeHtml(shortId(s.sessionId)) + "</span>" +
          '<div class="chips">' + warnChip + saveChip + "</div></div>" +
          '<div class="session-meta"><span>' + fmt(s.toolCallCount) + " tools</span>" +
          "<span><b>" + fmt(s.totalTokens) + "</b> tok</span></div></button>";
      }).join("");
      el.querySelectorAll(".session").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedId = btn.getAttribute("data-id");
          renderSessions(overviewCache);
          loadDetail(selectedId);
        });
      });
    }

    async function loadDetail(id, opts) {
      const silent = !!(opts && opts.silent);
      const box = document.getElementById("detail");
      if (!id) {
        box.innerHTML = '<div class="empty"><h3>Pick a session</h3><p>Choose a session on the left to inspect tools, warnings, and the noisiest events.</p></div>';
        return;
      }
      if (!silent) box.innerHTML = loaderHtml("Fetching session activity…");
      try {
        const data = await fetchJson("/api/sessions/" + encodeURIComponent(id));
        const offenders = (data.topOffenders || []).slice(0, 8).map((o) =>
          '<div class="row' + (o.flag ? " warn-row" : "") + '"><div><div>' + escapeHtml(o.tool) + "</div>" +
          '<div class="muted">' + escapeHtml((o.detail || "—").slice(0, 100)) +
          (o.flag ? ' <span class="flag">· ' + escapeHtml(o.flag) + "</span>" : "") +
          "</div></div>" +
          '<div class="right">' + fmt(o.tokens) + " tok</div></div>"
        ).join("") || '<div class="row"><div>No heavy tools in this session yet.</div></div>';

        const events = (data.events || []).slice(-20).reverse().map((e) => {
          const warn = String(e.type || "").includes("warn") || String(e.type || "").includes("block");
          return '<div class="row' + (warn ? " warn-row" : "") + '"><div><div>' +
            escapeHtml(e.type) + (e.tool ? " · " + escapeHtml(e.tool) : "") + "</div>" +
            '<div class="muted">' + escapeHtml((e.detail || "").slice(0, 100)) + "</div></div>" +
            '<div class="right">' + (e.estimatedTokens != null ? fmt(e.estimatedTokens) + " tok" : "—") +
            "<br/>" + escapeHtml((e.timestamp || "").replace("T", " ").slice(0, 19)) + "</div></div>";
        }).join("") || '<div class="row"><div>No events yet.</div></div>';

        box.innerHTML =
          '<div class="detail-title"><h2>' + escapeHtml(data.sessionId) + "</h2>" +
          '<div class="chips">' +
          (Number(data.warnCount) > 0
            ? '<span class="chip warn">' + data.warnCount + " warnings</span>"
            : '<span class="chip ok">no warnings</span>') +
          (Number(data.projectedSavings) > 0
            ? '<span class="chip mode">could save ' + fmt(data.projectedSavings) + "</span>"
            : "") +
          "</div></div>" +
          '<div class="detail-sub">Updated ' + ago(data.endedAt || data.startedAt) +
          (data.duplicateReads ? " · " + fmt(data.duplicateReads) + " duplicate reads" : "") + "</div>" +
          '<div class="stats">' +
          '<div class="stat"><div class="label">Tokens</div><div class="value">' + fmt(data.estimatedTokens?.total) + "</div></div>" +
          '<div class="stat"><div class="label">Warnings</div><div class="value">' + fmt(data.warnCount) + "</div></div>" +
          '<div class="stat"><div class="label">Duration</div><div class="value">' + (data.durationMin != null ? data.durationMin + "m" : "—") + "</div></div>" +
          "</div>" +
          '<div class="section-label">Heaviest tools</div><div class="offenders">' + offenders + "</div>" +
          '<div class="section-label">Recent activity</div><div class="events">' + events + "</div>";
      } catch (err) {
        if (!silent) {
          box.innerHTML = '<div class="empty"><h3>Couldn’t load session</h3><p>Try refreshing — the session file may still be writing.</p></div>';
        }
        console.error(err);
      }
    }

    async function refresh(opts) {
      const manual = !!(opts && opts.manual);
      if (refreshing) return;
      setRefreshing(true);
      try {
        const overview = await fetchJson("/api/overview");
        overviewCache = overview;
        const pulse = document.getElementById("pulse");
        const liveText = document.getElementById("liveText");
        pulse.className = "pulse";
        liveText.textContent = "Live · " + new Date(overview.generatedAt).toLocaleTimeString();
        document.getElementById("modeLabel").textContent = overview.config.mode + " mode";
        renderMetrics(overview);
        renderHint(overview);
        const prevSelected = selectedId;
        if (!selectedId && overview.sessions[0]) selectedId = overview.sessions[0].sessionId;
        renderSessions(overview);
        if (selectedId) {
          const showLoader = !booted || manual || selectedId !== prevSelected;
          await loadDetail(selectedId, { silent: !showLoader });
        }
        hideBoot();
      } catch (err) {
        document.getElementById("pulse").className = "pulse warn";
        document.getElementById("liveText").textContent = "Reconnect failed";
        const bootMsg = document.querySelector("#boot p");
        if (bootMsg && !booted) bootMsg.textContent = "Couldn’t connect — retrying…";
        console.error(err);
      } finally {
        setRefreshing(false);
      }
    }

    document.getElementById("refreshBtn").addEventListener("click", () => refresh({ manual: true }));
    refresh({ manual: true });
    setInterval(() => refresh({ manual: false }), 5000);
  </script>
</body>
</html>`;
}
