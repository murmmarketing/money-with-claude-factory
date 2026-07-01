// scripts/verify/index.mjs
// Registry for the verifiers package. run-all.mjs (pipeline package, P2) imports
// this to run every verifier with one stable contract and derive a gate.
//
// Contract — each verifier exports `verify({ ideaId, args })` returning:
//   { name, pass:boolean, severity:'hard'|'flag', evidence_path, reasons[], details{} }
// Delivery is BLOCKED only when a result has severity==='hard' && pass===false.
// 'flag' results are advisory (contrast, conversions recompute, skipped tool/live
// scaffolding) and never block — they surface a "needs review" note instead.
//
// score.mjs is the P1 pre-build gate (own CLI + exit codes 0/10/20/30) and is
// exported separately as scoreValidation for direct use by the pipeline.

import { verify as antiSlop } from './anti-slop.mjs';
import { verify as priceCoherence } from './price-coherence.mjs';
import { verify as statSource } from './stat-source.mjs';
import { verify as contrast } from './contrast.mjs';
import { verify as tool } from './tool.mjs';
import { verify as verifyConversions } from './verify-conversions.mjs';
import { verify as liveChecks } from './live-checks.mjs';
import { scoreValidation } from './score.mjs';
import { isMain, parseArgs } from './lib/util.mjs';

export { scoreValidation };

// Static/offline verifiers (no network, safe to run on every build).
export const STATIC_VERIFIERS = [antiSlop, priceCoherence, statSource, contrast, tool];

// Live verifiers (need BASE_URL and/or service-role key; degrade to 'flag').
export const LIVE_VERIFIERS = [verifyConversions, liveChecks];

export const ALL_VERIFIERS = [...STATIC_VERIFIERS, ...LIVE_VERIFIERS];

/**
 * runVerifiers(ideaId, { live, args }) -> { ideaId, results[], blocked, flags[], reasons[] }
 * blocked === true iff any hard verifier failed (delivery must be withheld).
 */
export async function runVerifiers(ideaId, { live = false, args = {} } = {}) {
  const list = live ? ALL_VERIFIERS : STATIC_VERIFIERS;
  const results = [];
  for (const fn of list) {
    try {
      results.push(await fn({ ideaId, args }));
    } catch (e) {
      results.push({
        name: fn.name || 'unknown',
        pass: false,
        severity: 'hard',
        evidence_path: null,
        reasons: [`verifier threw: ${e && e.message ? e.message : e}`],
        details: {},
      });
    }
  }
  const hardFails = results.filter((r) => r.severity === 'hard' && r.pass === false);
  const flags = results.filter((r) => r.severity === 'flag' && (r.pass === false || (r.reasons && r.reasons.length)));
  return {
    ideaId,
    results,
    blocked: hardFails.length > 0,
    reasons: hardFails.flatMap((r) => r.reasons.map((x) => `[${r.name}] ${x}`)),
    flags: flags.flatMap((r) => r.reasons.map((x) => `[${r.name}] ${x}`)),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: node scripts/verify/index.mjs --id <ideaId> [--live]');
    process.exit(2);
  }
  const out = await runVerifiers(ideaId, { live: !!args.live, args });
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.blocked ? 1 : 0);
}
if (isMain(import.meta.url)) main();
