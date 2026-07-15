# token-optimizer

Local CLI to scan and optimize token usage when using **Cursor** and **Claude Code**.

## Status

- **v0.1 — PR #1:** Static scanner (`token-opt scan`)
- **v0.2 — PR #2:** Session hooks + event store + `token-opt report`
- **v0.3 — PR #3:** Warn policies + duplicate-read detection
- **v0.4 — PR #4:** Enforce mode + Claude Code hooks
- **v0.5:** Local dashboard (`token-opt dashboard`)

## Requirements

- Node.js 20+
- pnpm 9+ (or `npx pnpm@9.15.0`)

## Setup

```bash
pnpm install
pnpm build
```

## Usage

```bash
# Scan static context (rules, MCP, CLAUDE.md)
pnpm token-opt scan
pnpm token-opt scan --path examples/sample-repo --json

# Install hooks (both Cursor + Claude by default)
pnpm token-opt init
pnpm token-opt init --cursor          # Cursor only
pnpm token-opt init --claude          # Claude Code only
pnpm token-opt init --path /path/to/project

# Switch policy mode
pnpm token-opt config show
pnpm token-opt config set mode enforce
pnpm token-opt config set mode warn

# After agent sessions
pnpm token-opt report
pnpm token-opt report --last 5 --json

# Local dashboard (session list + detail, auto-refresh)
pnpm token-opt dashboard
pnpm token-opt dashboard --port 4000 --no-open

# Check installation
pnpm token-opt status
pnpm token-opt doctor
```

## Modes

| Mode | Behavior |
|------|----------|
| `warn` (default) | Log + warn; never block or truncate |
| `enforce` | Truncate over-budget tool output; block duplicate reads; save full output to `~/.token-optimizer/artifacts/` |

## What gets tracked

Hooks log to `~/.token-optimizer/` for both Cursor and Claude Code:

| Event | Cursor | Claude Code | Logged data |
|-------|--------|-------------|-------------|
| Session start | `sessionStart` | `SessionStart` | workspace, timestamp |
| Tool use | `postToolUse` | `PostToolUse` | tool name, output size, budget policy |
| Duplicate read | `preToolUse` (Read) | `PreToolUse` (Read) | warn or deny within TTL |
| Large files in prompt | `beforeSubmitPrompt` | `UserPromptSubmit` | warn on large @-files |
| Compaction | `preCompact` | `PreCompact` | compaction events |
| Session end | `sessionEnd` | `SessionEnd` | summary report |

## Monorepo layout

```
packages/
  core/           # tokenizer, policies, event store, artifacts
  cli/            # token-opt CLI + local dashboard
  cursor-hooks/   # Cursor hook handlers
  claude-hooks/   # Claude Code hook handlers
```

## Roadmap

- [x] PR #1: `token-opt scan`
- [x] PR #2: Session hooks + `token-opt report`
- [x] PR #3: Warn policies + duplicate-read detection
- [x] PR #4: Enforce mode + Claude hooks
- [x] Local dashboard (`token-opt dashboard`)

## License

MIT
