#!/usr/bin/env node
// docs/pipeline/validate.mjs
// Non-LLM demand-signal collector. Emits kits/<id>/evidence/validation.json and
// best-effort upserts the same row to the `validations` table (service-role).
//
//   node docs/pipeline/validate.mjs <id>
//
// Every provider runs in its own try/catch and FAILS CLOSED: on any error it
// pushes {provider,error_class} to errors[] and continues. If ZERO providers
// returned real data the process exits 2 so the runner SKIPs the idea (it never
// kills the run and never proceeds to build on no evidence). The tier decision
// is NOT made here — verifier V1 (score.mjs) owns that. This only gathers signal.
//
// 14-day on-disk cache under kits/<id>/evidence/cache/ keyed by a normalized
// provider+query hash so hourly re-runs don't re-bill DataForSEO.
//
// Env (all optional; missing creds => that provider is skipped, not fatal):
//   DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
//   REDDIT_UA                (default UA is 403'd by Reddit — a real UA is required)
//   META_AD_LIBRARY_TOKEN
//   FACTORY_SUPABASE_URL, FACTORY_SUPABASE_SERVICE_ROLE_KEY  (for the upsert)

import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { upsert } from '../lib/factory-db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const INTENT_MODIFIERS = [
  'buy', 'pricing', 'price', 'tool', 'template', 'calculator',
  'generator', 'software', 'vs', 'alternative', 'best',
];
// weight per modifier when scoring collected text (commercial intent strength)
const INTENT_WEIGHT = {
  buy: 3, pricing: 3, price: 2, software: 2, alternative: 2, vs: 2,
  best: 1, tool: 1, template: 1, calculator: 1, generator: 1,
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with',
  'your', 'you', 'run', 'paid', 'using', 'use', 'make', 'build', 'create',
  'that', 'this', 'it', 'as', 'help', 'helps', 'get', 'sharp', 'weekly',
]);

function log(...a) { console.error('[validate]', ...a); }

function loadIdea(id) {
  const raw = JSON.parse(fs.readFileSync(join(REPO, 'data', 'ideas_all.json'), 'utf8'));
  const arr = Array.isArray(raw) ? raw : raw.ideas || Object.values(raw)[0];
  return arr.find((r) => r && r.id === id);
}

