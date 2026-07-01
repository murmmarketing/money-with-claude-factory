import Link from 'next/link';

const FREE_FEATURES = [
  { ic: 'CALC', h: 'Real landed-cost calculator', p: 'Items + agent service fee + shipping line + your country\'s customs/VAT = the true delivered cost, before you pay.' },
  { ic: 'CART', h: 'Haul Builder Lite', p: 'Add unlimited items with CNY price, qty and weight. Live running subtotal + landed total, saved to your browser — no login.' },
  { ic: 'FX', h: 'CNY → USD / EUR / GBP', p: 'Convert any price with an editable FX rate. See what a ¥ tag really costs you at home.' },
  { ic: 'SHIP', h: 'Shipping-line estimator', p: 'Pick agent + line + total weight for an estimated shipping cost, with a volumetric-weight warning.' },
  { ic: 'VAT', h: 'Customs quick-check', p: 'Your country\'s VAT % and de-minimis threshold, and whether this haul is likely to get taxed.' },
  { ic: 'COPY', h: 'Copy / print haul summary', p: 'One click to a plain-text summary you can paste straight into your Discord.' },
];

const PRO_FEATURES = [
  { ic: 'SAVE', h: 'Cloud-saved hauls', p: 'Save unlimited hauls, synced across devices. Edit, duplicate, archive.' },
  { ic: 'VS', h: 'Multi-agent compare', p: 'Score the SAME cart across every agent\'s fees + lines side by side and highlight the cheapest total landed cost.' },
  { ic: 'SPLIT', h: 'De-minimis split planner', p: 'Flags when to split a haul into multiple parcels to stay under de-minimis, and estimates the tax you\'d save.' },
  { ic: 'LINK', h: 'Shareable haul pages', p: 'A public /h/ page with QC photos, W2C links, prices and landed total — indexable and built to share.' },
  { ic: 'QC', h: 'QC photo storage', p: 'Keep your quality-check pics attached to each item so they never get lost.' },
  { ic: 'CSV', h: 'CSV / Excel export', p: 'Export any haul — items, prices, weights, landed cost — in one click.' },
  { ic: 'WATCH', h: 'Price / restock watchlist', p: 'Save item links with a target price and get an email nudge to re-check.' },
  { ic: 'PRO', h: 'No caps + custom presets', p: 'No item limit, custom FX and custom agent-fee presets saved to your account.' },
];

