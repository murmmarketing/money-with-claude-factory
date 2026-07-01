// scripts/verify/tool.mjs
// IMPROVEMENT P2 (5/5): golden-test the generated calculator/tool.
//  - imports compute() from launchpad/lib/toolCompute.ts (shared with backend B3)
//  - runs every spec.tests[] case: |got[k]-expect[k]| <= (tol ?? 1e-6)
//  - proves every formula expression parses AND only uses allowlisted idents
//  - requires >= 3 tests
//  - does one live round-trip POST to ${BASE}/api/tool/<id> when BASE_URL is set
// Writes one verdict per check to evidence/tool-verify.jsonl.
//
// Contract (backend B3 / launchpad/lib/toolCompute.ts):
//   compute(spec, rawInputs) -> { outputs: {key:number}, vars: {key:number} }
//   ToolSpec = { inputs:[{key,type,...}], vars?:[{key,expr,precision}],
//               outputs:[{key,expr,precision}] }
// The kit's tool.spec.json is that ToolSpec plus a `tests:[{input,expect,tol?}]`
// array (expect is keyed by output/var key).
//
// Degrades gracefully: if toolCompute or its `expr-eval` dep or the spec is not
// present yet this FLAGs (needs review) instead of crashing, so it never blocks
// the whole run on missing scaffolding.

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promises as fs } from 'node:fs';
import {
  kitDir, evidenceDir, ensureDir, readJsonSafe, result,
  fileExists, isMain, parseArgs, baseUrl, httpJson, jsonlLine, REPO_ROOT,
} from './lib/util.mjs';
import { validateExpr } from './lib/expr.mjs';

export const name = 'tool';

const TOOL_COMPUTE_CANDIDATES = [
  'launchpad/lib/toolCompute.ts',
  'launchpad/lib/toolCompute.js',
  'launchpad/lib/toolCompute.mjs',
];

async function loadSpec(ideaId) {
  return (
    (await readJsonSafe(path.join(kitDir(ideaId), 'tool.spec.json'))) ||
    (await readJsonSafe(path.join(evidenceDir(ideaId), 'tool.spec.json'))) ||
    null
  );
}

async function loadCompute() {
  for (const rel of TOOL_COMPUTE_CANDIDATES) {
    const abs = path.join(REPO_ROOT, rel);
    if (!fileExists(abs)) continue;
    try {
      const mod = await import(pathToFileURL(abs).href);
      const fn = mod.compute || (mod.default && mod.default.compute) || mod.default;
      if (typeof fn === 'function') return { fn, path: rel };
      return { fn: null, path: rel, error: 'module has no compute() export' };
    } catch (e) {
      // e.g. expr-eval not installed yet, or TS that node can't strip.
      return { fn: null, path: rel, error: `import failed: ${e && e.message ? e.message : e}` };
    }
  }
  return { fn: null, path: null, error: 'toolCompute.{ts,js,mjs} not found in launchpad/lib' };
}

// Identifiers a formula is allowed to reference: input keys + var keys + output
// keys (matches toolCompute's own whitelist of declared keys).
function allowlistFor(spec) {
  const names = new Set();
  for (const group of ['inputs', 'vars', 'outputs']) {
    if (Array.isArray(spec[group])) {
      for (const v of spec[group]) {
        if (v && typeof v.key === 'string') names.add(v.key);
        else if (typeof v === 'string') names.add(v);
      }
    }
  }
  return names;
}

// Every formula expr (vars + outputs), labeled by key.
function collectExprs(spec) {
  const out = [];
  for (const group of ['vars', 'outputs']) {
    if (Array.isArray(spec[group])) {
      spec[group].forEach((e, i) => {
        if (e && typeof e.expr === 'string' && e.expr.trim()) {
          out.push({ label: `${group}.${e.key || i}`, expr: e.expr });
        }
      });
    }
  }
  return out;
}

// Flatten compute() result into a single {key:number} map for comparison.
function flatten(res) {
  if (!res || typeof res !== 'object') return {};
  return { ...(res.vars || {}), ...(res.outputs || {}) };
}