function baseKeyword(idea) {
  const words = `${idea.title || ''} ${idea.cat || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  // de-dup preserving order, cap at 5 words for a tight commercial seed
  const seen = new Set();
  const kw = [];
  for (const w of words) if (!seen.has(w)) { seen.add(w); kw.push(w); }
  return kw.slice(0, 5).join(' ').trim() || (idea.title || idea.id).toLowerCase();
}

function queryVariants(base) {
  const set = new Set([base]);
  for (const m of INTENT_MODIFIERS) set.add(`${base} ${m}`);
  return Array.from(set);
}

// ---- cache -----------------------------------------------------------------
function cacheDir(id) {
  const d = join(REPO, 'kits', id, 'evidence', 'cache');
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function cacheKey(provider, query) {
  return createHash('sha256').update(`${provider}::${query.toLowerCase().trim()}`).digest('hex').slice(0, 24);
}
function cacheGet(id, provider, query) {
  try {
    const f = join(cacheDir(id), `${cacheKey(provider, query)}.json`);
    if (!fs.existsSync(f)) return null;
    const rec = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (Date.now() - rec.ts > CACHE_TTL_MS) return null;
    return rec.value;
  } catch { return null; }
}
function cacheSet(id, provider, query, value) {
  try {
    fs.writeFileSync(join(cacheDir(id), `${cacheKey(provider, query)}.json`),
      JSON.stringify({ ts: Date.now(), provider, query, value }));
  } catch { /* cache is best-effort */ }
}

// ---- fetch with timeout ----------------------------------------------------
async function req(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function countModifierHits(texts) {
  const hay = texts.join(' \n ').toLowerCase();
  let score = 0;
  const matched = {};
  for (const m of INTENT_MODIFIERS) {
    const re = new RegExp(`\\b${m}\\b`, 'g');
    const n = (hay.match(re) || []).length;
    if (n > 0) { matched[m] = n; score += n * (INTENT_WEIGHT[m] || 1); }
  }
  return { score, matched };
}

// ---- provider 1: DataForSEO ------------------------------------------------
async function providerDataForSEO(id, base, variants) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return { skipped: 'missing_credentials' };
  const cached = cacheGet(id, 'dataforseo', base);
  if (cached) return cached;

  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  const headers = { Authorization: auth, 'Content-Type': 'application/json' };

  // keyword_overview across variants -> volume + kd
  const kwRes = await req(
    'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live',
    { method: 'POST', headers, body: JSON.stringify([{ keywords: variants.slice(0, 12), language_code: 'en', location_code: 2840 }]) }
  );
  if (!kwRes.ok) throw new Error(`kw_http_${kwRes.status}`);
  const kwJson = await kwRes.json();
  const items = (((kwJson.tasks || [])[0] || {}).result || [])[0]?.items || [];
  let volume = 0, kd = 0;
  const perKw = [];
  for (const it of items) {
    const v = it?.keyword_info?.search_volume || 0;
    const d = it?.keyword_properties?.keyword_difficulty || 0;
    volume = Math.max(volume, v);
    kd = Math.max(kd, d);
    perKw.push({ keyword: it.keyword, volume: v, kd: d });
  }

  // SERP organic for the strongest commercial variant -> saturation
  const serpKw = `${base} best`;
  const serpRes = await req(
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    { method: 'POST', headers, body: JSON.stringify([{ keyword: serpKw, language_code: 'en', location_code: 2840, depth: 20 }]) }
  );
  const domains = new Set();
  const serpTexts = [];
  let drOver70 = 0;
  if (serpRes.ok) {
    const serpJson = await serpRes.json();
    const sItems = (((serpJson.tasks || [])[0] || {}).result || [])[0]?.items || [];
    for (const it of sItems) {
      if (it.type !== 'organic') continue;
      if (it.domain) domains.add(it.domain);
      if (it.title) serpTexts.push(it.title);
      if (it.description) serpTexts.push(it.description);
      const dr = it?.backlinks_info?.rank || it?.rank_info?.domain_rank || 0;
      if (dr > 70) drOver70 += 1;
    }
  }
  // saturation 0..1: KD-driven, escalated by authority-domain density.
  const saturation = Math.min(1, Math.max(kd / 100, drOver70 >= 6 ? 0.85 : drOver70 / 10));
  const penalty = kd > 60 || drOver70 >= 6;
  const intent = countModifierHits(serpTexts);

  const out = {
    ok: true,
    volume, kd,
    saturation: Number(saturation.toFixed(3)),
    dr_over_70: drOver70,
    penalty,
    per_keyword: perKw,
    serp_domains: Array.from(domains).slice(0, 20),
    serp_intent: intent,
  };
  cacheSet(id, 'dataforseo', base, out);
  return out;
}

// ---- provider 2: Reddit ----------------------------------------------------
async function providerReddit(id, base) {
  const ua = process.env.REDDIT_UA;
  if (!ua) return { skipped: 'missing_credentials' }; // default UA is 403'd
  const cached = cacheGet(id, 'reddit', base);
  if (cached) return cached;

  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(base)}&limit=25&sort=relevance&t=year`;
  const res = await req(url, { headers: { 'User-Agent': ua } });
  if (!res.ok) throw new Error(`http_${res.status}`);
  const json = await res.json();
  const children = json?.data?.children || [];
  const permalinks = [];
  const titles = [];
  let engagement = 0;
  for (const c of children) {
    const d = c.data || {};
    if (d.permalink) permalinks.push(`https://www.reddit.com${d.permalink}`);
    if (d.title) titles.push(d.title);
    engagement += (d.num_comments || 0) + (d.score || 0);
  }
  const out = {
    ok: true,
    hits: children.length,
    engagement,
    permalinks: permalinks.slice(0, 15),
    intent: countModifierHits(titles),
  };
  cacheSet(id, 'reddit', base, out);
  return out;
}

