"use client";

import { useState } from "react";
import type { CategorySlug } from "@/lib/terms";

interface Props {
  stripeEnabled: boolean;
  categories: { slug: CategorySlug; name: string }[];
  price: string;
}

export default function BuyPack({ stripeEnabled, categories, price }: Props) {
  const [category, setCategory] = useState<CategorySlug>(categories[0].slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Waitlist state (used when Stripe is not configured)
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      setError(data.error || "Checkout is not available right now.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category })
      });
      setJoined(true);
    } catch {
      setError("Couldn't save your email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="pack-cat"
        style={{ display: "block", fontWeight: 700, marginBottom: 6 }}
      >
        Choose a pack
      </label>
      <select
        id="pack-cat"
        value={category}
        onChange={(e) => setCategory(e.target.value as CategorySlug)}
        style={{
          width: "100%",
          padding: "12px 14px",
          fontSize: 16,
          borderRadius: 10,
          border: "1.5px solid var(--line)",
          marginBottom: 18,
          background: "#fff"
        }}
      >
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      {stripeEnabled ? (
        <button
          className="btn"
          style={{ width: "100%" }}
          onClick={checkout}
          disabled={loading}
        >
          {loading ? "Redirecting…" : `Get this pack — ${price}`}
        </button>
      ) : joined ? (
        <div className="notice">
          You&apos;re on the list. We&apos;ll email you the moment paid packs go
          live. Every term is already free to browse in the meantime.
        </div>
      ) : (
        <form onSubmit={joinWaitlist}>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 0 }}>
            Paid packs are launching soon. Drop your email and we&apos;ll notify
            you first.
          </p>
          <div className="search" style={{ maxWidth: "none" }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "…" : "Notify me"}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p style={{ color: "#b91c1c", fontSize: 14, marginTop: 12 }}>{error}</p>
      ) : null}
    </div>
  );
}
