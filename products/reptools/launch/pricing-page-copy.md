# HaulHQ — Pricing Page Copy

Paste-ready copy for `/pricing`. Utilitarian "trader terminal" voice. Money-saved is the hero. Plain sections; the front-end team maps these to the existing CSS/cards.

---

## Page header

**Eyebrow:** PRICING
**H1:** Start free. Go Pro when your hauls do.
**Subhead:** The landed-cost calculator and haul builder are free forever, no login. Pro turns one-off math into a persistent workspace — and usually pays for itself on your next haul.

**Trust line under subhead:** No card for free tools · Cancel anytime · 7-day money-back on Pro

---

## Plan cards

### FREE — $0
*For anyone planning a haul.*

**CTA button:** Open the Haul Builder → (links to `/haul`)

Includes:
- Rep Haul **Landed-Cost Calculator** — items + agent service fee + shipping line + customs/VAT = true delivered cost
- **Haul Builder Lite** — unlimited items (CNY price, qty, weight), live landed total, saved in your browser
- **CNY → USD / EUR / GBP** converter with editable FX rate
- **Shipping-line estimator** with volumetric-weight warning
- **Customs quick-check** — your country's VAT % + de-minimis threshold
- **Copy/print** a clean haul summary for your group chat

---

### PRO — $6/mo  ·  or $48/yr (that's $4/mo, save ~33%)
*For people who run hauls every month.*  **[MOST POPULAR — annual]**

**CTA button:** Go Pro → (opens Stripe Checkout)
**Secondary link:** Pay yearly and save 33% →

Everything in Free, plus:
- **Save unlimited hauls to the cloud** — synced across devices, edit / duplicate / archive
- **Multi-agent price compare** — score the SAME haul across CNFans, Kakobuy, Superbuy, Sugargoo & ACBuy and see the cheapest total landed cost 💡 *this feature alone usually covers a year*
- **Customs optimizer + split-shipment planner** — flags when to split a haul to stay under de minimis and estimates the tax you'd save
- **Shareable public haul pages** (`/h/your-haul`) with QC photos, W2C links & landed total
- **QC photo storage** per item
- **CSV / Excel export** of any haul
- **Price / restock watchlist** — save links with a target price, get email reminders to re-check
- **No item cap** + saved custom FX and custom agent-fee presets

*Billing handled by Stripe. Manage or cancel anytime from your account via the Stripe billing portal.*

---

## Savings hero band (full-width, accent color)

**Big number treatment:**
> On a typical $400 EU haul, comparing agents in HaulHQ Pro surfaces **$30–$60** in avoidable agent-shipping and service-fee overspend — before customs. Pro costs $4/mo.

Small print: Example figures based on typical agent service-fee and shipping-line spreads; your savings depend on your cart, weight, and destination. The tool shows your real numbers.

---

## How Pro pays for itself (3-up)

**1. Compare, don't guess.**
Same cart, every agent, side by side. Pick the cheapest total landed cost instead of defaulting to the agent you always use.

**2. Beat customs legally.**
The split-shipment planner shows when breaking a haul into parcels keeps you under your country's de-minimis threshold — and what that saves in VAT/duty.

**3. Never rebuild a haul again.**
Cloud-saved hauls, QC photos, and CSV export mean your workflow lives in one place instead of a spreadsheet and 40 Discord pins.

---

## FAQ

**Is the calculator really free?**
Yes. The landed-cost calculator, haul builder, converter, shipping estimator, and customs quick-check are free forever and need no login. Pro adds cloud saving, multi-agent compare, split-shipment planning, sharing, and exports.

**How does billing work?**
Pro is a subscription through Stripe: $6/month or $48/year. You manage or cancel anytime from your account through the Stripe billing portal. No lock-in.

**What's the money-back promise?**
If Pro isn't for you, email us within 7 days of your first payment and we'll refund it. No argument.

**Do I need an account for the free tools?**
No. Free tools run in your browser. You only sign in (via a one-time email code — no password) when you go Pro, so your hauls sync across devices.

**Which agents and countries are supported?**
Agents: CNFans, Kakobuy, Superbuy, Sugargoo, ACBuy (more added over time). Customs data: US, UK, EU, Canada, Australia. Tell us if your country's numbers look off — we keep them current.

**Is the price watchlist live scraping?**
Not yet — v1 saves your links and target price and emails you a reminder to re-check them. Honest about that; live price tracking is on the roadmap.

**Can I share a haul publicly?**
Yes, on Pro. Each haul gets a public page at `/h/your-haul` with QC photos, W2C links, and the landed total — great for sharing in your community.

---

## Coming-soon / no-Stripe fallback state

*When Stripe isn't connected yet, the Pro CTA shows this instead of checkout:*

**Badge:** Pro is coming soon
**Copy:** Pro launches shortly. Drop your email and you'll be first in — plus an early-supporter discount when it goes live.
**Field:** Email → **Button:** Notify me
**After submit:** You're on the list. We'll email you the moment Pro opens. Meanwhile, the free tools are all yours → (link to `/haul`)

---

## Final CTA band

**H2:** Know your real landed cost before you pay.
**Button 1:** Open the free Haul Builder → (`/haul`)
**Button 2:** Go Pro — $4/mo yearly → (Stripe Checkout)
