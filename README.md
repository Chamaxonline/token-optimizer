# token-optimizer

Local CLI to scan and optimize token usage when using **Cursor** and **Claude Code**.

## Status

- **v0.1 — PR #1:** Static scanner (`token-opt scan`)
- **v0.2 — PR #2:** Session hooks + event store + `token-opt report`

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

# Install Cursor hooks in a project
pnpm token-opt init
pnpm token-opt init --path /path/to/your/project

# After using Cursor Agent, view session report
pnpm token-opt report
pnpm token-opt report --last 5
pnpm token-opt report --json
pnpm token-opt report --export csv > sessions.csv

# Check installation
pnpm token-opt status
pnpm token-opt doctor
```

## What gets tracked

Cursor hooks (installed via `token-opt init`) log to `~/.token-optimizer/`:

| Event | Hook | Logged data |
|-------|------|-------------|
| Session start | `sessionStart` | workspace, timestamp |
| Tool use | `postToolUse` | tool name, output size, token estimate |
| Context compaction | `preCompact` | compaction events |
| Session end | `sessionEnd` | summary report |

**Mode:** `warn` by default — hooks log and warn but never block agent work.

## Monorepo layout

```
packages/
  core/           # tokenizer, static analyzer, event store, reporter
  cli/            # token-opt CLI
  cursor-hooks/   # Cursor hook handlers
```

## Roadmap

- [x] PR #1: `token-opt scan`
- [x] PR #2: Session hooks + `token-opt report`
- [ ] PR #3: Warn policies + duplicate-read detection
- [ ] PR #4: Enforce mode + Claude hooks

## License

MIT
