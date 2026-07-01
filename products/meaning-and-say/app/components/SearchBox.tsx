"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({
  placeholder = "Try “rizz”, “Hermès”, “Saoirse”…"
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form className="search" onSubmit={submit} role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search for a word, name, or brand"
      />
      <button className="btn" type="submit">
        Search
      </button>
    </form>
  );
}
