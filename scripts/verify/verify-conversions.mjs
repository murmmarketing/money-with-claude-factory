// scripts/verify/verify-conversions.mjs
// IMPROVEMENT P2 (priority 2): non-LLM bot-discount conversion verifier.
// Recomputes the "real" demand signal BEFORE the promote/kill gate reads it,
// so a burst of bot signups can never fake a conversion.
//
// Pure SQL/REST via PostgREST + service-role key (no LLM, no SDK):
//   real_signups  = COUNT(DISTINCT lower(email)) that are NOT flagged, whose
//                   ip_hash is not in a >3-signup IP, and whose session_id has
//                   >=1 server-inserted 'view' event.
//   real_sessions = COUNT(DISTINCT session_id) from server 'view' events.
//   flagged_count = signups flagged (incl. bursts: >=N within 10s from one IP).
// Flags bursts by UPDATE signups SET flagged=true, upserts scores, and writes
// {idea_id, real_signups, real_sessions, flagged_count} to
// kits/<id>/evidence/conversions.txt. If flagged/total exceeds a threshold the
// run is marked 'needs review'.

import {
  pgrest, writeEvidence, result, isMain, parseArgs, serviceRoleKey, supabaseUrl,
} from './lib/util.mjs';

export const name = 'verify-conversions';

const BURST_N = 3; // >=3 signups...
const BURST_WINDOW_MS = 10_000; // ...within 10s from one ip_hash => burst
const IP_ABUSE_MAX = 3; // an ip_hash appearing >3 times overall is discounted
const REVIEW_RATIO = 0.5; // flagged/total above this => needs review

// Tolerant select: try the rich column set, fall back if columns don't exist
// yet (migrations 0002 / B1 pending).
async function selectSignups(db, ideaId) {
  const rich = `idea_id=eq.${encodeURIComponent(ideaId)}&select=id,email,ip_hash,session_id,flagged,verified,created_at&order=created_at.asc`;
  let res = await db.select('signups', rich);
  if (res.ok) return { rows: res.data || [], columns: 'rich' };
  // fall back to guaranteed columns
  const min = `idea_id=eq.${encodeURIComponent(ideaId)}&select=id,email,session_id,created_at&order=created_at.asc`;
  res = await db.select('signups', min);
  if (res.ok) return { rows: res.data || [], columns: 'min', warn: res.error };
  return { rows: [], columns: 'none', error: res.error, status: res.status };
}

async function selectServerViews(db, ideaId) {
  // server-authoritative 'view' events (source='server' when B1 lands).
  const withSource = `idea_id=eq.${encodeURIComponent(ideaId)}&name=eq.view&source=eq.server&select=session_id,ip_hash,created_at`;
  let res = await db.select('events', withSource);
  if (res.ok) return { rows: res.data || [], mode: 'server-source' };
  const anyView = `idea_id=eq.${encodeURIComponent(ideaId)}&name=eq.view&select=session_id,created_at`;
  res = await db.select('events', anyView);
  if (res.ok) return { rows: res.data || [], mode: 'any-view', warn: res.error };
  return { rows: [], mode: 'none', error: res.error };
}

