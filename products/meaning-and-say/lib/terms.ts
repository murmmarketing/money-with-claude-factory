import rawTerms from "@/data/terms.json";

export type CategorySlug =
  | "slang"
  | "foreign-words"
  | "baby-names"
  | "brand-names";

export interface Term {
  slug: string;
  term: string;
  category: CategorySlug;
  partOfSpeech?: string;
  meaning: string;
  example: string;
  syllables: string;
  phonetic: string;
  origin?: string;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  short: string;
  blurb: string;
  intent: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "slang",
    name: "Slang & Internet Words",
    short: "Slang",
    blurb:
      "Modern slang, Gen-Z terms, and internet words explained in plain English — what they mean and how to actually use them.",
    intent: "what does ___ mean"
  },
  {
    slug: "foreign-words",
    name: "Foreign & Loan Words",
    short: "Foreign Words",
    blurb:
      "Borrowed words and phrases from French, Italian, German, Japanese and beyond — meanings plus the pronunciation people get wrong.",
    intent: "how to pronounce ___"
  },
  {
    slug: "baby-names",
    name: "Names & Baby Names",
    short: "Names",
    blurb:
      "Tricky first names — their meaning, origin, and a clear phonetic guide so you never mangle a name again.",
    intent: "how to say the name ___"
  },
  {
    slug: "brand-names",
    name: "Brand Names",
    short: "Brands",
    blurb:
      "The brands everyone mispronounces — from Hermès to Xiaomi — with the correct way to say each one.",
    intent: "how to pronounce the brand ___"
  }
];

const terms = rawTerms as Term[];

// Stable sort by display term (case-insensitive) for deterministic builds.
const sortedTerms = [...terms].sort((a, b) =>
  a.term.toLowerCase().localeCompare(b.term.toLowerCase())
);

export function getAllTerms(): Term[] {
  return sortedTerms;
}

export function getTermBySlug(slug: string): Term | undefined {
  return sortedTerms.find((t) => t.slug === slug);
}

export function getTermsByCategory(category: CategorySlug): Term[] {
  return sortedTerms.filter((t) => t.category === category);
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryName(slug: CategorySlug): string {
  return getCategory(slug)?.name ?? slug;
}

/**
 * Related terms: same category first, then fill from other categories.
 */
export function getRelatedTerms(term: Term, limit = 6): Term[] {
  const sameCat = getTermsByCategory(term.category).filter(
    (t) => t.slug !== term.slug
  );
  const others = sortedTerms.filter(
    (t) => t.category !== term.category && t.slug !== term.slug
  );
  return [...sameCat, ...others].slice(0, limit);
}

export function termStats() {
  const byCat: Record<string, number> = {};
  for (const c of CATEGORIES) byCat[c.slug] = 0;
  for (const t of sortedTerms) byCat[t.category] = (byCat[t.category] ?? 0) + 1;
  return { total: sortedTerms.length, byCat };
}
