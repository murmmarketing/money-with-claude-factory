// scripts/verify/anti-slop.mjs
// IMPROVEMENT P2 (1/5): fail the kit if any markdown still contains slop —
// lorem/TODO/placeholders, weasel "you could...", or unfilled templates.
// pass = zero matches. Logs file:line for every hit to evidence/anti-slop.txt.

import { listMarkdown, readTextSafe, writeEvidence, result, isMain, parseArgs } from './lib/util.mjs';
import path from 'node:path';

const PATTERNS = [
  { re: /\b(?:lorem ipsum|todo|fixme|tbd|placeholder)\b/i, label: 'placeholder/todo token' },
  { re: /\[insert|\[your\b/i, label: 'unfilled bracket "[insert" / "[your"' },
  { re: /\bx{3,}\b/i, label: 'xxx filler' },
  { re: /\byou could\b/i, label: 'weasel "you could" (advice, not a deliverable)' },
  { re: /\{\{.*?\}\}|<[A-Z_]{3,}>/, label: 'unfilled template token ({{..}} or <PLACEHOLDER>)' },
];

export const name = 'anti-slop';

export async function verify({ ideaId }) {
  const files = await listMarkdown(ideaId);
  const hits = [];
  for (const file of files) {
    const text = await readTextSafe(file);
    if (text == null) continue;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const { re, label } of PATTERNS) {
        const m = re.exec(line);
        if (m) {
          hits.push({
            file: path.basename(file),
            line: idx + 1,
            match: m[0],
            label,
            excerpt: line.trim().slice(0, 120),
          });
        }
      }
    });
  }

  const pass = hits.length === 0 && files.length > 0;
  const lines = [];
  lines.push(`# anti-slop — ${ideaId}`);
  lines.push(`scanned ${files.length} markdown file(s)`);
  lines.push(`result: ${pass ? 'PASS (0 matches)' : hits.length ? `FAIL (${hits.length} matches)` : 'FAIL (no markdown found)'}`);
  lines.push('');
  for (const h of hits) {
    lines.push(`${h.file}:${h.line}  [${h.label}]  "${h.match}"  ::  ${h.excerpt}`);
  }
  const evidence_path = await writeEvidence(ideaId, 'anti-slop.txt', lines.join('\n') + '\n');

  return result(name, {
    pass,
    severity: 'hard',
    evidence_path,
    reasons: pass ? [] : hits.length ? hits.slice(0, 10).map((h) => `${h.file}:${h.line} ${h.label}`) : ['no markdown files found in kit'],
    details: { files: files.length, matches: hits.length },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: node scripts/verify/anti-slop.mjs --id <ideaId>');
    process.exit(2);
  }
  const r = await verify({ ideaId });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.pass ? 0 : 1);
}
if (isMain(import.meta.url)) main();
