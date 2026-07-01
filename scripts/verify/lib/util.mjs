// scripts/verify/lib/util.mjs
// Shared, dependency-free helpers for the verifier package.
// Pure Node (>=18): global fetch, fs/promises, no external packages so the
// verifiers run from the repo root without touching launchpad/node_modules.

import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Result contract shared by every verifier module.
//   { name, pass:boolean, severity:'hard'|'flag', evidence_path, reasons:[], details:{} }
// run-all.mjs (pipeline package) blocks delivery ONLY when
//   severity === 'hard' && pass === false.
// 'flag' results are advisory (e.g. contrast) and never block.
// ---------------------------------------------------------------------------
export function result(name, { pass, severity = 'hard', evidence_path = null, reasons = [], details = {} }) {
  return { name, pass: !!pass, severity, evidence_path, reasons, details };
}

export const REPO_ROOT = (() => {
  // this file lives at <root>/scripts/verify/lib/util.mjs
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..');
})();

export function kitDir(ideaId) {
  return path.join(REPO_ROOT, 'kits', String(ideaId));
}

export function evidenceDir(ideaId) {
  return path.join(kitDir(ideaId), 'evidence');
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeEvidence(ideaId, filename, contents) {
  const dir = await ensureDir(evidenceDir(ideaId));
  const p = path.join(dir, filename);
  await fs.writeFile(p, contents, 'utf8');
  return p;
}

export async function readTextSafe(p) {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

export async function readJsonSafe(p) {
  const t = await readTextSafe(p);
  if (t == null) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export async function listMarkdown(ideaId) {
  const dir = kitDir(ideaId);
  let names = [];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.toLowerCase().endsWith('.md'))
    .sort()
    .map((n) => path.join(dir, n));
}

export function clamp(x, lo, hi) {
  if (Number.isNaN(x) || x == null) return lo;
  return Math.max(lo, Math.min(hi, x));
}

// Accepts 0-1 or 0-100 inputs, normalizes to 0-1.
export function norm01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return clamp(n / 100, 0, 1);
  return n;
}

export function num(x, dflt = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : dflt;
}

// Extract distinct positive money amounts from text. Handles $29, $1,299.00.
export function extractPrices(text) {
  if (!text) return [];
  const out = new Set();
  const re = /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const v = parseFloat(m[1].replace(/,/g, ''));
    if (Number.isFinite(v) && v > 0) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

// Split into paragraphs on blank lines (keeps line numbers via offset map).
export function paragraphs(text) {
  const lines = text.split(/\r?\n/);
  const paras = [];
  let cur = [];
  let start = 1;
  lines.forEach((line, i) => {
    if (line.trim() === '') {
      if (cur.length) {
        paras.push({ text: cur.join('\n'), startLine: start });
        cur = [];
      }
      start = i + 2;
    } else {
      if (!cur.length) start = i + 1;
      cur.push(line);
    }
  });
  if (cur.length) paras.push({ text: cur.join('\n'), startLine: start });
  return paras;
}

// ---------------------------------------------------------------------------
// Environment / config resolution (never hard-code secrets).
// ---------------------------------------------------------------------------
export function env(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

export function supabaseUrl() {
  return env('FACTORY_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
}
export function serviceRoleKey() {
  return env('FACTORY_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
}
export function anonKey() {
  return env('FACTORY_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
}
export function baseUrl() {
  const b = env('BASE_URL', 'FACTORY_BASE_URL', 'LAUNCHPAD_BASE_URL');
  return b ? b.replace(/\/+$/, '') : null;
}

// ---------------------------------------------------------------------------
// Minimal PostgREST client over global fetch (no SDK, no LLM, pure REST).
// role: 'service' | 'anon'
// ---------------------------------------------------------------------------
export function pgrest({ role = 'service' } = {}) {
  const url = supabaseUrl();
  const key = role === 'anon' ? anonKey() : serviceRoleKey();
  if (!url || !key) {
    return { ok: false, reason: `missing ${role} credentials (url=${!!url}, key=${!!key})` };
  }
  const base = `${url.replace(/\/+$/, '')}/rest/v1`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  async function req(method, table, { query = '', body, prefer } = {}) {
    const h = { ...headers };
    if (prefer) h.Prefer = prefer;
    const target = `${base}/${table}${query ? `?${query}` : ''}`;
    let res;
    try {
      res = await fetch(target, {
        method,
        headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      return { status: 0, ok: false, data: null, error: String(e && e.message ? e.message : e) };
    }
    const txt = await res.text();
    let data = null;
    if (txt) {
      try {
        data = JSON.parse(txt);
      } catch {
        data = txt;
      }
    }
    return { status: res.status, ok: res.ok, data, error: res.ok ? null : data };
  }

  return {
    ok: true,
    base,
    select: (table, query) => req('GET', table, { query }),
    insert: (table, body, prefer) => req('POST', table, { body, prefer }),
    update: (table, query, body, prefer) => req('PATCH', table, { query, body, prefer }),
    remove: (table, query) => req('DELETE', table, { query, prefer: 'return=representation' }),
    raw: req,
  };
}

// Fetch a URL, return {status, ok, text}. Never throws.
export async function httpGet(url, opts = {}) {
  try {
    const res = await fetch(url, { redirect: 'manual', ...opts });
    const text = await res.text();
    return { status: res.status, ok: res.status >= 200 && res.status < 300, text, headers: res.headers };
  } catch (e) {
    return { status: 0, ok: false, text: '', error: String(e && e.message ? e.message : e) };
  }
}

export async function httpJson(url, method, bodyObj, extraHeaders = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: bodyObj === undefined ? undefined : JSON.stringify(bodyObj),
      redirect: 'manual',
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.status >= 200 && res.status < 300, data, text };
  } catch (e) {
    return { status: 0, ok: false, data: null, text: '', error: String(e && e.message ? e.message : e) };
  }
}

export function jsonlLine(obj) {
  return JSON.stringify(obj) + '\n';
}

export function fileExists(p) {
  return existsSync(p);
}

// tiny arg parser: --key value / --flag
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

// Is this module the entry point? (works for `node file.mjs`)
export function isMain(metaUrl) {
  try {
    return process.argv[1] && fileURLToPath(metaUrl) === path.resolve(process.argv[1]);
  } catch {
    return false;
  }
}
