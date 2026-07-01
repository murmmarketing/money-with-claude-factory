import type { Metadata } from "next";
import SearchClient from "@/app/components/SearchClient";
import { getAllTerms } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Search words, names & brands",
  description:
    "Search MeaningAndSay for the meaning and pronunciation of any slang word, foreign phrase, name, or brand."
};

export default function SearchPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  return (
    <section className="block">
      <div className="container">
        <h1 className="section-title">Search</h1>
        <p className="section-sub">
          Meaning, example, syllables, and tap-to-hear for every entry.
        </p>
        <SearchClient terms={getAllTerms()} initialQuery={q} />
      </div>
    </section>
  );
}
