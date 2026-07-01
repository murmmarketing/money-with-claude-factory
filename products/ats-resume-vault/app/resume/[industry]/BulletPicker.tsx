"use client";

import { useMemo, useState } from "react";
import type { Bullet, Seniority } from "@/data/industries";

const SENIORITY_LABEL: Record<Seniority, string> = {
  entry: "Entry-level / new grad",
  mid: "Mid-level",
  senior: "Senior / lead"
};

export default function BulletPicker({
  bullets,
  categories,
  industryName
}: {
  bullets: Bullet[];
  categories: string[];
  industryName: string;
}) {
  const [seniority, setSeniority] = useState<Seniority>("mid");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const matches = bullets.filter(
      (b) => b.seniority === seniority && (category === "all" || b.category === category)
    );
    // Fall back to any seniority within the category if the exact filter is empty,
    // so the picker always shows something useful.
    const pool = matches.length ? matches : bullets.filter((b) => category === "all" || b.category === category);
    return pool.slice(0, 5);
  }, [bullets, seniority, category]);

  return (
    <div className="picker">
      <h3 style={{ marginTop: 0 }}>Free bullet picker</h3>
      <p style={{ marginTop: 0 }}>
        Pick a seniority and theme to preview real {industryName} resume bullets. The full
        kit includes the complete library with every bullet.
      </p>
      <div style={{ marginTop: 8 }}>
        <select value={seniority} onChange={(e) => setSeniority(e.target.value as Seniority)} aria-label="Seniority">
          {(Object.keys(SENIORITY_LABEL) as Seniority[]).map((s) => (
            <option key={s} value={s}>
              {SENIORITY_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Theme">
          <option value="all">All themes</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        {filtered.map((b, i) => (
          <div key={i} className="bullet-out">
            <span className="cat">{b.category}</span>
            <div>{b.text}</div>
          </div>
        ))}
        {filtered.length === 0 && <p>No bullets match — try another theme.</p>}
      </div>
    </div>
  );
}
