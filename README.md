# token-optimizer

Local CLI to scan and optimize token usage when using **Cursor** and **Claude Code**.

## Status

**v0.1 — PR #1:** Static scanner (`token-opt scan`)

## Requirements

- Node.js 20+
- pnpm 9+

## Setup

```bash
pnpm install
pnpm build
```

## Usage

```bash
# Scan current project
pnpm token-opt scan

# Include user-level Cursor / Claude config
pnpm token-opt scan --cursor --claude

# JSON output
pnpm token-opt scan --json

# Scan a specific directory
pnpm token-opt scan --path /path/to/repo
```

## What `scan` analyzes

| Category | Paths |
|----------|-------|
| Cursor rules | `.cursor/rules/**`, `AGENTS.md` |
| MCP servers | `.cursor/mcp.json`, `.mcp.json` |
| Claude context | `CLAUDE.md`, `.claude/**` |
| User skills | `~/.cursor/skills-cursor/**` (with `--cursor`) |

MCP token counts use a per-server heuristic (~1,100 tokens) when full schemas aren't available locally.

## Monorepo layout

```
packages/
  core/   # tokenizer + static analyzer
  cli/    # token-opt CLI
```

## Roadmap

- [x] PR #1: `token-opt scan`
- [ ] PR #2: Session hooks + `token-opt report`
- [ ] PR #3: Warn policies + `token-opt init`
- [ ] PR #4: Enforce mode + Claude hooks

## License

MIT
