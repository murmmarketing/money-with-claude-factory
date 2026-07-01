#!/usr/bin/env node
// Dogfood runner — one deterministic pass. The ONLY non-deterministic step is a
// single `claude -p` call for the creative content; everything else (pick, validate,
// publish, notify) is plain Node so it is safe to run unattended.
//
// Env required: FACTORY_SUPABASE_URL, FACTORY_SERVICE_ROLE_KEY, TG_TOKEN, TG_CHAT.
// Usage: node ops/dogfood.mjs [batch]   (default batch = 1)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SB = process.env.FACTORY_SUPABASE_URL;
const SR = process.env.FACTORY_SERVICE_ROLE_KEY;
const TG = process.env.TG_TOKEN;
const CHAT = process.env.TG_CHAT;
const BATCH = Math.max(1, Math.min(3, parseInt(process.argv[2] || '1', 10) || 1));
const SITE = 'https://factory-launchpad-pearl.vercel.app';

if (!SB || !SR) { console.error('missing supabase env'); process.exit(2); }

const log = (...a) => console.log(new Date().toISOString(), ...a);

async function sb(pathq, opts = {}) {
  const r = await fetch(`${SB}/rest/v1/${pathq}`, {
    ...opts,
    headers: {
      apikey: SR, Authorization: `Bearer ${SR}`,
      'Content-Type': 'application/json', ...(opts.headers || {}),
    },
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`supabase ${r.status}: ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

async function tg(text) {
  if (!TG || !CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch { /* best effort */ }
}

async function tgGet(method, qs = '') {
  try { const r = await fetch(`https://api.telegram.org/bot${TG}/${method}${qs}`); return await r.json(); }
  catch { return {}; }
}
async function tgPost(method, params) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
    });
    return await r.json();
  } catch { return {}; }
}

function parseCfg(text) {
  const g = (k, d) => { const m = (text || '').match(new RegExp(k + ':\\s*([^\\n]*)')); return m ? m[1].trim() : d; };
  return {
    batch: Math.max(1, Math.min(3, parseInt(g('BATCH', '1'), 10) || 1)),
    paused: /^yes$/i.test(g('PAUSED', 'no')),
    lastupd: parseInt(g('LASTUPD', '0'), 10) || 0,
  };
}
function fmtCfg(c) { return `🏭 Idea Factory — control\nPAUSED: ${c.paused ? 'yes' : 'no'}\nBATCH: ${c.batch}\nLASTUPD: ${c.lastupd}\n\nCommands: pause · resume · batch N · status`; }