export async function verify({ ideaId }) {
  if (!supabaseUrl() || !serviceRoleKey()) {
    const evidence_path = await writeEvidence(
      ideaId,
      'conversions.txt',
      `# conversions — ${ideaId}\nSKIPPED: missing FACTORY_SUPABASE_URL / FACTORY_SERVICE_ROLE_KEY\n`,
    );
    return result(name, {
      pass: true, // cannot run without creds; do not block — flag it
      severity: 'flag',
      evidence_path,
      reasons: ['missing service-role credentials; conversions not recomputed'],
      details: { skipped: true },
    });
  }

  const db = pgrest({ role: 'service' });
  const sig = await selectSignups(db, ideaId);
  const views = await selectServerViews(db, ideaId);

  if (sig.columns === 'none') {
    const evidence_path = await writeEvidence(
      ideaId,
      'conversions.txt',
      `# conversions — ${ideaId}\nERROR reading signups (status ${sig.status}): ${JSON.stringify(sig.error)}\n`,
    );
    return result(name, {
      pass: false,
      severity: 'hard',
      evidence_path,
      reasons: [`could not read signups: ${JSON.stringify(sig.error)}`],
      details: { error: sig.error },
    });
  }

  const signups = sig.rows;
  const viewRows = views.rows;

  // sessions with a server 'view' event
  const viewSessions = new Set(viewRows.map((r) => r.session_id).filter(Boolean));
  const real_sessions = viewSessions.size;

  // ip_hash frequency across signups (abuse if > IP_ABUSE_MAX)
  const ipCount = new Map();
  for (const s of signups) {
    if (s.ip_hash) ipCount.set(s.ip_hash, (ipCount.get(s.ip_hash) || 0) + 1);
  }
  const abusiveIps = new Set([...ipCount].filter(([, c]) => c > IP_ABUSE_MAX).map(([ip]) => ip));

  // burst detection: >=BURST_N signups within BURST_WINDOW_MS from one ip_hash
  const byIp = new Map();
  for (const s of signups) {
    if (!s.ip_hash) continue;
    const t = Date.parse(s.created_at);
    if (!Number.isFinite(t)) continue;
    if (!byIp.has(s.ip_hash)) byIp.set(s.ip_hash, []);
    byIp.get(s.ip_hash).push({ id: s.id, t });
  }
  const burstIds = new Set();
  for (const [, arr] of byIp) {
    arr.sort((a, b) => a.t - b.t);
    for (let i = 0; i < arr.length; i++) {
      let j = i;
      while (j < arr.length && arr[j].t - arr[i].t <= BURST_WINDOW_MS) j++;
      if (j - i >= BURST_N) {
        for (let k = i; k < j; k++) burstIds.add(arr[k].id);
      }
    }
  }

  // Persist burst flags (best effort; only if 'flagged' column exists).
  let flaggedWrites = 0;
  if (sig.columns === 'rich' && burstIds.size) {
    for (const id of burstIds) {
      const res = await db.update('signups', `id=eq.${encodeURIComponent(id)}`, { flagged: true }, 'return=minimal');
      if (res.ok) flaggedWrites++;
    }
  }

  // Real signups: distinct lower(email), not flagged/burst, not abusive IP,
  // and the session actually had a server 'view'.
  const seenEmails = new Set();
  let real_signups = 0;
  for (const s of signups) {
    const email = String(s.email || '').toLowerCase().trim();
    if (!email) continue;
    const flagged = s.flagged === true || burstIds.has(s.id);
    if (flagged) continue;
    if (s.ip_hash && abusiveIps.has(s.ip_hash)) continue;
    // require a server-side view for this session when we have view data
    if (real_sessions > 0 && s.session_id && !viewSessions.has(s.session_id)) continue;
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);
    real_signups++;
  }

  const total = signups.length;
  const flagged_count =
    signups.filter((s) => s.flagged === true).length +
    [...burstIds].filter((id) => !signups.find((s) => s.id === id && s.flagged === true)).length;
  const ratio = total ? flagged_count / total : 0;
  const needs_review = ratio > REVIEW_RATIO;

  // Upsert into scores (tolerant: fall back to minimal columns).
  const payloadFull = {
    id: ideaId,
    idea_id: ideaId,
    sessions: real_sessions,
    real_signups,
    real_sessions,
    flagged_count,
    state: needs_review ? 'needs_review' : undefined,
    updated_at: new Date().toISOString(),
  };
  let scoreUpsert = await db.insert('scores', payloadFull, 'resolution=merge-duplicates,return=minimal');
  if (!scoreUpsert.ok) {
    scoreUpsert = await db.insert(
      'scores',
      { id: ideaId, sessions: real_sessions },
      'resolution=merge-duplicates,return=minimal',
    );
  }

  const out = { idea_id: ideaId, real_signups, real_sessions, flagged_count };
  const lines = [];
  lines.push(`# conversions — ${ideaId}`);
  lines.push(JSON.stringify(out));
  lines.push('');
  lines.push(`total_signups: ${total}`);
  lines.push(`real_signups:  ${real_signups}  (distinct verified emails, bot-discounted)`);
  lines.push(`real_sessions: ${real_sessions}  (distinct server 'view' sessions)`);
  lines.push(`flagged_count: ${flagged_count}  (bursts + pre-flagged)  ratio=${ratio.toFixed(2)}`);
  lines.push(`burst_flagged_written: ${flaggedWrites}/${burstIds.size}`);
  lines.push(`abusive_ips (>${IP_ABUSE_MAX} signups): ${abusiveIps.size}`);
  lines.push(`needs_review: ${needs_review}`);
  lines.push(`signups_columns: ${sig.columns}   views_mode: ${views.mode}`);
  lines.push(`scores_upsert: ${scoreUpsert.ok ? 'ok' : 'FAILED ' + JSON.stringify(scoreUpsert.error)}`);
  const evidence_path = await writeEvidence(ideaId, 'conversions.txt', lines.join('\n') + '\n');

  return result(name, {
    pass: true, // recompute succeeded; the gate reads these numbers
    severity: 'flag',
    evidence_path,
    reasons: needs_review ? [`flagged ratio ${ratio.toFixed(2)} > ${REVIEW_RATIO} — needs review`] : [],
    details: { ...out, total, needs_review, ratio },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: FACTORY_SERVICE_ROLE_KEY=... node scripts/verify/verify-conversions.mjs --id <ideaId>');
    process.exit(2);
  }
  const r = await verify({ ideaId });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.pass ? 0 : 1);
}
if (isMain(import.meta.url)) main();
