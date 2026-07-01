import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PronounceButton from "@/app/components/PronounceButton";
import PackActions from "@/app/components/PackActions";
import { getCategory } from "@/lib/terms";
import { getPack, packToMarkdown } from "@/lib/packs";
import { getStripe } from "@/lib/stripe";
import { stripeEnabled } from "@/lib/site";

export const dynamic = "force-dynamic";

export function generateMetadata({
  params
}: {
  params: { category: string };
}): Metadata {
  const cat = getCategory(params.category);
  return {
    title: cat ? `${cat.name} Pronunciation Pack` : "Pronunciation Pack",
    robots: { index: false, follow: false }
  };
}

async function isPaid(
  sessionId: string | undefined,
  category: string
): Promise<boolean> {
  if (!sessionId) return false;
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return (
      session.payment_status === "paid" &&
      session.metadata?.category === category
    );
  } catch {
    return false;
  }
}

export default async function PackPage({
  params,
  searchParams
}: {
  params: { category: string };
  searchParams: { session_id?: string };
}) {
  const cat = getCategory(params.category);
  if (!cat) notFound();

  const pack = getPack(cat.slug);
  if (!pack) notFound();

  const enabled = stripeEnabled();
  const paid = await isPaid(searchParams.session_id, cat.slug);

  // Gate: real content only unlocks with a verified paid session.
  if (!paid) {
    return (
      <section className="block">
        <div className="container prose">
          <h1 className="section-title">{cat.name} Pronunciation Pack</h1>
          {enabled ? (
            <div className="notice">
              We couldn&apos;t verify a purchase for this pack. If you just paid,
              return via the link in your receipt. Otherwise you can buy it on
              the <Link href="/pricing">packs page</Link>.
            </div>
          ) : (
            <div className="notice">
              Paid packs aren&apos;t live yet. Every term in this category is
              already free to read and hear —{" "}
              <Link href={`/category/${cat.slug}`}>browse them here</Link>, or{" "}
              <Link href="/pricing">join the waitlist</Link>.
            </div>
          )}
        </div>
      </section>
    );
  }

  const markdown = packToMarkdown(pack);

  return (
    <section className="block">
      <div className="container prose" style={{ maxWidth: 780 }}>
        <div className="notice" style={{ marginBottom: 20 }}>
          ✅ Purchase confirmed — thank you! This is your pack. Bookmark, print,
          or download it below. Tap-to-hear works on every entry.
        </div>

        <h1 className="section-title">{pack.title}</h1>
        <p className="section-sub">{pack.subtitle}</p>

        <PackActions
          filename={`meaningandsay-${cat.slug}-pack.md`}
          markdown={markdown}
        />

        {pack.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        <h2>How to practice</h2>
        <ul>
          {pack.practiceTips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>

        <h2>All {pack.terms.length} entries</h2>
        {pack.terms.map((t) => (
          <div className="def-block" key={t.slug}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <h3 style={{ margin: 0 }}>
                {t.term}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                  {t.phonetic}
                </span>
              </h3>
              <PronounceButton text={t.term} label="Hear it" />
            </div>
            <p className="val" style={{ marginTop: 10 }}>
              <strong>Syllables:</strong> {t.syllables}
            </p>
            <p className="val">
              <strong>Meaning:</strong> {t.meaning}
            </p>
            <p className="val" style={{ fontStyle: "italic" }}>
              “{t.example}”
            </p>
            {t.origin ? (
              <p className="val">
                <strong>Origin:</strong> {t.origin}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
