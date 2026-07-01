// scripts/verify/contrast.mjs
// IMPROVEMENT P2 (4/5): pure WCAG 2.x relative-luminance contrast check on the
// brand accent. Asserts contrast(accent, #fff) >= 4.5 and contrast(accent, bg)
// >= 4.5. This is a FLAG (advisory), not a hard fail — a low-contrast accent
// gets surfaced for the owner, it does not block delivery.
// Accent/bg resolved from: --accent/--bg, kits/<id>/brand.json, the landing
// row in Supabase (landing_pages.brand), or the first hex in landing-copy.md.

import path from 'node:path';
import {
  kitDir, readTextSafe, readJsonSafe, writeEvidence, result, isMain, parseArgs,
  pgrest, supabaseUrl,
} from './lib/util.mjs';

export const name = 'contrast';
const THRESHOLD = 4.5;

// ---- pure WCAG math --------------------------------------------------------
export function parseHex(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function channelLum(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb) {
  return 0.2126 * channelLum(rgb.r) + 0.7152 * channelLum(rgb.g) + 0.0722 * channelLum(rgb.b);
}

export function contrastRatio(hexA, hexB) {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---- accent/bg resolution --------------------------------------------------
async function resolveBrand(ideaId, args) {
  if (args.accent) return { accent: args.accent, bg: args.bg || '#ffffff', source: 'cli' };

  const brandJson = await readJsonSafe(path.join(kitDir(ideaId), 'brand.json'));
  if (brandJson && brandJson.accent) {
    return { accent: brandJson.accent, bg: brandJson.bg || '#ffffff', source: 'brand.json' };
  }

  // Supabase landing_pages.brand (service or anon, whichever is configured).
  if (supabaseUrl()) {
    for (const role of ['service', 'anon']) {
      const db = pgrest({ role });
      if (!db.ok) continue;
      const res = await db.select('landing_pages', `id=eq.${encodeURIComponent(ideaId)}&select=brand&limit=1`);
      if (res.ok && Array.isArray(res.data) && res.data[0] && res.data[0].brand) {
        const brand = res.data[0].brand;
        if (brand.accent) return { accent: brand.accent, bg: brand.bg || '#ffffff', source: `db:${role}` };
      }
    }
  }

  // Fallback: first hex color in landing-copy.md, else the landing default.
  const landing = await readTextSafe(path.join(kitDir(ideaId), 'landing-copy.md'));
  const m = landing && landing.match(/#[0-9a-f]{6}\b/i);
  if (m) return { accent: m[0], bg: '#ffffff', source: 'landing-copy.md' };

  return { accent: '#2f6df6', bg: '#ffffff', source: 'default (launchpad accent)' };
}

export async function verify({ ideaId, args = {} }) {
  const { accent, bg, source } = await resolveBrand(ideaId, args);
  const onWhite = contrastRatio(accent, '#ffffff');
  const onBg = contrastRatio(accent, bg);

  const invalid = onWhite == null || onBg == null;
  const okWhite = onWhite != null && onWhite >= THRESHOLD;
  const okBg = onBg != null && onBg >= THRESHOLD;
  const pass = !invalid && okWhite && okBg;

  const lines = [];
  lines.push(`# contrast (WCAG) — ${ideaId}`);
  lines.push(`accent: ${accent}   bg: ${bg}   (source: ${source})`);
  lines.push(`contrast(accent, #ffffff) = ${onWhite == null ? 'N/A' : onWhite.toFixed(2)}  (need >= ${THRESHOLD}) -> ${okWhite ? 'ok' : 'LOW'}`);
  lines.push(`contrast(accent, bg)      = ${onBg == null ? 'N/A' : onBg.toFixed(2)}  (need >= ${THRESHOLD}) -> ${okBg ? 'ok' : 'LOW'}`);
  lines.push(`result: ${pass ? 'PASS' : 'FLAG (advisory, does not block)'}`);
  const evidence_path = await writeEvidence(ideaId, 'contrast.txt', lines.join('\n') + '\n');

  const reasons = [];
  if (invalid) reasons.push(`unparseable color(s): accent=${accent}, bg=${bg}`);
  if (!okWhite && onWhite != null) reasons.push(`accent on white ${onWhite.toFixed(2)} < ${THRESHOLD}`);
  if (!okBg && onBg != null) reasons.push(`accent on bg ${onBg.toFixed(2)} < ${THRESHOLD}`);

  return result(name, {
    pass,
    severity: 'flag', // advisory per spec
    evidence_path,
    reasons,
    details: { accent, bg, source, onWhite, onBg, threshold: THRESHOLD },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: node scripts/verify/contrast.mjs --id <ideaId> [--accent #hex] [--bg #hex]');
    process.exit(2);
  }
  const r = await verify({ ideaId, args });
  console.log(JSON.stringify(r, null, 2));
  // advisory: exit 0 even when flagged, so a low contrast never breaks CI.
  process.exit(0);
}
if (isMain(import.meta.url)) main();
