// scripts/verify/score.test.mjs
// Run: node --test scripts/verify/score.test.mjs
// Four fixtures pinning the deterministic tier boundaries.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreValidation } from './score.mjs';

const urls3 = ['https://a.example/1', 'https://b.example/2', 'https://c.example/3'];

test('high-intent, low-volume, hard proof -> FULL', () => {
  const v = {
    idea_id: 'FX-FULL',
    evidence_urls: urls3,
    intent_score: 0.9,
    marketplace_proof: 3,
    active_ad_competitors: 2,
    volume: 200,
    saturation: 0.3,
    errors: [],
  };
  const r = scoreValidation(v);
  assert.equal(r.tier, 'FULL');
  assert.equal(r.exitCode, 0);
  assert.ok(r.score >= 55, `score ${r.score} should clear T_full`);
});

test('high-volume, no intent, no proof -> LANDING (cheap test, never full)', () => {
  const v = {
    idea_id: 'FX-LANDING-VOL',
    evidence_urls: urls3,
    intent_score: 0.1,
    marketplace_proof: 0,
    active_ad_competitors: 0,
    volume: 40000,
    saturation: 0.5,
    errors: [],
  };
  const r = scoreValidation(v);
  assert.equal(r.tier, 'LANDING');
  assert.equal(r.exitCode, 10);
  assert.equal(r.components.hasHardProof, false);
});

test('strong proof but extreme saturation -> LANDING (cannot out-rank)', () => {
  const v = {
    idea_id: 'FX-SATURATED',
    evidence_urls: urls3,
    intent_score: 0.7,
    marketplace_proof: 8,
    active_ad_competitors: 5,
    volume: 8000,
    saturation: 0.92,
    errors: [],
  };
  const r = scoreValidation(v);
  assert.equal(r.tier, 'LANDING');
  assert.equal(r.exitCode, 10);
});

test('fewer than 3 evidence URLs -> KILL regardless of score', () => {
  const v = {
    idea_id: 'FX-KILL',
    evidence_urls: ['https://only.example/1', 'https://two.example/2'],
    intent_score: 1,
    marketplace_proof: 20,
    active_ad_competitors: 20,
    volume: 100000,
    saturation: 0.0,
    errors: [],
  };
  const r = scoreValidation(v);
  assert.equal(r.tier, 'KILL');
  assert.equal(r.exitCode, 20);
  assert.match(r.reasons.join(' '), /corroboration/);
});

test('triage error with no usable signal -> FLAG (skip, not kill)', () => {
  const v = {
    idea_id: 'FX-FLAG',
    evidence_urls: urls3,
    intent_score: 0,
    marketplace_proof: 0,
    active_ad_competitors: 0,
    volume: 0,
    saturation: 0,
    errors: ['dataforseo timeout', 'ad library rate-limited'],
  };
  const r = scoreValidation(v);
  assert.equal(r.tier, 'FLAG');
  assert.equal(r.exitCode, 30);
});