// ---- provider 3: Meta Ad Library ------------------------------------------
async function providerMetaAds(id, base) {
  const token = process.env.META_AD_LIBRARY_TOKEN;
  if (!token) return { skipped: 'missing_credentials' };
  const cached = cacheGet(id, 'meta_ads', base);
  if (cached) return cached;

  const params = new URLSearchParams({
    access_token: token,
    search_terms: base,
    ad_active_status: 'ACTIVE',
    ad_reached_countries: JSON.stringify(['US']),
    fields: 'id,page_name,ad_snapshot_url,ad_delivery_start_time',
    limit: '50',
  });
  const res = await req(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
  if (!res.ok) throw new Error(`http_${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`fb_${json.error.code || 'err'}`);
  const data = json.data || [];
  const advertisers = new Set();
  const snapshots = [];
  for (const ad of data) {
    if (ad.page_name) advertisers.add(ad.page_name);
    if (ad.ad_snapshot_url) snapshots.push(ad.ad_snapshot_url);
  }
  const out = {
    ok: true,
    active_ad_competitors: advertisers.size,
    advertiser_names: Array.from(advertisers).slice(0, 20),
    ad_snapshot_urls: snapshots.slice(0, 15),
    total_active_ads: data.length,
  };
  cacheSet(id, 'meta_ads', base, out);
  return out;
}

// ---- provider 4: Gumroad + Etsy marketplace proof --------------------------
async function providerMarketplace(id, base) {
  const cached = cacheGet(id, 'marketplace', base);
  if (cached) return cached;

  const q = encodeURIComponent(base);
  const listings = [];
  const titles = [];
  let gumroad = 0, etsy = 0;

  // Gumroad discover (public HTML). Fail-closed within the parent try/catch.
  try {
    const gr = await req(`https://discover.gumroad.com/?query=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FactoryValidator/1.0)' },
    });
    if (gr.ok) {
      const html = await gr.text();
      const urls = new Set((html.match(/https:\/\/[a-z0-9-]+\.gumroad\.com\/l\/[A-Za-z0-9_-]+/g) || []));
      gumroad = urls.size;
      for (const u of urls) listings.push(u);
    }
  } catch { /* provider is composite; sub-source may fail */ }

  // Etsy search (public HTML).
  try {
    const et = await req(`https://www.etsy.com/search?q=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FactoryValidator/1.0)' },
    });
    if (et.ok) {
      const html = await et.text();
      const urls = new Set((html.match(/https:\/\/www\.etsy\.com\/listing\/\d+/g) || []));
      etsy = urls.size;
      for (const u of urls) listings.push(u);
      for (const m of html.match(/<h3[^>]*>([^<]{5,120})<\/h3>/g) || []) {
        titles.push(m.replace(/<[^>]+>/g, '').trim());
      }
    }
  } catch { /* ignore */ }

  if (gumroad === 0 && etsy === 0 && listings.length === 0) {
    throw new Error('no_marketplace_results');
  }
  const out = {
    ok: true,
    marketplace_proof: gumroad + etsy,
    gumroad_listings: gumroad,
    etsy_listings: etsy,
    urls: listings.slice(0, 15),
    intent: countModifierHits(titles),
  };
  cacheSet(id, 'marketplace', base, out);
  return out;
}

async function safe(provider, name, errors) {
  try {
    const r = await provider();
    if (r && r.skipped) {
      errors.push({ provider: name, error_class: r.skipped });
      return null;
    }
    return r;
  } catch (e) {
    errors.push({ provider: name, error_class: classify(e) });
    return null;
  }
}
function classify(e) {
  const m = String(e && e.message ? e.message : e);
  if (/abort/i.test(m)) return 'timeout';
  if (/http_(4\d\d)/.test(m)) return 'client_error';
  if (/http_(5\d\d)/.test(m)) return 'server_error';
  if (/fb_/.test(m)) return 'meta_api_error';
  return m.slice(0, 40).replace(/\s+/g, '_');
}

async function main() {
  const id = process.argv[2];
  if (!id) { log('usage: node docs/pipeline/validate.mjs <id>'); process.exit(2); }
  const idea = loadIdea(id);
  if (!idea) { log(`idea ${id} not found`); process.exit(2); }

  const base = baseKeyword(idea);
  const variants = queryVariants(base);
  const errors = [];

  const [dfs, reddit, meta, market] = await Promise.all([
    safe(() => providerDataForSEO(id, base, variants), 'dataforseo', errors),
    safe(() => providerReddit(id, base), 'reddit', errors),
    safe(() => providerMetaAds(id, base), 'meta_ad_library', errors),
    safe(() => providerMarketplace(id, base), 'marketplace', errors),
  ]);

  const gotData = [dfs, reddit, meta, market].some((x) => x && x.ok);

  const evidence_urls = [];
  if (reddit?.permalinks) evidence_urls.push(...reddit.permalinks);
  if (meta?.ad_snapshot_urls) evidence_urls.push(...meta.ad_snapshot_urls);
  if (market?.urls) evidence_urls.push(...market.urls);

  // weighted intent score across SERP + ads + listings
  const intentParts = [
    dfs?.serp_intent?.score || 0,
    reddit?.intent?.score || 0,
    market?.intent?.score || 0,
    (meta?.active_ad_competitors || 0) * 3,
  ];
  const intent_score = Math.min(100, intentParts.reduce((a, b) => a + b, 0));

  const record = {
    id,
    base_keyword: base,
    volume: dfs?.volume ?? null,
    kd: dfs?.kd ?? null,
    saturation: dfs?.saturation ?? null,
    active_ad_competitors: meta?.active_ad_competitors ?? null,
    marketplace_proof: market?.marketplace_proof ?? null,
    reddit_hits: reddit?.hits ?? null,
    intent_score,
    evidence_urls: evidence_urls.slice(0, 40),
    signals: {
      dataforseo: dfs || null,
      reddit: reddit || null,
      meta_ad_library: meta || null,
      marketplace: market || null,
      penalty: Boolean(dfs?.penalty),
      dr_over_70: dfs?.dr_over_70 ?? null,
    },
    errors,
    providers_ok: [dfs, reddit, meta, market].filter((x) => x && x.ok).length,
    collected_at: new Date().toISOString(),
  };

  const outDir = join(REPO, 'kits', id, 'evidence');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(join(outDir, 'validation.json'), JSON.stringify(record, null, 2));
  log(`wrote ${join('kits', id, 'evidence', 'validation.json')} (providers_ok=${record.providers_ok})`);

  // best-effort service-role upsert (no-op if key pending)
  const up = await upsert('validations', record, 'id');
  if (up.skipped) log('validations upsert skipped (no service key)');
  else log(`validations upsert ok=${up.ok} status=${up.status || ''}`);

  if (!gotData) {
    log('ZERO providers returned data -> exit 2 (runner SKIPs)');
    process.exit(2);
  }
  process.exit(0);
}

main().catch((e) => { log('fatal', e); process.exit(2); });
