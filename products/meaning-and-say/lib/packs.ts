import { CATEGORIES, getTermsByCategory, type CategorySlug, type Term } from "@/lib/terms";

export interface PackSection {
  heading: string;
  body: string[];
}

export interface Pack {
  category: CategorySlug;
  title: string;
  subtitle: string;
  intro: string[];
  practiceTips: string[];
  terms: Term[];
}

const INTROS: Record<CategorySlug, { subtitle: string; intro: string[]; tips: string[] }> = {
  slang: {
    subtitle: "Say every word with confidence — and use it correctly.",
    intro: [
      "This pack collects every slang and internet term on MeaningAndSay into one printable cheat-sheet. Each entry has the plain-English meaning, a natural example sentence, a syllable breakdown, and a phonetic respelling you can read at a glance.",
      "Slang moves fast and half the battle is using a word in the right context — not just saying it right. The examples here are written to show real usage, so you can drop a term into conversation without sounding like you're reading a dictionary."
    ],
    tips: [
      "Read the example sentence out loud, not just the word. Context is what makes slang land.",
      "When a term is an acronym (FOMO, NPC), say the letters or the word the way native users do — this pack marks which is which.",
      "Slang meanings drift. Treat the meaning here as the current, common sense, and watch how people around you actually use it."
    ]
  },
  "foreign-words": {
    subtitle: "Order, greet, and travel without butchering the word.",
    intro: [
      "This pack gathers the borrowed and loan words that trip up English speakers — food, feelings, and phrases from French, Italian, German, Japanese, Spanish and more.",
      "For each one you get the meaning, the origin, and a phonetic respelling tuned to how the word is actually said, including the letters that are silent or surprising (the 'sch' in bruschetta, the silent 'x' people add to espresso)."
    ],
    tips: [
      "Break long words into the marked syllables and say them slowly first, then speed up.",
      "Pay attention to the stressed (CAPITALISED) syllable — stress in the wrong place is the most common giveaway.",
      "Silent letters and hard/soft consonants are called out in the meaning. Read those notes before you say the word."
    ]
  },
  "baby-names": {
    subtitle: "Never mispronounce a name on the first day again.",
    intro: [
      "Names are the highest-stakes pronunciation there is — get someone's name wrong and it stings. This pack collects the tricky first names on MeaningAndSay with meaning, origin, and a clear phonetic guide.",
      "Irish, Scottish, Greek and French names dominate the 'looks nothing like it sounds' list. Each entry shows you the sound, so a register full of Siobháns and Saoirses holds no fear."
    ],
    tips: [
      "When in doubt, still ask the person how they say their own name — this pack gives you the standard pronunciation, but individuals vary.",
      "Say the phonetic respelling, then check it against the syllable breakdown to confirm the stress.",
      "Great for teachers, nurses, receptionists, and anyone reading a roll call cold."
    ]
  },
  "brand-names": {
    subtitle: "Sound like you belong — say the label right.",
    intro: [
      "From Hermès to Xiaomi, the world's best-known brands are also the most mispronounced. This pack lists them with the correct pronunciation and a short note on where the name comes from.",
      "Where a company has officially stated how its name should be said (Nike, Nutella, Hyundai, Huawei), that guidance is reflected here so you can settle the argument for good."
    ],
    tips: [
      "Luxury names are usually French or Italian — the final 'e' is often pronounced (Versace) and the 'H' is often silent (Hermès).",
      "Tech brands from China and Korea have official English pronunciations; this pack uses those.",
      "Stress placement matters most for brands — nail the CAPITALISED syllable and you'll sound right."
    ]
  }
};

export function getPack(category: CategorySlug): Pack | null {
  const meta = CATEGORIES.find((c) => c.slug === category);
  const info = INTROS[category];
  if (!meta || !info) return null;
  const terms = getTermsByCategory(category);
  return {
    category,
    title: `${meta.name} — Pronunciation Pack`,
    subtitle: info.subtitle,
    intro: info.intro,
    practiceTips: info.tips,
    terms
  };
}

/**
 * Render the pack as plain Markdown for the "download as text" option.
 * This is a real, complete deliverable generated from the corpus.
 */
export function packToMarkdown(pack: Pack): string {
  const lines: string[] = [];
  lines.push(`# ${pack.title}`);
  lines.push(`_${pack.subtitle}_`);
  lines.push("");
  lines.push("> MeaningAndSay Pronunciation Pack. Print this page to PDF, or keep the tab open and tap any word to hear it.");
  lines.push("");
  for (const p of pack.intro) lines.push(p, "");
  lines.push("## How to practice");
  for (const t of pack.practiceTips) lines.push(`- ${t}`);
  lines.push("");
  lines.push(`## All ${pack.terms.length} entries`);
  lines.push("");
  for (const t of pack.terms) {
    lines.push(`### ${t.term}  —  say it: ${t.phonetic}`);
    if (t.partOfSpeech) lines.push(`*${t.partOfSpeech}*`);
    lines.push(`- **Syllables:** ${t.syllables}`);
    lines.push(`- **Meaning:** ${t.meaning}`);
    lines.push(`- **Example:** ${t.example}`);
    if (t.origin) lines.push(`- **Origin:** ${t.origin}`);
    lines.push("");
  }
  lines.push("---");
  lines.push("Made with MeaningAndSay · meaningandsay.com");
  return lines.join("\n");
}
