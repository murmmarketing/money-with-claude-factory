/**
 * SEO articles targeting beginner-intent queries. Same Block model as the book
 * so they reuse the <Blocks> renderer. Each is genuinely useful, ends with a
 * natural Playbook CTA (added by the page), and links to HaulHQ/MurmReps where
 * relevant. These are the free traffic path that funnels into the paid guide.
 */

import type { Block } from './content';

export interface Article {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  updated: string;
  readMinutes: number;
  blocks: Block[];
  ctaChapter?: string; // chapter slug to point deeper into
}

export const ARTICLES: Article[] = [
  {
    slug: 'how-to-buy-reps-for-beginners',
    title: 'How to Buy Reps for Beginners: A Complete 2026 Walkthrough',
    description:
      'A plain-English, step-by-step guide to buying reps in 2026 — finds, agents, QC, shipping and customs — without getting scammed on your first haul.',
    keywords: ['how to buy reps for beginners', 'buying reps 2026', 'rep buying guide'],
    updated: '2026-06-01',
    readMinutes: 8,
    ctaChapter: 'start-here',
    blocks: [
      { t: 'h2', text: 'The whole process in five steps' },
      {
        t: 'p',
        text:
          'Buying reps looks intimidating from the outside, but the process is always the same five steps: find a product link, have an agent buy it, check QC photos of your actual item, ship it home, and legit-check it on arrival. Master those and everything else is detail.',
      },
      {
        t: 'ol',
        items: [
          'FIND — get a link to a specific listing (a "W2C"). Start from a vetted catalog, not random marketplace search.',
          'ORDER — paste the link into an agent (a buying service). They buy it from the seller and receive it at their warehouse.',
          'QC — the agent photographs your actual item. You approve ("green light") or reject before shipping.',
          'SHIP — pick a shipping line and the agent sends your parcel internationally. This is usually your biggest cost after the product.',
          'RECEIVE — it clears customs, arrives, and you do a final legit-check.',
        ],
      },
      {
        t: 'callout',
        title: 'The mental model that fixes 90% of confusion',
        text:
          'The seller, the agent and the shipping company are three separate businesses. When something confuses you, ask which of the three you are dealing with. Beginners get lost by blurring them together.',
      },
      { t: 'h2', text: 'What it actually costs' },
      {
        t: 'p',
        text:
          'Your true "landed cost" is product + agent fee (often zero) + international shipping + customs/VAT. A $35 item can double once it lands, so decide your all-in ceiling before you shop. Use a landed-cost calculator like HaulHQ so you are not guessing.',
      },
      { t: 'h2', text: 'The three rules that keep beginners safe' },
      {
        t: 'ul',
        items: [
          'Never pay a stranger directly — real agents are companies with QC and a wallet system.',
          'Always inspect QC photos before you approve shipping. It is your one free chance to reject a bad item.',
          'Budget shipping and customs before you fall in love with a product.',
        ],
      },
      { t: 'h2', text: 'Your first haul, the smart way' },
      {
        t: 'p',
        text:
          'Keep it small: one or two items you actually want, from vetted finds, with landed cost worked out in advance. Your first order is a rehearsal — you are learning the machine, not maximising the haul. Measure yourself for sizing first (it is the #1 first-haul regret), and choose a standard or economy shipping line rather than defaulting to the fastest.',
      },
    ],
  },
  {
    slug: 'how-to-read-qc-photos',
    title: 'How to Read QC Photos: Accept or Reject Your Rep Before It Ships',
    description:
      'A repeatable checklist for reading QC (quality control) photos — what to inspect, what counts as a real flaw vs. a nitpick, and exactly when to reject.',
    keywords: ['how to read qc photos', 'rep qc check', 'green light qc reps'],
    updated: '2026-06-01',
    readMinutes: 6,
    ctaChapter: 'reading-qc-photos',
    blocks: [
      { t: 'h2', text: 'QC is your one free chance to catch a bad item' },
      {
        t: 'p',
        text:
          'When your item reaches the agent\'s warehouse, they photograph the exact unit you\'ll receive. This is your window to approve ("green light") or reject before you pay to ship it worldwide. Skip it and you own whatever arrives.',
      },
      { t: 'h2', text: 'The checklist — run it every time' },
      {
        t: 'ol',
        items: [
          'Right item, colourway and SIZE on the label.',
          'Logos & text: spelling, font, spacing and placement vs. a genuine reference.',
          'Stitching: straight, even seams; no skipped or crooked stitching on visible areas.',
          'Colour & material: matches reference; texture not obviously cheap.',
          'Hardware: zippers, buckles, eyelets aligned and unscratched.',
          'Shape & proportions: silhouette matches reference (critical for shoes).',
          'Damage: no glue stains, scuffs or dents beyond trivial.',
          'Accessories: box, tags, dust bag, spare laces as expected.',
        ],
      },
      {
        t: 'callout',
        title: 'Flaw vs. nitpick',
        text:
          'Every rep has minor imperfections; so does retail. A stray thread or tiny glue speck is normal. Reject for wrong/crooked logos, wrong colour, wrong shape, real damage, or the wrong size — things that will bother you every time or scream "fake" across a room.',
      },
      { t: 'h2', text: 'How to actually reject' },
      {
        t: 'p',
        text:
          'If QC fails, do not approve shipping. Use the agent\'s dispute flow, name the specific flaw and attach the QC photo. "Logo is 3mm off-centre, see photo" gets resolved; "it looks bad" does not. Outcomes are usually a refund or a re-purchase.',
      },
    ],
  },
  {
    slug: 'rep-sizing-guide',
    title: 'Rep Sizing Guide: Converting Factory Sizes Across Shoes, Hoodies and Bags',
    description:
      'Why rep sizing runs small, how to measure yourself once, and how to convert factory sizing for shoes, tops and bags so you stop gambling on size.',
    keywords: ['rep sizing guide', 'rep shoe size conversion', 'reps size chart asian sizing'],
    updated: '2026-06-01',
    readMinutes: 6,
    ctaChapter: 'sizing-across-factories',
    blocks: [
      { t: 'h2', text: 'Why sizing is the #1 regret' },
      {
        t: 'p',
        text:
          'Cross-border returns are painful, so a wrong size usually means eating the cost. Rep sizing is inconsistent because factories cut differently and many use Asian sizing, which runs smaller than Western labels. The fix is measuring yourself once and matching real measurements — not trusting the letter on the tag.',
      },
      {
        t: 'callout',
        title: 'The golden rule',
        text: 'Buy to the size chart\'s measurements, not the size letter. A listing\'s "L" is meaningless; its "chest 56cm, length 72cm" is a fact you can check against your own numbers.',
      },
      { t: 'h2', text: 'Measure yourself once, use it forever' },
      {
        t: 'ul',
        items: [
          'Feet: foot length in cm (standing, heel to longest toe, larger foot). Your most reliable shoe input.',
          'Top: chest circumference + the length of a top that fits you well.',
          'Bottoms: waist where you wear trousers + inseam of a pair that fits.',
        ],
      },
      { t: 'h2', text: 'Shoes, tops and bags' },
      {
        t: 'table',
        headers: ['Item', 'Match this measurement'],
        rows: [
          ['Sneakers', 'Foot length (cm) vs. listing insole; note model-specific run big/small'],
          ['Hoodies / tees', 'Flat chest width (×2) and body length vs. a garment you own'],
          ['Trousers', 'Waist + inseam; check leg opening'],
          ['Bags', 'Actual cm dimensions — photos lie about scale constantly'],
        ],
      },
      {
        t: 'p',
        text:
          'Assume factory tops run about one size small versus your Western label until measurements prove otherwise — a Western L often needs an XL or XXL on the tag. For an oversized fit, size to the garment measurement you want, not your body.',
      },
    ],
  },
  {
    slug: 'best-rep-agents-explained',
    title: 'Best Rep Agents Explained: How Chinese Buying Agents Actually Work',
    description:
      'What a rep agent really does, how the big ones differ, how their fees actually work, and how to pick your first agent without overthinking it.',
    keywords: ['best rep agents', 'chinese buying agent reps', 'cnfans kakobuy sugargoo'],
    updated: '2026-06-01',
    readMinutes: 7,
    ctaChapter: 'choosing-an-agent',
    blocks: [
      { t: 'h2', text: 'What an agent is (and is not)' },
      {
        t: 'p',
        text:
          'An agent is a company that buys items from Chinese sellers on your behalf, receives them at its warehouse, takes QC photos, stores them while you shop, and ships your consolidated parcel internationally. It is a logistics business — not a store, and not a person in your DMs.',
      },
      { t: 'h2', text: 'How agents actually make money' },
      {
        t: 'ul',
        items: [
          'Service fee — some charge a small per-item or percentage fee; many popular agents charge zero.',
          'Shipping margin — the real profit center. The rate you\'re quoted already includes their markup.',
          'Payment/currency spreads — minor, but they add up on big hauls.',
        ],
      },
      {
        t: 'callout',
        title: 'The fee trap',
        text:
          'The "no service fee" agent is not automatically cheapest. A zero-fee agent with a pricey shipping line can cost more than a small-fee agent with a cheap line. Compare the full landed cost of your actual cart — HaulHQ does this across agents so you stop guessing.',
      },
      { t: 'h2', text: 'How to pick your first agent' },
      {
        t: 'p',
        text:
          'The popular Western-friendly agents are more alike than different for a beginner — they all do buy, QC, store, consolidate, ship. Compare shipping-line selection, QC photo quality, English support, and coupons. Any mainstream option is a safe first choice; do not overthink it.',
      },
      {
        t: 'table',
        headers: ['What to compare', 'Why it matters'],
        rows: [
          ['Shipping lines offered', 'Determines real cost and speed for your country'],
          ['QC photo quality', 'You approve hundreds of dollars off these photos'],
          ['English UI & support', 'Fewer costly mistakes on early orders'],
          ['Storage window', 'Lets you build a haul before shipping (usually ~60–90 days free)'],
        ],
      },
    ],
  },
  {
    slug: 'rep-slang-glossary',
    title: 'Rep Slang Glossary: W2C, QC, GL, Batch and Every Term Decoded',
    description:
      'A complete beginner glossary of rep-buying slang — W2C, QC, GL, batch, haul, consolidation, de minimis, volumetric — defined clearly, once.',
    keywords: ['rep slang glossary', 'what does w2c mean', 'qc gl batch reps meaning'],
    updated: '2026-06-01',
    readMinutes: 5,
    ctaChapter: 'slang-decoder',
    blocks: [
      { t: 'h2', text: 'The core vocabulary' },
      {
        t: 'table',
        headers: ['Term', 'Meaning'],
        rows: [
          ['Rep', 'Replica. "1:1"/"high-tier" = seller claims it is very close to retail.'],
          ['W2C', '"Where to cop" — a request for, or a shared link to, a specific product.'],
          ['Find', 'A vetted product link the community rates as a good version.'],
          ['Agent', 'A buying service (CNFans, Kakobuy, Sugargoo, etc.) that buys and ships for you.'],
          ['QC', 'Quality Control photos of your actual item before shipping.'],
          ['GL / RL', 'Green light (approve shipping) / red light (reject).'],
          ['Batch', 'A specific factory production run/version; communities rank them by quality.'],
          ['Haul', 'A group of items bought and shipped together.'],
          ['Consolidation', 'Combining items into one parcel to cut shipping cost.'],
          ['De minimis', 'Value threshold under which a country charges no import tax.'],
          ['Volumetric', 'Shipping charged on the greater of real weight or size-based weight.'],
          ['Landed cost', 'Your true total: product + fee + shipping + customs/VAT.'],
        ],
      },
      {
        t: 'callout',
        title: 'One habit worth building',
        text:
          'When you meet a new abbreviation, do not scroll past it — look it up. The people who "get it fast" just refused to let a single unknown term slide.',
      },
    ],
  },
  {
    slug: 'is-buying-reps-safe',
    title: 'Is Buying Reps Safe? Scams, Seized Packages and How to Avoid Them',
    description:
      'An honest look at the real risks of buying reps — scams, seizures and customs — and the concrete habits that keep beginners out of trouble in 2026.',
    keywords: ['is buying reps safe', 'reps scam', 'reps seized customs'],
    updated: '2026-06-01',
    readMinutes: 6,
    ctaChapter: 'shipping-and-customs',
    blocks: [
      { t: 'h2', text: 'The two real risks: scams and seizures' },
      {
        t: 'p',
        text:
          'Most horror stories fall into two buckets: getting scammed by a fake "seller" who skips the agent, or having a parcel held at customs. Both are largely avoidable with a few habits.',
      },
      { t: 'h2', text: 'Avoiding scams' },
      {
        t: 'ul',
        items: [
          'Never pay a person directly. Real agents are companies with QC photos and a wallet system.',
          'Ignore anyone pushing a "private seller" only they can access, or asking you to pay outside a platform.',
          'Always inspect QC before approving shipping — it is your free chance to reject a bad item.',
        ],
      },
      { t: 'h2', text: 'Customs in 2026' },
      {
        t: 'p',
        text:
          'Rules tightened recently. In the US, the $800 de-minimis exemption for China ended in 2025, so parcels can face duties/fees regardless of value. The EU charges VAT from the first euro; the UK applies import VAT above ~£135. Treat these as estimates and confirm for your country.',
      },
      {
        t: 'callout',
        title: 'On under-declaring',
        text:
          'Agents can lower the declared value, but that is misdeclaration and the risk (fees, delays, seizure) is yours. Know your real thresholds, decide deliberately, and never assume a low declared value makes a parcel invisible. Run your numbers in HaulHQ first.',
      },
      { t: 'h2', text: 'Lower-risk habits' },
      {
        t: 'ul',
        items: [
          'Keep parcel value/quantity reasonable; giant hauls draw more attention and bigger bills.',
          'Use established shipping lines known to work for your country.',
          'Prefer discreet packaging (good agents do this by default).',
        ],
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
