// scripts/verify/stat-source.mjs
// IMPROVEMENT P2 (3/5): every statistic-shaped claim (NN%, N.Nx, "studies show")
// must have a URL or footnote in the SAME paragraph, or it is flagged as an
// unsourced (likely hallucinated) stat. pass = zero unsourced stats.
// Writes offending paragraphs to evidence/stat-source.txt.

import path from 'node:path';
import { listMarkdown, readTextSafe, paragraphs, writeEvidence, result, isMain, parseArgs } from './lib/util.mjs';

export const name = 'stat-source';

const STAT_PATTERNS = [
  { re: /\b\d{1,3}%/g, label: 'percentage' },
  { re: /\b\d+(?:\.\d+)?x\b/gi, label: 'multiplier (Nx)' },
  { re: /\b(?:studies|research)\s+show(?:s|ed|n)?\b/gi, label: '"studies/research show"' },
];
const URL_RE = /https?:\/\/\S+/i;
const FOOTNOTE_RE = /\[\^?[\w-]+\]|\(\s*source\s*:/i;

export async function verify({ ideaId }) {
  const files = await listMarkdown(ideaId);
  const offenders = [];

  for (const file of files) {
    const text = await readTextSafe(file);
    if (text == null) continue;
    for (const para of paragraphs(text)) {
      const sourced = URL_RE.test(para.text) || FOOTNOTE_RE.test(para.text);
      if (sourced) continue;
      const found = [];
      for (const { re, label } of STAT_PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(para.text)) !== null) found.push(`${label}:"${m[0]}"`);
      }
      if (found.length) {
        offenders.push({
          file: path.basename(file),
          line: para.startLine,
          stats: found,
          excerpt: para.text.replace(/\s+/g, ' ').trim().slice(0, 160),
        });
      }
    }
  }

  const pass = offenders.length === 0;
  const lines = [];
  lines.push(`# stat-source — ${ideaId}`);
  lines.push(`scanned ${files.length} markdown file(s)`);
  lines.push(`result: ${pass ? 'PASS (no unsourced stats)' : `FAIL (${offenders.length} unsourced)`}`);
  lines.push('');
  for (const o of offenders) {
    lines.push(`${o.file}:${o.line}  [${o.stats.join(', ')}]`);
    lines.push(`   ${o.excerpt}`);
  }
  const evidence_path = await writeEvidence(ideaId, 'stat-source.txt', lines.join('\n') + '\n');

  return result(name, {
    pass,
    severity: 'hard',
    evidence_path,
    reasons: pass ? [] : offenders.slice(0, 10).map((o) => `${o.file}:${o.line} unsourced ${o.stats.join(', ')}`),
    details: { files: files.length, unsourced: offenders.length },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: node scripts/verify/stat-source.mjs --id <ideaId>');
    process.exit(2);
  }
  const r = await verify({ ideaId });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.pass ? 0 : 1);
}
if (isMain(import.meta.url)) main();