const FAQS = [
  { q: 'What is a "landed cost" and why does it matter?', a: 'Landed cost is what a haul ACTUALLY costs delivered to your door: the goods, the agent\'s service fee, the international shipping line, and any customs duty / VAT. The ¥ price on the product page is often only 50–70% of that. HaulHQ shows the full number before you pay so there are no surprises.' },
  { q: 'Do I need an account to use the free tools?', a: 'No. The landed-cost calculator, Haul Builder Lite, converter, shipping estimator and customs quick-check all run in your browser with zero login. Your haul is saved locally on your device.' },
  { q: 'Which agents are supported?', a: 'The free tools ship with fee + shipping-line presets for CNFans, Kakobuy, Superbuy, Sugargoo and ACBuy, plus fully editable custom presets. Pro adds the side-by-side multi-agent compare.' },
  { q: 'How accurate are the customs numbers?', a: 'We use published VAT rates and de-minimis thresholds for the US, UK, EU (per country), Canada and Australia. Customs is nuanced and rules change — treat the output as a strong planning estimate, not tax advice. We link the assumptions so you can verify.' },
  { q: 'What do I get with Pro?', a: 'Cloud-saved hauls synced across devices, multi-agent cheapest-total compare, the de-minimis split-shipment planner, shareable public haul pages with QC photos, CSV export, and a price/restock watchlist. $6/mo or $48/yr.' },
  { q: 'Is there a free trial or refund?', a: 'All the free tools are genuinely free forever. Pro has a 7-day money-back promise — if it doesn\'t save you more than it costs, email us for a refund.' },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="container hero">
        <span className="eyebrow">For serious rep buyers · US · UK · EU</span>
        <h1 className="hero-title">
          Know what your haul <span className="hl">really</span> costs — before you pay.
        </h1>
        <p className="hero-sub">
          HaulHQ replaces the messy spreadsheet + Discord workflow. The free
          landed-cost calculator tells you the true delivered price after agent
          fees, shipping line and your country&apos;s customs/VAT. Pro turns it into
          a persistent workspace with cheapest-agent compare and shareable haul
          lists.
        </p>
        <div className="cta-row">
          <Link href="/haul" className="btn btn-primary btn-lg">
            Build a haul — free
          </Link>
          <Link href="/pricing" className="btn btn-ghost btn-lg">
            See Pro →
          </Link>
        </div>

        <div className="savings-strip">
          <div className="stat">
            <div className="n pos">$37</div>
            <div className="l">avg saved / haul on agent choice</div>
          </div>
          <div className="stat">
            <div className="n">5</div>
            <div className="l">agents compared side by side</div>
          </div>
          <div className="stat">
            <div className="n">10</div>
            <div className="l">countries&apos; VAT + de-minimis</div>
          </div>
          <div className="stat">
            <div className="n">0</div>
            <div className="l">login needed for free tools</div>
          </div>
        </div>
      </section>

      {/* WEDGE EXPLAINER */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container container-narrow">
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>The ¥ price is a lie your wallet believes.</h2>
          <p className="muted" style={{ fontSize: 17, marginBottom: 20 }}>
            A ¥420 haul isn&apos;t a ¥420 haul. Add the agent&apos;s service fee, the
            shipping line by chargeable weight, and — if you&apos;re in the EU/UK — VAT
            on top, and your &quot;cheap&quot; find quietly became 40–70% more. Most buyers
            find out at checkout, or worse, at the customs desk.
          </p>
          <div className="ledger" style={{ maxWidth: 420 }}>
            <div className="ledger-row"><span className="k">Goods (¥420 → USD)</span><span className="v">$58.80</span></div>
            <div className="ledger-row"><span className="k">Agent service fee</span><span className="v">$0.00</span></div>
            <div className="ledger-row"><span className="k">Shipping (GD-EUB, 1.4kg)</span><span className="v">$16.24</span></div>
            <div className="ledger-row"><span className="k">VAT / customs (US, under $800)</span><span className="v">$0.00</span></div>
            <div className="ledger-row total"><span className="k">Landed total</span><span className="v">$75.04</span></div>
          </div>
          <p className="faint" style={{ fontSize: 13, marginTop: 12 }}>
            Same haul shipped to Germany at 19% VAT lands at ~$89. HaulHQ shows
            both instantly.
          </p>
        </div>
      </section>

      {/* FREE FEATURES */}
      <section className="container section">
        <span className="eyebrow">Free forever · no login</span>
        <h2 style={{ fontSize: 30, marginBottom: 8 }}>The free rep-buyer toolkit</h2>
        <p className="muted" style={{ marginBottom: 28, maxWidth: '52ch' }}>
          Everything you need to price a haul honestly, right in your browser.
        </p>
        <div className="grid grid-auto">
          {FREE_FEATURES.map((f) => (
            <div key={f.h} className="card feat card-hover">
              <span className="ic">{f.ic}</span>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 26 }}>
          <Link href="/haul" className="btn btn-primary">
            Open the Haul Builder →
          </Link>
        </div>
      </section>

      {/* PRO FEATURES */}
      <section className="section" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow accent">HaulHQ Pro · $6/mo</span>
          <h2 style={{ fontSize: 30, marginBottom: 8 }}>Turn one-off math into a workspace</h2>
          <p className="muted" style={{ marginBottom: 28, maxWidth: '52ch' }}>
            The only rep-buyer tool built around landed cost and agent economics —
            not just link-collecting.
          </p>
          <div className="grid grid-auto">
            {PRO_FEATURES.map((f) => (
              <div key={f.h} className="card card-2 feat card-hover">
                <span className="ic">{f.ic}</span>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 26 }}>
            <Link href="/pricing" className="btn btn-primary">
              Go Pro — $6/mo or $48/yr →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container container-narrow section" id="faq">
        <h2 style={{ fontSize: 28, marginBottom: 18 }}>FAQ</h2>
        {FAQS.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <div className="faq-answer">{f.a}</div>
          </details>
        ))}
      </section>

      {/* CLOSER */}
      <section className="container section center">
        <h2 style={{ fontSize: 32, marginBottom: 14 }}>
          Stop guessing. <span className="accent">Price the haul.</span>
        </h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          Build your first haul in under two minutes. No account, no card.
        </p>
        <Link href="/haul" className="btn btn-primary btn-lg">
          Build a haul — free
        </Link>
      </section>
    </>
  );
}
