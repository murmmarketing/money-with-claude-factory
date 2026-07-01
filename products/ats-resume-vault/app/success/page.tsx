import Link from "next/link";
import { redirect } from "next/navigation";
import { retrieveCheckoutSession } from "@/lib/stripe";
import { signToken } from "@/lib/tokens";
import { stripeEnabled } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;

  if (stripeEnabled() && sessionId) {
    const session = await retrieveCheckoutSession(sessionId);
    if (session?.paid && session.product) {
      const token = signToken(session.product);
      redirect(`/download?token=${encodeURIComponent(token)}&product=${encodeURIComponent(session.product)}`);
    }
  }

  return (
    <section className="hero">
      <div className="narrow">
        <span className="eyebrow">Order</span>
        <h1>Thanks for your purchase</h1>
        <p className="lead">
          We&apos;re confirming your payment. If your download doesn&apos;t appear in a
          moment, check your email for the receipt and link, or contact support and
          we&apos;ll sort it out fast.
        </p>
        <p style={{ marginTop: 20 }}>
          <Link href="/" className="btn btn-ghost">Back to home</Link>
        </p>
      </div>
    </section>
  );
}
