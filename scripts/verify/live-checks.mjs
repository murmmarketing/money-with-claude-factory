// scripts/verify/live-checks.mjs
// IMPROVEMENT P2 (priority 2): live round-trip / analytics-integrity verifier.
// Proves the demand plumbing works AND can't be gamed or silently broken.
// Runs against the live BASE_URL with the service-role key (via PostgREST):
//   (1) GET /l/<id> == 200 and body contains the exact landing_pages.headline;
//       GET /api/og/<id> == 200 (growth/OG wiring).
//   (2) POST synthetic signup to /api/wait -> {ok:true}; service-role SELECT ==
//       exactly 1 row; POST SAME email again -> STILL 1 row (upsert dedup);
//       then DELETE the signup + its events row.
//   (3) raw ANON INSERT into `conversions` must return 401/403 (promote
//       numerator can't be forged).
//   (4) POST /api/event twice with one session_id name='view' -> 1 usable view.
// Writes one verdict per check to kits/<id>/evidence/analytics.jsonl.
// Any hard FAIL blocks delivery (severity 'hard').

import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  pgrest, evidenceDir, ensureDir, result, isMain, parseArgs,
  baseUrl, supabaseUrl, serviceRoleKey, anonKey, httpGet, httpJson, jsonlLine,
} from './lib/util.mjs';

export const name = 'live-checks';

async function getHeadline(db, ideaId) {
  const res = await db.select('landing_pages', `id=eq.${encodeURIComponent(ideaId)}&select=headline&limit=1`);
  if (res.ok && Array.isArray(res.data) && res.data[0]) return res.data[0].headline || null;
  return null;
}

