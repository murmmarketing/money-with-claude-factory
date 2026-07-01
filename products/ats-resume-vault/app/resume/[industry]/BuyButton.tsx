"use client";

import { useState } from "react";

export default function BuyButton({
  product,
  label,
  variant = "primary"
}: {
  product: string;
  label: string;
  variant?: "primary" | "ghost";
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // Stripe not configured -> waitlist flow
      if (data.waitlist) {
        setNeedEmail(true);
        setLoading(false);
        return;
      }
      throw new Error(data.error || "Something went wrong");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function joinWaitlist() {
    if (!email || !email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product })
      });
      if (!res.ok) throw new Error("Could not join the waitlist.");
      setWaitlisted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (waitlisted) {
    return <div className="notice">You&apos;re on the list. We&apos;ll email you the moment this kit is live.</div>;
  }

  if (needEmail) {
    return (
      <div>
        <div className="notice" style={{ marginBottom: 12 }}>
          Kits are launching shortly. Drop your email and we&apos;ll send yours first.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" onClick={joinWaitlist} disabled={loading}>
            {loading ? "…" : "Join the waitlist"}
          </button>
        </div>
        {error && <p style={{ color: "#b91c1c", marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        className={variant === "ghost" ? "btn btn-ghost" : "btn"}
        onClick={startCheckout}
        disabled={loading}
      >
        {loading ? "Loading…" : label}
      </button>
      {error && <p style={{ color: "#b91c1c", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
