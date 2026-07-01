#!/usr/bin/env node
/**
 * MeaningAndSay corpus pipeline.
 *
 * The site renders one static page per entry in data/terms.json. This script
 * is how you scale the corpus from hundreds to thousands of pages without
 * touching app code:
 *
 *   1. Ask Claude to produce new entries in the same JSON shape (see the
 *      REQUIRED_FIELDS below) and save them to data/incoming.json.
 *   2. Run:  node scripts/build-corpus.mjs --merge
 *      -> validates, slugifies, de-dupes against the live corpus, and appends
 *         the new entries to data/terms.json (sorted, ready to build).
 *   3. Run:  node scripts/build-corpus.mjs --validate
 *      -> checks the whole corpus and prints category counts.
 *
 * Then just `next build` to publish the new pages.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TERMS_PATH = join(ROOT, "data", "terms.json");
const INCOMING_PATH = join(ROOT, "data", "incoming.json");

const REQUIRED_FIELDS = [
  "term",
  "category",
  "meaning",
  "example",
  "syllables",
  "phonetic"
];
const VALID_CATEGORIES = new Set([
  "slang",
  "foreign-words",
  "baby-names",
  "brand-names"
]);

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function validateEntry(entry, index) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!entry[field] || String(entry[field]).trim() === "") {
      errors.push(`entry #${index}: missing "${field}"`);
    }
  }
  if (entry.category && !VALID_CATEGORIES.has(entry.category)) {
    errors.push(
      `entry #${index} (${entry.term ?? "?"}): invalid category "${entry.category}"`
    );
  }
  return errors;
}

function normalize(entry) {
  const slug = entry.slug && entry.slug.trim() ? entry.slug : slugify(entry.term);
  return { ...entry, slug };
}

function validateCorpus(terms) {
  const errors = [];
  const seen = new Set();
  terms.forEach((t, i) => {
    errors.push(...validateEntry(t, i));
    const slug = t.slug || slugify(t.term || "");
    if (seen.has(slug)) errors.push(`duplicate slug: "${slug}"`);
    seen.add(slug);
  });
  return errors;
}

function printStats(terms) {
  const byCat = {};
  for (const t of terms) byCat[t.category] = (byCat[t.category] ?? 0) + 1;
  console.log(`\nCorpus: ${terms.length} entries`);
  for (const [cat, n] of Object.entries(byCat).sort()) {
    console.log(`  ${cat.padEnd(16)} ${n}`);
  }
}

function cmdValidate() {
  const terms = readJson(TERMS_PATH);
  const errors = validateCorpus(terms);
  if (errors.length) {
    console.error(`\n❌ ${errors.length} problem(s) found:`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log("✅ Corpus is valid.");
  printStats(terms);
}

function cmdMerge() {
  if (!existsSync(INCOMING_PATH)) {
    console.error(
      `No data/incoming.json found. Create it with new entries (same shape as terms.json) first.`
    );
    process.exit(1);
  }
  const existing = readJson(TERMS_PATH).map(normalize);
  const incoming = readJson(INCOMING_PATH).map(normalize);

  const incomingErrors = validateCorpus(incoming);
  if (incomingErrors.length) {
    console.error(`\n❌ incoming.json has problems:`);
    for (const e of incomingErrors) console.error("  - " + e);
    process.exit(1);
  }

  const bySlug = new Map(existing.map((t) => [t.slug, t]));
  let added = 0;
  let updated = 0;
  for (const entry of incoming) {
    if (bySlug.has(entry.slug)) {
      bySlug.set(entry.slug, entry);
      updated++;
    } else {
      bySlug.set(entry.slug, entry);
      added++;
    }
  }

  const merged = [...bySlug.values()].sort((a, b) =>
    a.term.toLowerCase().localeCompare(b.term.toLowerCase())
  );

  writeFileSync(TERMS_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`✅ Merged. Added ${added}, updated ${updated}.`);
  printStats(merged);
  console.log(`\nNow run "next build" to publish the new pages.`);
}

const arg = process.argv[2];
if (arg === "--merge") cmdMerge();
else cmdValidate();
