import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "How MeaningAndSay works: tap-to-hear pronunciation, accuracy, the pronunciation packs, and more."
};

const FAQS = [
  {
    q: "How does the “Hear it” button work?",
    a: "It uses your browser's built-in speech synthesis (the Web Speech API) to read the word aloud. There are no audio files to download and nothing to install — it works right in the page, including on most phones. If a browser has no speech support, we show the phonetic spelling instead."
  },
  {
    q: "Are the pronunciations 100% accurate?",
    a: "We give the standard, widely-accepted pronunciation for each entry, written as a plain phonetic respelling. Accents and regions vary, and browser voices vary too, so treat the audio as a close guide rather than gospel — especially for names, where you should always defer to how a person says their own name."
  },
  {
    q: "Is the site free?",
    a: "Yes. Every meaning, example, and pronunciation is free to browse and hear. The site is supported by display ads. The only paid item is an optional printable Pronunciation Pack."
  },
  {
    q: "What is a Pronunciation Pack?",
    a: `A one-time ${SITE.packPrice} purchase that bundles every term in a category into a single printable cheat-sheet — meaning, example, syllable breakdown and phonetics for each. You can print it to PDF or download it as a text file, and the tap-to-hear feature still works on the delivered page. You also get free updates as that category grows.`
  },
  {
    q: "How do I get my pack after paying?",
    a: "You're taken straight to your pack's page after checkout — no login, no waiting on an email. Bookmark it, print it, or download it there and then."
  },
  {
    q: "Where do the terms come from?",
    a: "The corpus is hand-curated and expands with every build. New slang, foreign words, names, and brands are added regularly, and each entry is written to be genuinely useful rather than auto-generated filler."
  }
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  return (
    <section className="block">
      <div className="container prose">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <h1 className="section-title">Frequently asked questions</h1>
        {FAQS.map((f) => (
          <div key={f.q}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </div>
        ))}
        <div className="notice" style={{ marginTop: 30 }}>
          Still curious? <Link href="/">Browse the words</Link> or{" "}
          <Link href="/pricing">see the packs</Link>.
        </div>
      </div>
    </section>
  );
}
