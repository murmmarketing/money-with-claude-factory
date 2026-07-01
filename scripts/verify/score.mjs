// scripts/verify/score.mjs
// IMPROVEMENT P1: deterministic KILL / LANDING / FULL tier the LLM cannot fudge.
//
// Reads the validation.json produced by the pipeline (P1 demand-triage stage)
// and returns a tier the model has no say in. Hard gates run first; the score
// is a fixed weighted formula in which commercial-intent + hard marketplace/ad
// proof (W1/W2/W3) dominate raw search volume (W4) by design, with SERP
// saturation counting AGAINST the idea (W5), per BLUEPRINT stage 1.
//
// validation.json shape (fields optional; missing => 0 / empty):
// {
//   idea_id: string,
//   signal: string,
//   evidence_urls: string[],        // >=3 required or KILL
//   intent_score: number,           // 0-1 (0-100 also accepted) commercial intent
//   marketplace_proof: number,      // # of existing paid listings/products (Gumroad/Etsy/etc.)
//   active_ad_competitors: number,  // # active paid competitors in Meta Ad Library
//   volume: number,                 // monthly search volume (weak signal)
//   saturation: number,             // 0-1 keyword difficulty / SERP saturation
//   errors: string[]                // triage errors (=> FLAG when no usable signal)
// }
//
// CLI: node scripts/verify/score.mjs kits/<id>/evidence/validation.json
//   prints verdict JSON; exit code 0=FULL, 10=LANDING, 20=KILL, 30=FLAG.

import { promises as fs } from 'node:fs';
import { norm01, num, clamp, isMain, parseArgs } from './lib/util.mjs';

// --- weights (W1/W2/W3 dominate W4 by design) -----------------------------
export const WEIGHTS = {
  W1_intent: 50,       // commercial intent (0-1)
  W2_marketplace: 25,  // marketplace proof (saturating count)
  W3_ads: 20,          // active paid competitors (saturating count)
  W4_volume: 18,       // raw search volume (log, capped) — weakest
  W5_saturation: 15,   // penalty for SERP saturation / KD
};
export const THRESHOLDS = {
  T_full: 55,
  T_landing: 12,
  saturation_extreme: 0.85, // above this you cannot realistically out-rank
  proof_saturate_at: 5,     // count at which proof/ads contribution ~maxes
  volume_cap: 100000,       // volume at which vol contribution ~maxes
};

const EXIT = { FULL: 0, LANDING: 10, KILL: 20, FLAG: 30 };

function proofNorm(count) {
  const n = Math.max(0, num(count));
  return clamp(n / THRESHOLDS.proof_saturate_at, 0, 1);
}
function volumeNorm(v) {
  const n = Math.max(0, num(v));
  return clamp(Math.log1p(n) / Math.log1p(THRESHOLDS.volume_cap), 0, 1);
}

/**
 * scoreValidation(v) -> { tier, score, reasons[], components, exitCode }
 * Pure function, no I/O. Deterministic.
 */
export function scoreValidation(v) {
  const reasons = [];
  const val = v && typeof v === 'object' ? v : {};

  const evidence = Array.isArray(val.evidence_urls) ? val.evidence_urls.filter(Boolean) : [];
  const errors = Array.isArray(val.errors) ? val.errors.filter(Boolean) : [];

  const intent = norm01(val.intent_score);
  const marketplace = Math.max(0, num(val.marketplace_proof));
  const ads = Math.max(0, num(val.active_ad_competitors));
  const volume = Math.max(0, num(val.volume));
  const saturation = norm01(val.saturation);

  const hasHardProof = marketplace > 0 || ads > 0;
  const usableSignal = intent > 0 || hasHardProof || volume > 0;

  const components = {
    intent01: intent,
    marketplace01: proofNorm(marketplace),
    ads01: proofNorm(ads),
    volume01: volumeNorm(volume),
    saturation01: saturation,
    hasHardProof,
  };

  const score =
    WEIGHTS.W1_intent * components.intent01 +
    WEIGHTS.W2_marketplace * components.marketplace01 +
    WEIGHTS.W3_ads * components.ads01 +
    WEIGHTS.W4_volume * components.volume01 -
    WEIGHTS.W5_saturation * components.saturation01;
  const roundScore = Math.round(score * 100) / 100;

  // --- HARD GATES FIRST ---------------------------------------------------
  if (evidence.length < 3) {
    reasons.push(`insufficient corroboration: ${evidence.length}/3 evidence URLs`);
    return finalize('KILL', roundScore, reasons, components);
  }

  // Triage errored AND nothing usable to score on => FLAG (skip, don't kill).
  if (errors.length && !usableSignal) {
    reasons.push(`triage error with no usable signal: ${errors.slice(0, 3).join('; ')}`);
    return finalize('FLAG', roundScore, reasons, components);
  }

  const saturationExtreme = saturation >= THRESHOLDS.saturation_extreme;

  // --- TIERING ------------------------------------------------------------
  if (score >= THRESHOLDS.T_full && hasHardProof && !saturationExtreme) {
    reasons.push(`score ${roundScore} >= T_full ${THRESHOLDS.T_full}`);
    reasons.push(hardProofReason(marketplace, ads));
    reasons.push(`saturation ${saturation.toFixed(2)} < extreme ${THRESHOLDS.saturation_extreme}`);
    return finalize('FULL', roundScore, reasons, components);
  }

  if (hasHardProof && saturationExtreme) {
    reasons.push(`commercial proof exists (${hardProofReason(marketplace, ads)}) but saturation ${saturation.toFixed(2)} too high to out-rank -> landing test only`);
    return finalize('LANDING', roundScore, reasons, components);
  }

  if (score >= THRESHOLDS.T_landing) {
    if (!hasHardProof) {
      reasons.push('demand present but no hard commercial proof (marketplace/ads) -> cheap landing test, not a full build');
    } else if (score < THRESHOLDS.T_full) {
      reasons.push(`score ${roundScore} below T_full ${THRESHOLDS.T_full} -> landing test`);
    }
    return finalize('LANDING', roundScore, reasons, components);
  }

  reasons.push(`score ${roundScore} below T_landing ${THRESHOLDS.T_landing} and no commercial proof`);
  return finalize('KILL', roundScore, reasons, components);
}

function hardProofReason(marketplace, ads) {
  const parts = [];
  if (marketplace > 0) parts.push(`${marketplace} marketplace listing(s)`);
  if (ads > 0) parts.push(`${ads} active ad competitor(s)`);
  return parts.length ? `hard proof: ${parts.join(' + ')}` : 'no hard proof';
}

function finalize(tier, score, reasons, components) {
  return { tier, score, reasons, components, exitCode: EXIT[tier] };
}

// --- CLI --------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args._[0];
  if (!file) {
    console.error('usage: node scripts/verify/score.mjs kits/<id>/evidence/validation.json');
    process.exit(EXIT.KILL);
  }
  let raw;
  try {
    raw = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) {
    // Unreadable validation => treat as KILL (no evidence at all).
    const verdict = {
      tier: 'KILL',
      score: 0,
      reasons: [`could not read/parse ${file}: ${e && e.message ? e.message : e}`],
      exitCode: EXIT.KILL,
    };
    console.log(JSON.stringify(verdict, null, 2));
    process.exit(EXIT.KILL);
  }
  const verdict = scoreValidation(raw);
  verdict.idea_id = raw.idea_id ?? args.id ?? null;
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(verdict.exitCode);
}

if (isMain(import.meta.url)) {
  main();
}
