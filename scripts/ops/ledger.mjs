#!/usr/bin/env node
// ledger.mjs — real-spend meter for the cost circuit-breaker.
// The ledger is a gitignored, append-only JSONL file at the repo root:
//   {"ts":"<ISO>","date":"YYYY-MM-DD","cost":<usd>,"rc":<exit>}
//
// Subcommands:
//   today  <ledgerFile> <YYYY-MM-DD>          -> prints sum of cost for that date
//   append <ledgerFile> <claudeOutJson> <rc>  -> appends a line, prints the run cost
import fs from "node:fs";

const [cmd, file, a, b] = process.argv.slice(2);

if (cmd === "today") {
  const date = a || "";
  let total = 0;
  try {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (const ln of lines) {
      const s = ln.trim();
      if (!s) continue;
      try {
        const o = JSON.parse(s);
        if (o && o.date === date) total += Number(o.cost) || 0;
      } catch {
        /* skip malformed line */
      }
    }
  } catch {
    /* no ledger yet -> 0 */
  }
  // Trim float noise to 4dp.
  process.stdout.write(String(Math.round(total * 1e4) / 1e4));
} else if (cmd === "append") {
  const outJson = a;
  const rc = b;
  let cost = 0;
  try {
    const o = JSON.parse(fs.readFileSync(outJson, "utf8"));
    // claude --output-format json exposes total_cost_usd (fall back to cost_usd).
    cost = Number(o.total_cost_usd);
    if (!Number.isFinite(cost)) cost = Number(o.cost_usd);
    if (!Number.isFinite(cost)) cost = 0;
  } catch {
    cost = 0;
  }
  const now = new Date();
  const iso = now.toISOString();
  const date = iso.slice(0, 10);
  const line = JSON.stringify({ ts: iso, date, cost, rc: Number(rc) || 0 }) + "\n";
  try {
    fs.appendFileSync(file, line);
  } catch {
    /* best-effort */
  }
  process.stdout.write(String(cost));
} else {
  process.stderr.write("usage: ledger.mjs today <file> <date> | append <file> <outjson> <rc>\n");
  process.exit(2);
}
