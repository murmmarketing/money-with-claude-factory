# Money With Claude — Idea Factory 🏭

An autonomous **Claude Code cloud agent** that works through 800 money-making ideas, turning
3 of them per run into ready-to-launch kits and emailing me a summary.

## How it works
- A scheduled routine (claude.ai/code/routines) wakes on a cron, clones this repo, and follows
  [`AGENTS.md`](./AGENTS.md).
- Each run it picks the next 3 ideas from [`data/run-order.json`](./data/run-order.json), builds
  full launch kits, and **delivers them over Telegram** (summary message + a zip of each kit).
- **The agent's memory is a pinned Telegram message** (`DONE: <ids>`) — no repo write needed.
  Git push here is a best-effort bonus archive.

## What's where
| Path | What |
|---|---|
| `AGENTS.md` | The instructions the agent runs each wake-up |
| `data/ideas_all.json` | All 800 ideas (each has a stable `id` like `S1-109`) |
| `data/run-order.json` | Prioritized queue — grounded + low-effort + my-business-relevant first |
| `data/All-800-Ideas.md` | Human-readable catalogue |
| `data/Ideas-Tracker.csv` | Status of every idea |
| `kits/<id>/` | One folder per finished idea — the launch kit |
| `LOG.md` | Append-only run log |

## My job (the human-only part)
Each email lists 2-3 "YOUR MOVE" steps per idea — connect payments, approve, hit publish.
The agent does everything an agent legitimately can; I do the parts that need a human.

## Progress
0 / 800 ideas kitted. See `LOG.md`.
