// scripts/verify/price-coherence.mjs
// IMPROVEMENT P2 (2/5): the price set quoted on the landing page must be a
// subset of the price set in README.md (the source of truth). Catches a
// landing page promising $19 while the product/README says $29.
// Writes a comparison table to evidence/price-coherence.txt.

import path from 'node:path';
import { kitDir, readTextSafe, extractPrices, writeEvidence, result, isMain, parseArgs } from './lib/util.mjs';

export const name = 'price-coherence';

export async function verify({ ideaId }) {
  const dir = kitDir(ideaId);
  const readmeText = await readTextSafe(path.join(dir, 'README.md'));
  const landingText = await readTextSafe(path.join(dir, 'landing-copy.md'));
  const moveText = await readTextSafe(path.join(dir, 'YOUR-MOVE.md'));

  const readmePrices = extractPrices(readmeText || '');
  const landingPrices = extractPrices(landingText || '');
  const movePrices = extractPrices(moveText || '');

  const readmeSet = new Set(readmePrices);
  // A landing price is coherent iff it appears in the README price set.
  const orphanLanding = landingPrices.filter((p) => !readmeSet.has(p));
  // YOUR-MOVE orphans are advisory (surfaced, not blocking the subset rule).
  const orphanMove = movePrices.filter((p) => !readmeSet.has(p));

  // pass requires README to actually declare a price, and every landing price
  // to be a subset of it.
  const pass = readmePrices.length > 0 && orphanLanding.length === 0;

  const fmt = (arr) => (arr.length ? arr.map((n) => `$${n}`).join(', ') : '(none)');
  const lines = [];
  lines.push(`# price-coherence — ${ideaId}`);
  lines.push('');
  lines.push('| source            | distinct prices        |');
  lines.push('|-------------------|------------------------|');
  lines.push(`| README.md         | ${fmt(readmePrices)} |`);
  lines.push(`| landing-copy.md   | ${fmt(landingPrices)} |`);
  lines.push(`| YOUR-MOVE.md      | ${fmt(movePrices)} |`);
  lines.push('');
  lines.push(`landing ⊆ README : ${orphanLanding.length === 0 ? 'YES' : 'NO'}`);
  if (orphanLanding.length) lines.push(`  landing prices NOT in README: ${fmt(orphanLanding)}`);
  if (orphanMove.length) lines.push(`  (advisory) YOUR-MOVE prices NOT in README: ${fmt(orphanMove)}`);
  if (readmePrices.length === 0) lines.push('  WARNING: README.md declares no price at all.');
  lines.push('');
  lines.push(`result: ${pass ? 'PASS' : 'FAIL'}`);
  const evidence_path = await writeEvidence(ideaId, 'price-coherence.txt', lines.join('\n') + '\n');

  const reasons = [];
  if (readmePrices.length === 0) reasons.push('README.md declares no price');
  if (orphanLanding.length) reasons.push(`landing prices not in README: ${fmt(orphanLanding)}`);

  return result(name, {
    pass,
    severity: 'hard',
    evidence_path,
    reasons,
    details: { readmePrices, landingPrices, movePrices, orphanLanding, orphanMove },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: node scripts/verify/price-coherence.mjs --id <ideaId>');
    process.exit(2);
  }
  const r = await verify({ ideaId });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.pass ? 0 : 1);
}
if (isMain(import.meta.url)) main();
