"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Term } from "@/lib/terms";

interface Props {
  terms: Term[];
  initialQuery: string;
}

export default function SearchClient({ terms, initialQuery }: Props) {
  const [q, setQ] = useState(initialQuery);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return terms.slice(0, 40);
    return terms
      .filter((t) => {
        const hay = `${t.term} ${t.meaning} ${t.phonetic} ${
          t.origin ?? ""
        }`.toLowerCase();
        return hay.includes(query);
      })
      .slice(0, 60);
  }, [q, terms]);

  return (
    <div>
      <form className="search" onSubmit={(e) => e.preventDefault()} role="search">
        <input
          type="search"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a word, name, or brand…"
          aria-label="Search"
        />
      </form>

      <p className="section-sub" style={{ marginTop: 20 }}>
        {q.trim()
          ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q.trim()}”`
          : `Showing ${results.length} of ${terms.length} entries`}
      </p>

      {results.length === 0 ? (
        <div className="notice">
          No match yet. Try a shorter query, or browse a category from the menu.
          New terms are added on every build.
        </div>
      ) : (
        <ul className="term-list">
          {results.map((t) => (
            <li key={t.slug}>
              <Link href={`/term/${t.slug}`}>
                <span>{t.term}</span>
                <span className="say">{t.phonetic}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