export async function verify({ ideaId }) {
  const dir = await ensureDir(evidenceDir(ideaId));
  const jsonlPath = path.join(dir, 'analytics.jsonl');
  const records = [];
  const emit = (r) => records.push(r);
  const reasons = [];
  let hardFail = false;
  const fail = (msg) => { hardFail = true; reasons.push(msg); };

  const base = baseUrl();
  const haveDb = !!(supabaseUrl() && serviceRoleKey());

  if (!base || !haveDb) {
    emit({ check: 'setup', pass: null, flag: true, base: !!base, db: haveDb });
    await fs.writeFile(jsonlPath, records.map(jsonlLine).join(''), 'utf8');
    return result(name, {
      pass: true, // cannot run pre-deploy; flag rather than block
      severity: 'flag',
      evidence_path: jsonlPath,
      reasons: [`live checks skipped (needs review): BASE_URL=${!!base}, service creds=${haveDb}`],
      details: { skipped: true },
    });
  }

  const db = pgrest({ role: 'service' });
  const anon = pgrest({ role: 'anon' });

  // (1) landing + OG -------------------------------------------------------
  const headline = await getHeadline(db, ideaId);
  const landing = await httpGet(`${base}/l/${encodeURIComponent(ideaId)}`);
  const headlineOk = !!headline && landing.text.includes(headline);
  const landingPass = landing.status === 200 && headlineOk;
  if (!landingPass) fail(`/l/${ideaId} status ${landing.status}, headline match=${headlineOk}`);
  emit({ check: 'landing', url: `${base}/l/${ideaId}`, status: landing.status, headlinePresent: headlineOk, pass: landingPass });

  const og = await httpGet(`${base}/api/og/${encodeURIComponent(ideaId)}`);
  const ogPass = og.status === 200;
  if (!ogPass) fail(`/api/og/${ideaId} status ${og.status}`);
  emit({ check: 'og', url: `${base}/api/og/${ideaId}`, status: og.status, pass: ogPass });

  // (2) signup insert + dedup + cleanup -----------------------------------
  const email = `verify+${Date.now()}@factory.local`;
  const sessionId = `verify-${Date.now()}`;
  const waitUrl = `${base}/api/wait`;
  const payload = { idea_id: ideaId, email, session_id: sessionId, turnstile_token: 'test' };

  const first = await httpJson(waitUrl, 'POST', payload);
  const firstOk = first.ok && first.data && first.data.ok === true;
  if (!firstOk) fail(`/api/wait first POST not ok (status ${first.status})`);
  emit({ check: 'wait-insert', status: first.status, body: first.data, pass: firstOk });

  const sel1 = await db.select('signups', `idea_id=eq.${encodeURIComponent(ideaId)}&email=eq.${encodeURIComponent(email)}&select=id`);
  const count1 = sel1.ok && Array.isArray(sel1.data) ? sel1.data.length : -1;
  const oneRow = count1 === 1;
  if (!oneRow) fail(`expected exactly 1 signup row after insert, got ${count1}`);
  emit({ check: 'wait-select-1', count: count1, pass: oneRow });

  const second = await httpJson(waitUrl, 'POST', payload);
  const sel2 = await db.select('signups', `idea_id=eq.${encodeURIComponent(ideaId)}&email=eq.${encodeURIComponent(email)}&select=id`);
  const count2 = sel2.ok && Array.isArray(sel2.data) ? sel2.data.length : -1;
  const dedupOk = count2 === 1;
  if (!dedupOk) fail(`upsert dedup failed: after 2nd POST expected 1 row, got ${count2}`);
  emit({ check: 'wait-dedup', secondStatus: second.status, count: count2, pass: dedupOk });

  // cleanup (best effort): delete events for the session, then the signup(s)
  await db.remove('events', `idea_id=eq.${encodeURIComponent(ideaId)}&session_id=eq.${encodeURIComponent(sessionId)}`);
  const del = await db.remove('signups', `idea_id=eq.${encodeURIComponent(ideaId)}&email=eq.${encodeURIComponent(email)}`);
  emit({ check: 'cleanup', deletedStatus: del.status, pass: del.ok });

  // (3) anon INSERT into conversions must be rejected ----------------------
  let convStatus = 0;
  if (anon.ok) {
    const res = await anon.insert('conversions', { idea_id: ideaId, amount: 1, email: 'forge@factory.local' }, 'return=minimal');
    convStatus = res.status;
  } else {
    convStatus = -1;
  }
  // 401/403 = RLS lockdown holds; 404 = table/route absent (also un-forgeable).
  const convPass = convStatus === 401 || convStatus === 403;
  const convSoft = convStatus === 404;
  if (!convPass && !convSoft) fail(`anon INSERT into conversions returned ${convStatus} (want 401/403)`);
  emit({ check: 'conversions-locked', status: convStatus, pass: convPass, soft: convSoft });

  // (4) /api/event double 'view' -> 1 usable view --------------------------
  const evUrl = `${base}/api/event`;
  const evSession = `verify-view-${Date.now()}`;
  const evBody = { idea_id: ideaId, session_id: evSession, name: 'view' };
  const ev1 = await httpJson(evUrl, 'POST', evBody);
  const ev2 = await httpJson(evUrl, 'POST', evBody);
  const evSel = await db.select(
    'events',
    `idea_id=eq.${encodeURIComponent(ideaId)}&session_id=eq.${encodeURIComponent(evSession)}&name=eq.view&select=id`,
  );
  const viewCount = evSel.ok && Array.isArray(evSel.data) ? evSel.data.length : -1;
  const viewPass = viewCount === 1; // deduped to exactly one usable view
  if (!viewPass) fail(`/api/event double 'view' produced ${viewCount} usable views (want 1)`);
  emit({ check: 'event-view-dedup', s1: ev1.status, s2: ev2.status, usableViews: viewCount, pass: viewPass });
  // cleanup the synthetic view events
  await db.remove('events', `idea_id=eq.${encodeURIComponent(ideaId)}&session_id=eq.${encodeURIComponent(evSession)}`);

  await fs.writeFile(jsonlPath, records.map(jsonlLine).join(''), 'utf8');

  return result(name, {
    pass: !hardFail,
    severity: 'hard',
    evidence_path: jsonlPath,
    reasons,
    details: { base, checks: records.length },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ideaId = args.id || args._[0];
  if (!ideaId) {
    console.error('usage: BASE_URL=... FACTORY_SERVICE_ROLE_KEY=... node scripts/verify/live-checks.mjs --id <ideaId>');
    process.exit(2);
  }
  const r = await verify({ ideaId });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.pass ? 0 : 1);
}
if (isMain(import.meta.url)) main();