// Read pinned config, apply any new Telegram commands, persist to the pinned message.
// Runs EVERY invocation (before the paused gate) so `resume` can never deadlock.
async function processCommands() {
  if (!TG || !CHAT) return { paused: false, batch: BATCH };
  const chat = await tgGet('getChat', `?chat_id=${CHAT}`);
  const pin = (chat.result && chat.result.pinned_message) || null;
  const cfg = parseCfg(pin ? pin.text : '');
  const pinId = pin ? pin.message_id : null;
  const acks = [];
  // NOTE: getUpdates' offset param does NOT reliably filter forward, so we filter
  // by update_id > lastupd IN CODE, then drain/confirm at the end.
  const ups = await tgGet('getUpdates', `?timeout=0`);
  const list = ups.result || [];
  let maxId = cfg.lastupd;
  for (const u of list) {
    if (u.update_id > maxId) maxId = u.update_id;
    if (u.update_id <= cfg.lastupd) continue; // already processed / historical
    const t = (((u.message || {}).text) || '').trim().toLowerCase().replace(/^\//, '');
    if (!t) continue;
    if (t === 'pause' || t === 'stop') { cfg.paused = true; acks.push('⏸ Paused — send <code>resume</code> to continue.'); }
    else if (t === 'resume') { cfg.paused = false; acks.push('▶️ Resumed.'); }
    else if (/^batch\s+\d+/.test(t)) { cfg.batch = Math.max(1, Math.min(3, parseInt(t.split(/\s+/)[1], 10) || 1)); acks.push(`Batch set to ${cfg.batch}/run.`); }
    else if (t === 'status') { acks.push(`Status: ${cfg.paused ? 'paused' : 'running'} · batch ${cfg.batch}/run.`); }
    else acks.push('Commands: <code>pause</code> · <code>resume</code> · <code>batch N</code> · <code>status</code>');
  }
  cfg.lastupd = maxId;
  // Confirm/drain so Telegram drops these updates from the next poll.
  if (list.length) await tgGet('getUpdates', `?offset=${maxId + 1}&timeout=0`);
  const newText = fmtCfg(cfg);
  if (pinId && (!pin || pin.text !== newText)) {
    await tgPost('editMessageText', { chat_id: CHAT, message_id: pinId, text: newText });
  } else if (!pinId) {
    const m = await tgPost('sendMessage', { chat_id: CHAT, text: newText });
    if (m.result) await tgPost('pinChatMessage', { chat_id: CHAT, message_id: m.result.message_id, disable_notification: true });
  }
  for (const a of acks) await tg(a);
  return cfg;
}

// --- pick next eligible idea(s) not already in the pipeline table ---
function loadQueue() {
  const order = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/run-order.json'), 'utf8'));
  const all = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ideas_all.json'), 'utf8'));
  const byId = new Map(all.map((o) => [o.id, o]));
  // Prefer tool/digital/SEO-shaped ideas for the dogfood (they make real assets).
  const TOOLISH = /calculat|tool|converter|template|spreadsheet|generator|tracker|checklist|planner|directory|comparison|glossary|guide|pack/i;
  return order
    .map((o) => byId.get(o.id))
    .filter(Boolean)
    .filter((o) => TOOLISH.test(`${o.title} ${o.desc || ''}`));
}

const GEN_SCHEMA_HINT = `Return ONLY raw JSON (no markdown fences), shape:
{
 "kind": "tool" | "digital",
 "landing": {
   "eyebrow": string, "headline": string (<=70 chars, benefit-led),
   "subhead": string (<=140 chars), "bullets": [3 short strings],
   "cta_label": string, "brand": {"accent":"#RRGGBB","template":"centered"}
 },
 "tool": null OR {
   "version":1, "kind":"calculator"|"converter", "title":string, "description":string,
   "intro":string, "unitsNote":string,
   "inputs":[{"key":string,"label":string,"type":"number"|"select","unit"?:string,"help"?:string,"default":number,"min"?:number,"step"?:number,"options"?:[{"label":string,"value":number}]}],
   "outputs":[{"key":string,"label":string,"expr":string,"format":"currency"|"percent"|"number"|"integer","currency"?:"EUR","precision"?:number}],
   "examples":[{"label":string,"inputs":{"<key>":number}}]
 }
}
Rules: expr is a plain formula over input keys and PRIOR output keys (+ - * / % ^, and functions min,max,round,clamp,if). No code. Provide "tool" only if the idea is genuinely a calculator/converter; otherwise set "tool": null and it ships landing-only. Keep it real and specific to the idea. Audience skews rep-buyers / MurmReps where relevant.`;

function generate(idea) {
  const prompt = `You are generating one launch asset for this idea:
id: ${idea.id}
title: ${idea.title}
desc: ${idea.desc || ''}
category: ${idea.cat || ''}
what to charge: ${idea.charge || ''}

${GEN_SCHEMA_HINT}`;
  const out = execFileSync('claude', ['-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions'], {
    encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, cwd: ROOT,
  });
  const env = JSON.parse(out);
  const text = env.result || env.text || '';
  const s = text.indexOf('{'); const e = text.lastIndexOf('}');
  if (s < 0 || e < 0) throw new Error('no JSON in model output');
  return JSON.parse(text.slice(s, e + 1));
}

// --- deterministic validation of a tool spec (defensive; page compute is also safe) ---
function toolValid(t) {
  if (!t || typeof t !== 'object') return false;
  if (!Array.isArray(t.inputs) || !t.inputs.length) return false;
  if (!Array.isArray(t.outputs) || !t.outputs.length) return false;
  if (!t.inputs.every((i) => i.key && i.label && i.type)) return false;
  if (!t.outputs.every((o) => o.key && o.label && typeof o.expr === 'string')) return false;
  return true;
}

async function publish(idea, gen) {
  const id = idea.id;
  const L = gen.landing || {};
  const hasTool = gen.kind === 'tool' && toolValid(gen.tool);

  await sb('pipeline', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id, title: idea.title, cat: idea.cat || null, kind: hasTool ? 'tool' : 'digital', status: 'live', stage: 'delivered' }),
  }).catch(async (e) => { // fall back to update on conflict target mismatch
    await sb(`pipeline?id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'live', kind: hasTool ? 'tool' : 'digital' }) });
  });

  await sb('landing_pages', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id, eyebrow: L.eyebrow || null, headline: L.headline || idea.title,
      subhead: L.subhead || (idea.desc || ''), bullets: L.bullets || [],
      cta_label: L.cta_label || 'Join the waitlist', brand: L.brand || { accent: '#c9f24b', template: 'centered' },
      live: true, promoted: false,
    }),
  });

  if (hasTool) {
    await sb('tool_specs', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id, spec: gen.tool, live: true, promoted: false }),
    });
  }
  return { id, hasTool };
}

async function main() {
  // Always process commands first (so `resume` can't deadlock behind a paused gate).
  const cfg = await processCommands();
  if (cfg.paused) { log('paused via pinned config — skipping build'); return; }

  const doneRows = await sb('pipeline?select=id');
  const done = new Set((doneRows || []).map((r) => r.id));
  const queue = loadQueue().filter((o) => !done.has(o.id));
  if (!queue.length) { log('queue empty'); await tg('🏭 Dogfood: queue empty — nothing new to build.'); return; }

  const batch = queue.slice(0, cfg.batch || BATCH);
  const shipped = [];
  for (const idea of batch) {
    try {
      log('generating', idea.id, idea.title);
      const gen = generate(idea);
      const { hasTool } = await publish(idea, gen);
      const links = [`${SITE}/l/${idea.id}`];
      if (hasTool) links.unshift(`${SITE}/tool/${idea.id}`);
      shipped.push({ id: idea.id, title: idea.title, hasTool, links });
      log('shipped', idea.id, hasTool ? '(tool+landing)' : '(landing)');
    } catch (err) {
      log('ERROR', idea.id, String(err).slice(0, 300));
      await tg(`⚠️ Dogfood: <b>${idea.id}</b> failed to build — skipped (${String(err).slice(0, 120)}).`);
    }
  }

  if (shipped.length) {
    const body = shipped.map((s) => `🧮 <b>${s.title}</b>\n${s.links.join('\n')}`).join('\n\n');
    await tg(`🏭 <b>${shipped.length} new live page(s)</b>\n\n${body}\n\n${done.size + shipped.length} ideas published. Reply <code>pause</code> to stop.`);
  }
}

main().catch((e) => { log('FATAL', e); process.exit(1); });
