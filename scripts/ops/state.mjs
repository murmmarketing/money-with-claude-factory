#!/usr/bin/env node
// state.mjs — tiny get/set over the git-committed ops/state.json health file.
//
// Usage:
//   node state.mjs get <stateFile> <key>
//   node state.mjs set <stateFile> <k1> <v1> [<k2> <v2> ...]
// Numeric-looking values are stored as numbers; everything else as strings.
import fs from "node:fs";

const [cmd, file, ...rest] = process.argv.slice(2);

let obj = {};
try {
  obj = JSON.parse(fs.readFileSync(file, "utf8"));
  if (obj === null || typeof obj !== "object") obj = {};
} catch {
  obj = {};
}

if (cmd === "get") {
  const k = rest[0];
  const v = obj[k];
  process.stdout.write(v === undefined || v === null ? "" : String(v));
} else if (cmd === "set") {
  for (let i = 0; i < rest.length; i += 2) {
    const k = rest[i];
    const v = rest[i + 1];
    if (k === undefined || v === undefined) break;
    const n = Number(v);
    obj[k] = v !== "" && Number.isFinite(n) && String(n) === v ? n : v;
  }
  obj.updated = new Date().toISOString();
  try {
    fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
  } catch {
    /* best-effort */
  }
} else {
  process.stderr.write("usage: state.mjs get <file> <key> | set <file> <k> <v> ...\n");
  process.exit(2);
}
