#!/usr/bin/env node
// parse-config.mjs — read a Telegram getChat JSON on stdin, extract the pinned
// message text, and emit shell-safe assignments for the ops keys the runner
// needs for its cost/kill circuit-breaker. Non-LLM, deterministic.
//
// Usage:  curl .../getChat | node parse-config.mjs
// Emits (single-quoted, escaped):
//   KILL='no' CAP_USD='5' PORTFOLIO_STOP='no' PAUSED_CFG='no'
import fs from "node:fs";

let raw = "";
try {
  raw = fs.readFileSync(0, "utf8");
} catch {
  raw = "";
}

let text = "";
try {
  const j = JSON.parse(raw);
  text = (j && j.result && j.result.pinned_message && j.result.pinned_message.text) || "";
} catch {
  text = "";
}

const get = (key, def) => {
  const re = new RegExp("^\\s*" + key + "\\s*:\\s*(.*)$", "im");
  const m = text.match(re);
  return m ? m[1].trim() : def;
};

// shell single-quote escape
const esc = (s) => String(s).replace(/'/g, "'\\''");

const kill = (get("KILL", "no") || "no").toLowerCase();
const cap = get("CAP_USD", "5") || "5";
const stop = (get("PORTFOLIO_STOP", "no") || "no").toLowerCase();
const paused = (get("PAUSED", "no") || "no").toLowerCase();

process.stdout.write(
  "KILL='" + esc(kill) + "'\n" +
  "CAP_USD='" + esc(cap) + "'\n" +
  "PORTFOLIO_STOP='" + esc(stop) + "'\n" +
  "PAUSED_CFG='" + esc(paused) + "'\n"
);