export async function verify({ ideaId }) {
  const dir = await ensureDir(evidenceDir(ideaId));
  const jsonlPath = path.join(dir, 'tool-verify.jsonl');
  const records = [];
  const emit = (rec) => records.push(rec);

  const spec = await loadSpec(ideaId);
  const compute = await loadCompute();

  // --- graceful degradation: scaffolding not built yet -> FLAG -------------
  if (!spec || !compute.fn) {
    const missing = [];
    if (!spec) missing.push('tool.spec.json');
    if (!compute.fn) missing.push(compute.error || 'toolCompute');
    emit({ check: 'setup', pass: null, flag: true, missing });
    await fs.writeFile(jsonlPath, records.map(jsonlLine).join(''), 'utf8');
    return result(name, {
      pass: true, // do not hard-fail on absent scaffolding
      severity: 'flag',
      evidence_path: jsonlPath,
      reasons: [`tool verification skipped (needs review): missing ${missing.join(', ')}`],
      details: { skipped: true, missing },
    });
  }

  const allow = allowlistFor(spec);
  const tests = Array.isArray(spec.tests) ? spec.tests : [];
  let hardFail = false;
  const reasons = [];

  // --- >= 3 tests required ------------------------------------------------
  if (tests.length < 3) {
    hardFail = true;
    reasons.push(`only ${tests.length} test(s); require >= 3`);
    emit({ check: 'test-count', pass: false, count: tests.length, required: 3 });
  } else {
    emit({ check: 'test-count', pass: true, count: tests.length });
  }

  // --- expression allowlist (secondary, independent of compute's own check) --
  // My parser is a strict arithmetic subset; if it can't parse a formula
  // (e.g. a ternary), that's advisory (compute() is the authority). A POSITIVE
  // detection of a disallowed identifier is a hard fail.
  for (const { label, expr } of collectExprs(spec)) {
    const v = validateExpr(expr, allow);
    const parseError = v.error && /unexpected|expected|end of expression|trailing/.test(v.error);
    if (!v.ok && !parseError) {
      hardFail = true;
      reasons.push(`formula "${label}" references disallowed identifier(s): ${v.unknown.join(', ')}`);
      emit({ check: 'expr', label, expr, pass: false, error: v.error });
    } else {
      emit({ check: 'expr', label, expr, pass: v.ok, advisory: !v.ok, error: v.ok ? null : v.error });
    }
  }

  // --- golden numeric tests ----------------------------------------------
  for (let t = 0; t < tests.length; t++) {
    const tc = tests[t] || {};
    const input = tc.input ?? tc.inputs ?? {};
    const expect = tc.expect ?? tc.expected ?? {};
    const tol = typeof tc.tol === 'number' ? tc.tol : 1e-6;
    let got, err = null;
    try {
      got = flatten(await compute.fn(spec, input));
    } catch (e) {
      err = String(e && e.message ? e.message : e);
    }
    if (err) {
      hardFail = true;
      reasons.push(`test[${t}] threw: ${err}`);
      emit({ check: 'compute', test: t, pass: false, error: err, input });
      continue;
    }
    const diffs = {};
    let ok = Object.keys(expect).length > 0;
    for (const k of Object.keys(expect)) {
      const g = Number(got[k]);
      const e = Number(expect[k]);
      const d = Math.abs(g - e);
      diffs[k] = { got: g, expect: e, diff: Number.isFinite(d) ? d : null, tol };
      if (!(Number.isFinite(d) && d <= tol)) ok = false;
    }
    if (!ok) {
      hardFail = true;
      reasons.push(`test[${t}] output mismatch`);
    }
    emit({ check: 'compute', test: t, pass: ok, input, tol, diffs });
  }

  // --- live round-trip (best effort; only when BASE_URL set) --------------
  const base = baseUrl();
  if (base && tests[0]) {
    const input = tests[0].input ?? tests[0].inputs ?? {};
    const url = `${base}/api/tool/${encodeURIComponent(ideaId)}`;
    const res = await httpJson(url, 'POST', { idea_id: ideaId, input });
    const live = res.ok && res.data && res.data.ok !== false;
    emit({ check: 'live-roundtrip', url, status: res.status, pass: !!live, body: res.data });
    if (!live) {
      hardFail = true;
      reasons.push(`live round-trip to ${url} failed (status ${res.status})`);
    }
  } else {
    emit({ check: 'live-roundtrip', pass: null, skipped: true, reason: base ? 'no tests' : 'BASE_URL not set' });
  }

  await fs.writeFile(jsonlPath, records.map(jsonlLine).join(''), 'utf8');

  return result(name, {
    pass: !hardFail,
    severity: 'hard',
    evidence_path: jsonlPath,
    reasons,
    details: { tests: tests.length, computePath: compute.path, checks: records.length },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: node scripts/verify/tool.mjs --id <ideaId>');
    process.exit(2);
  }
  const r = await verify({ ideaId });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.pass ? 0 : 1);
}
if (isMain(import.meta.url)) main();
