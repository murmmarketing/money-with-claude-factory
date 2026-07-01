/**
 * THE PRODUCT. Single source of truth for the whole guide.
 * Consumed by (a) the gated web reader, (b) the free-chapter lead magnet, and
 * (c) the on-the-fly PDF generator in lib/pdf.ts. Editing here updates all three
 * and, because buyers get free updates, everyone who owns it.
 *
 * All customs / cost figures are 2026 estimates for planning only — the guide
 * repeatedly tells the reader to confirm live numbers with their agent and to
 * run their own math in HaulHQ.
 */

export type Block =
  | { t: 'h2'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'callout'; title?: string; text: string }
  | { t: 'table'; headers: string[]; rows: string[][] };

export interface Chapter {
  slug: string;
  number: number;
  title: string;
  summary: string;
  minutes: number;
  free: boolean;
  blocks: Block[];
}

export interface CheatSheet {
  slug: string;
  title: string;
  summary: string;
  blocks: Block[];
}

export const HAULHQ_URL = 'https://haulhq.vercel.app';
export const MURMREPS_URL = 'https://murmreps.com';

// ===========================================================================
// CHAPTERS
// ===========================================================================

export const CHAPTERS: Chapter[] = [
  {
    slug: 'start-here',
    number: 1,
    title: 'Start Here: The Rep World in Plain English',
    summary:
      'What reps actually are, why the process looks so confusing from the outside, and the mental model that makes the rest of this book click.',
    minutes: 7,
    free: true,
    blocks: [
      { t: 'h2', text: 'You are not stupid — the process is just badly explained' },
      {
        t: 'p',
        text:
          'If you have spent an evening bouncing between a Reddit thread, three Discord servers and a Telegram channel trying to figure out how people are getting $40 sneakers that look identical to $400 ones, and you came away more confused than when you started — that is normal. The rep (replica) community grew up in private chats, and almost nobody writes anything down for beginners. The knowledge exists, but it is scattered, contradictory, and full of slang nobody defines. This book is the field manual that should have existed the day you got curious.',
      },
      {
        t: 'p',
        text:
          'Here is the whole thing in one sentence: you find a product listing on a Chinese marketplace, a middleman ("an agent") buys it for you and ships it to their warehouse, they photograph it so you can approve or reject it, and then they ship it to your country. That is it. Everything else in this book is detail on how to do each of those steps without wasting money or getting scammed.',
      },
      { t: 'h2', text: 'The five steps, start to finish' },
      {
        t: 'ol',
        items: [
          'FIND — you get a link to a specific product (a "W2C", short for "where to cop"). Finds come from spreadsheets, communities, and find sites.',
          'ORDER — you paste that link into an agent (a buying service). They purchase it from the seller on your behalf and receive it at their warehouse in China.',
          'QC — the agent takes "quality control" photos of your actual item. You inspect them and either approve shipment or ask for a refund/replacement.',
          'SHIP — you choose a shipping line, the agent packs and sends your parcel internationally. This is usually the single biggest cost after the product itself.',
          'RECEIVE — the parcel clears customs, arrives, and you do a final legit-check against reference photos. Done.',
        ],
      },
      {
        t: 'callout',
        title: 'The mental model that fixes everything',
        text:
          'Stop thinking of this like Amazon. Think of it like hiring a personal shopper in another country. The seller, the agent and the shipping company are three different businesses. When something feels confusing, ask: which of these three am I dealing with right now? Ninety percent of beginner mistakes come from blurring them together.',
      },
      { t: 'h2', text: 'What this actually costs (and why nobody can give you one number)' },
      {
        t: 'p',
        text:
          'Your final "landed cost" is: product price + agent service fee (often zero) + international shipping + your country\'s customs/VAT/duty. The product might be $35 and the shipping $30, so a "cheap" item can double once it lands. This is the number that matters, and it is the number beginners always forget. There is a whole chapter on it later, and a free calculator (HaulHQ) that does the math for you so you never guess.',
      },
      {
        t: 'p',
        text:
          'A realistic first haul of one hoodie and one pair of shoes to the US or EU tends to land somewhere around $120–$220 all-in, depending on weight and shipping line. If a number in this book surprises you, that is the point — better to be surprised now than at your doorstep.',
      },
      { t: 'h2', text: 'The three rules that keep beginners out of trouble' },
      {
        t: 'ul',
        items: [
          'Never pay a stranger directly. Real agents are companies with a website, a wallet system and QC photos. A person in your DMs offering to "just sort it for you" is how people lose money.',
          'Always look at QC photos before you approve shipping. This is your one free chance to reject a bad item. Skipping it is the single most expensive beginner mistake.',
          'Budget for shipping and customs before you fall in love with a product. Decide your all-in ceiling first, then shop to it.',
        ],
      },
      {
        t: 'p',
        text:
          'Read the next chapter (the slang decoder) before anything else. Once the vocabulary stops being a wall, every thread and every video suddenly makes sense — and the rest of this book will move fast.',
      },
    ],
  },
  {
    slug: 'slang-decoder',
    number: 2,
    title: 'The Slang Decoder: Every Term You Will See',
    summary:
      'W2C, QC, GL, batch, haul, consolidation, volumetric — every piece of jargon that trips up beginners, defined once, clearly.',
    minutes: 9,
    free: true,
    blocks: [
      { t: 'h2', text: 'The core vocabulary' },
      {
        t: 'p',
        text:
          'You do not need to memorise this — just read it once so nothing looks like a foreign language, then come back when you hit a term. These are the words that appear in almost every thread, listing and QC discussion.',
      },
      {
        t: 'table',
        headers: ['Term', 'What it means'],
        rows: [
          ['Rep', 'Replica. A copy of a branded/designer item. "1:1" or "high-tier" just means the seller claims it is very close to retail.'],
          ['W2C', '"Where to cop." A request for, or a shared link to, a specific product. The find itself.'],
          ['Find', 'A vetted product link the community rates as a good version. "A good find" = a listing worth buying.'],
          ['Agent', 'A buying service (CNFans, Kakobuy, Sugargoo, etc.) that buys from Chinese sellers on your behalf and ships to you.'],
          ['QC', 'Quality Control photos. Pictures your agent takes of your actual item before shipping so you can approve or reject.'],
          ['GL', '"Green light" — approving your QC and telling the agent to proceed to shipping. "RL" = red light (reject).'],
          ['Batch', 'A specific production run/version of a shoe or item from a factory. Different batches vary in quality; communities rank them.'],
          ['Haul', 'A group of items bought and shipped together. Consolidating a haul saves on shipping.'],
          ['Seller / Store', 'The actual merchant on the Chinese marketplace (Taobao, Weidian, 1688). The agent buys from them.'],
          ['Weidian / Taobao / 1688', 'Chinese marketplaces where sellers list. 1688 is wholesale (cheapest, trickier). You do not buy directly — the agent does.'],
        ],
      },
      { t: 'h2', text: 'Shipping & cost words' },
      {
        t: 'table',
        headers: ['Term', 'What it means'],
        rows: [
          ['Warehouse', "The agent's facility in China where your items wait until you ship them home."],
          ['Consolidation', 'Combining multiple items into one parcel to cut per-item shipping cost. Almost always worth it.'],
          ['Shipping line', 'The specific carrier/route (e.g. GD-EUB, YunExpress, CNE, EMS, DHL). Each trades speed vs. cost vs. seizure risk.'],
          ['Volumetric / dim weight', 'Shipping is charged on the GREATER of real weight or "volume weight" (size). Bulky-but-light items get charged on size.'],
          ['Landed cost', 'Your true total: product + service fee + shipping + customs/VAT. The only number that matters.'],
          ['De minimis', 'The value threshold under which a country charges no import tax/duty. Varies wildly by country and is shrinking.'],
          ['VAT / duty', 'Import taxes. VAT is a percentage of value (big in the EU/UK); duty is a category-based tariff.'],
          ['Declared value', 'The value written on the customs form. Agents can lower it, but under-declaring is a risk you own — more later.'],
        ],
      },
      { t: 'h2', text: 'Quality & community words' },
      {
        t: 'table',
        headers: ['Term', 'What it means'],
        rows: [
          ['1:1', 'Marketing shorthand for "as close to retail as it gets." Treat it as a claim to verify with QC, not a guarantee.'],
          ['Tier / high-tier', 'Rough quality bracket. Higher tier usually means better materials and a higher price.'],
          ['Legit check (LC)', 'Comparing your item against genuine retail references to judge accuracy.'],
          ['Retail / retailer', 'The genuine article and where it is sold. Used as the quality benchmark.'],
          ['Flaw', 'A defect visible in QC (glue, stitching, logo placement). Minor flaws are common; deal-breakers are not.'],
          ['Spreadsheet', 'A community-maintained list of vetted finds by category/brand. A common starting point for W2Cs.'],
          ['Cop / cnfans link', 'To buy. A "cnfans link" is a find already formatted for that agent so it drops straight into your cart.'],
        ],
      },
      {
        t: 'callout',
        title: 'One habit worth building now',
        text:
          'When you see a new abbreviation, do not scroll past it. Search it, or check this list. The people who "get it fast" are just the ones who refused to let a single unknown term slide. You now own the decoder — use it.',
      },
    ],
  },
  {
    slug: 'finds-and-w2c',
    number: 3,
    title: 'How Finds & W2C Actually Work',
    summary:
      'Where product links come from, how to read a listing, how to spot a good version vs. a scam listing, and how to turn any find into an order.',
    minutes: 8,
    free: false,
    blocks: [
      { t: 'h2', text: 'A "find" is just a trusted link' },
      {
        t: 'p',
        text:
          'Every purchase starts with a link to a specific seller listing. The community calls a good one a "find" or a "W2C." The reason people obsess over finds is that the same product exists in dozens of listings at wildly different quality and price — the find is someone telling you which exact listing is the good one.',
      },
      { t: 'h2', text: 'Where finds come from' },
      {
        t: 'ul',
        items: [
          'Find sites and catalogs — searchable databases of vetted listings by brand and category. This is the fastest, lowest-drama starting point, especially when they are already formatted for an agent.',
          'Community spreadsheets — crowd-maintained lists, usually organised by category. Great coverage, but quality varies and links rot.',
          'Reddit / Discord threads — people post W2Cs and QC of their own hauls. Good for seeing real results, slower to search.',
          'Direct marketplace search — advanced move: searching Taobao/Weidian yourself via an agent. Powerful but easy to pick a bad version as a beginner.',
        ],
      },
      {
        t: 'callout',
        title: 'Beginner shortcut',
        text:
          'Start from a curated catalog rather than raw marketplace search. You want your first few orders to be boringly successful, not a treasure hunt. MurmReps (' +
          MURMREPS_URL +
          ') indexes ~19.5K finds you can filter — a sane on-ramp before you go spelunking on 1688.',
      },
      { t: 'h2', text: 'How to read a listing before you trust it' },
      {
        t: 'p',
        text:
          'You are almost never buying on the marketplace directly — your agent does — but you still need to judge the listing. Look at:',
      },
      {
        t: 'ol',
        items: [
          'The listing photos vs. community QC. Sellers post the best possible images. Cross-check against real QC of that same listing posted by buyers. If the buyer QC looks nothing like the listing, skip it.',
          'Sales volume and age. A listing with lots of sales and a long history is lower risk than a brand-new one with none.',
          'Price sanity. If one listing is dramatically cheaper than every other version of the same item, assume it is a lower batch or a bait price, not a bargain.',
          'Variant/spec fields. Confirm colourway, size options and any "batch" selector match what you actually want before it goes in the cart.',
        ],
      },
      { t: 'h2', text: 'Batches: why the "same" shoe varies' },
      {
        t: 'p',
        text:
          'For popular sneakers especially, multiple factories produce the same silhouette at different quality levels — these are "batches." Communities rank them (often by a nickname or letter). A higher batch costs more but nails details a lower batch gets wrong. Before buying a hyped shoe, spend five minutes finding the current recommended batch; the top result from a year ago is often outdated.',
      },
      { t: 'h2', text: 'Turning a find into an order' },
      {
        t: 'p',
        text:
          'Most finds are shared as a raw marketplace URL or as a pre-formatted "agent link." The workflow is simple: copy the link, open your chosen agent, paste it into their search/convert bar, and it loads the product ready to add to cart. If you only have a raw Taobao/Weidian URL, every major agent has a box that converts it. From there you are into ordering — the next chapter.',
      },
      {
        t: 'callout',
        title: 'Scam listings to avoid',
        text:
          'Two red flags on any find: (1) it is only shared by one brand-new account pushing you to a specific "private seller", and (2) it asks you to pay outside an agent. Real finds route through an agent with QC. If a "find" tries to skip the agent, it is not a find — it is a setup.',
      },
    ],
  },
  {
    slug: 'choosing-an-agent',
    number: 4,
    title: 'Choosing & Using an Agent',
    summary:
      'What an agent really does, how the big ones differ, how their fees actually work, and a step-by-step of using one from sign-up to warehouse.',
    minutes: 9,
    free: false,
    blocks: [
      { t: 'h2', text: 'What an agent is (and is not)' },
      {
        t: 'p',
        text:
          'An agent is a company that buys items from Chinese sellers on your behalf, receives them at its warehouse, photographs them for QC, stores them while you shop, and ships your consolidated parcel internationally. It is a logistics business, not a store and not a person. The agent does not make the product and usually does not choose it — you do.',
      },
      { t: 'h2', text: 'How agents make money (the fee models)' },
      {
        t: 'ul',
        items: [
          'Service fee — some agents charge a small per-item or percentage fee; many popular ones charge zero and earn on shipping margin instead.',
          'Shipping margin — the real profit center. The rate they quote you for a line already includes their markup. This is why the "cheapest agent" is really the one with the best shipping for your parcel, not the one with the lowest service fee.',
          'Payment / currency fees — small spreads on top-ups and card payments. Minor, but they add up on big hauls.',
        ],
      },
      {
        t: 'callout',
        title: 'The fee trap',
        text:
          'Beginners pick the agent with "no service fee" and assume it is cheapest. It often is not — a zero-fee agent with a pricey shipping line can cost more than a small-fee agent with a cheap line. Compare the full landed cost of your actual cart, not the headline fee. HaulHQ (' +
          HAULHQ_URL +
          ') exists to compare the same cart across agents so you stop guessing.',
      },
      { t: 'h2', text: 'The main agents at a glance' },
      {
        t: 'p',
        text:
          'The popular Western-friendly agents (CNFans, Kakobuy, Sugargoo, Superbuy, ACBuy and a few others) are more alike than different for a beginner. They all do the core loop: buy, QC, store, consolidate, ship. They differ on interface polish, shipping-line selection, QC photo quality, English support, and how often they run shipping coupons. Any of the mainstream ones is a safe first choice — do not overthink your first agent.',
      },
      {
        t: 'table',
        headers: ['What to compare', 'Why it matters'],
        rows: [
          ['Shipping lines offered', 'Determines your real cost and speed. More lines = more ways to optimise a heavy or bulky haul.'],
          ['QC photo quality', 'You are approving hundreds of dollars off these photos. Clear, multi-angle QC is worth a small premium.'],
          ['English UI & support', 'Reduces costly mistakes on your first orders. Matters more than people admit.'],
          ['Coupons / promos', 'Shipping coupons can swing the total meaningfully on a big parcel.'],
          ['Wallet vs. per-order pay', 'Wallet systems are smoother for multi-item hauls; per-order is fine for a single buy.'],
        ],
      },
      { t: 'h2', text: 'Using an agent, step by step' },
      {
        t: 'ol',
        items: [
          'Sign up and top up your wallet (or be ready to pay per order). Only fund what your planned haul needs.',
          'Paste your find link into the agent\'s convert/search bar; confirm the variant, size and colour.',
          'Add to cart and submit the purchase. The agent buys it from the seller — this can take a day or two.',
          'Wait for arrival at the warehouse. You will get a notification and, shortly after, QC photos.',
          'Do QC (next chapter): approve ("green light") or reject. Approved items sit in your warehouse.',
          'When your haul is complete, submit a shipping request: pick your line, declared value handling and packaging options.',
          'Pay the shipping invoice, get a tracking number, and wait for customs + delivery.',
        ],
      },
      {
        t: 'callout',
        title: 'Storage windows',
        text:
          'Agents store your items free for a while (often ~60–90 days) before charging. This is what lets you build a haul over time and ship it all at once. Do not let items age out — note the deadline when the first item lands.',
      },
    ],
  },
  {
    slug: 'placing-your-first-order',
    number: 5,
    title: 'Placing Your First Order Without Screwing It Up',
    summary:
      'A calm, do-this-then-that walkthrough of your very first purchase, including the exact things beginners get wrong at each step.',
    minutes: 7,
    free: false,
    blocks: [
      { t: 'h2', text: 'Plan the whole thing before you spend a cent' },
      {
        t: 'p',
        text:
          'The best first haul is small and deliberate: one or two items you actually want, chosen from vetted finds, with the landed cost worked out in advance. Resist the urge to fill a cart. Your first order is a rehearsal — you are learning the machine, not maximising the haul.',
      },
      {
        t: 'ol',
        items: [
          'Pick 1–2 finds from a trusted catalog. Confirm the recommended batch/version for anything hyped.',
          'Estimate landed cost: product + shipping (guess ~0.5–1.2kg per clothing item, more for shoes) + your country\'s VAT/duty. Run it through HaulHQ so you are not guessing.',
          'Set your ceiling. Decide the maximum you will accept all-in. If the estimate blows past it, cut an item now.',
        ],
      },
      { t: 'h2', text: 'Order day' },
      {
        t: 'ol',
        items: [
          'Fund your wallet with roughly the product cost plus a buffer; you pay shipping later, separately.',
          'Paste each find, triple-check size and colourway. Sizing is the #1 first-haul regret — see the sizing chapter and cheat-sheet before you commit.',
          'Submit the purchase and note the order in a simple list (item, price, size, date). Future-you will thank you.',
          'Wait. Purchasing from the seller and arrival at the warehouse typically takes a few days to a couple of weeks. This is normal, not a scam.',
        ],
      },
      {
        t: 'callout',
        title: 'The mistakes that cost beginners money',
        text:
          'Wrong size (measure yourself, use the sizing chapter). Buying too much before you understand shipping (heavy hauls get expensive fast). Approving QC without looking. Choosing the fastest, most expensive line by default. Each of these has a dedicated chapter — none of them is bad luck, all of them are avoidable.',
      },
      { t: 'h2', text: 'What "good" looks like at this stage' },
      {
        t: 'p',
        text:
          'A successful first order is uneventful: you paid a sane total, the item arrived at the warehouse, the QC looked right, you shipped it on a reasonable line, and it landed close to your estimate. That is the whole game. Once you have done it once, everything after is repetition with better instincts.',
      },
      {
        t: 'p',
        text:
          'Next up is the single most important skill in the entire process — reading QC photos — because that is where you either catch a problem for free or pay to learn the lesson.',
      },
    ],
  },
  {
    slug: 'reading-qc-photos',
    number: 6,
    title: 'Reading QC Photos: Accept or Reject',
    summary:
      'Your one free chance to catch a bad item. What to inspect, what counts as a real flaw vs. a nitpick, and exactly when to reject.',
    minutes: 10,
    free: false,
    blocks: [
      { t: 'h2', text: 'Why QC is the most important five minutes of your haul' },
      {
        t: 'p',
        text:
          'When your item reaches the agent\'s warehouse, they photograph the actual unit you will receive. This is your window to approve ("green light") or reject and request a refund/replacement — before you pay to ship it across the world. Once you approve and ship, that window closes. Beginners who skip QC and just click approve are the ones who post "why is my logo crooked" a month later. Do not be that person.',
      },
      { t: 'h2', text: 'A repeatable QC checklist' },
      {
        t: 'p',
        text:
          'Go through these in order, every time. It takes about five minutes and saves entire hauls.',
      },
      {
        t: 'ol',
        items: [
          'Right item, right spec. Correct model, colourway and size on the label. Sounds obvious; wrong-variant shipments happen.',
          'Logos & text. Check spelling, font, spacing and placement against a genuine reference. Off-centre or wrong-font branding is a hard reject.',
          'Stitching. Look for straight, even seams. Loose threads are trimmable; crooked or skipped stitching on a visible seam is not.',
          'Materials & colour. Compare colour to reference under the QC lighting; watch for the wrong shade or an obviously cheap texture.',
          'Hardware (zippers, buckles, eyelets). Should be even, aligned and unscratched. Misaligned hardware is a common tell.',
          'Shape & proportions. For shoes especially, check the silhouette and toe box against reference photos — proportion errors are the giveaway on low batches.',
          'Damage. Glue stains, scuffs, dents, marks. Minor glue often cleans up; structural damage does not.',
          'Accessories. Box, tags, dust bag, extra laces — confirm what should be included is included.',
        ],
      },
      {
        t: 'callout',
        title: 'Flaw vs. nitpick',
        text:
          'Every rep has minor imperfections; retail does too. A stray thread, a tiny glue speck, a barely-off tag are normal and not worth rejecting a whole item over. Reject for things that will bother you every time you wear it or that scream "fake" across a room: wrong logo, crooked branding, wrong colour, wrong shape, real damage.',
      },
      { t: 'h2', text: 'How to actually reject' },
      {
        t: 'p',
        text:
          'If QC fails, do not approve shipping. Use the agent\'s dispute/refund flow, state the specific flaw, and attach the QC photo showing it. Outcomes are usually a refund or a re-purchase from the same or a better listing. Be specific and calm — "logo is 3mm off-centre, see photo" gets resolved; "it looks bad" does not.',
      },
      { t: 'h2', text: 'Judging quality when you are new' },
      {
        t: 'ul',
        items: [
          'Pull up genuine retail photos side by side. You cannot spot a wrong logo without knowing the right one.',
          'Search community QC of the same listing. If everyone\'s QC of that seller looks clean, yours probably is too.',
          'Zoom in. QC photos are high-res for a reason. Inspect logos and stitching at full zoom, not thumbnail size.',
          'When genuinely unsure, ask. Posting your QC for a second opinion before you green-light is completely normal.',
        ],
      },
      {
        t: 'p',
        text:
          'Keep the one-page QC Red-Flags Checklist (in the cheat-sheets) open while you inspect your first few hauls. After three or four rounds it becomes automatic.',
      },
    ],
  },
  {
    slug: 'sizing-across-factories',
    number: 7,
    title: 'Sizing Across Factories Without Guessing',
    summary:
      'Why rep sizing is inconsistent, how to measure yourself once, and how to convert factory sizing for shoes, tops and bags so you stop gambling.',
    minutes: 8,
    free: false,
    blocks: [
      { t: 'h2', text: 'Why sizing is the #1 regret' },
      {
        t: 'p',
        text:
          'Returns across borders are painful and often not worth it, so a wrong size usually means eating the cost or reselling. Rep sizing is inconsistent because different factories cut differently and many use Asian sizing, which runs smaller than Western labels. The fix is not luck — it is measuring yourself once and matching real measurements to the listing, not trusting the letter on the tag.',
      },
      { t: 'h2', text: 'Measure yourself once, use it forever' },
      {
        t: 'ol',
        items: [
          'Feet: measure foot length in cm, standing, heel to longest toe, both feet (use the larger). This cm number is your single most reliable shoe input.',
          'Chest/top: measure around the fullest part of your chest, and note the length from shoulder seam of a top that fits you well.',
          'Waist: measure around where you actually wear trousers, plus the inseam of a pair that fits.',
          'Write these down. Every future order becomes "does the listing\'s measurement match mine?" instead of a guess.',
        ],
      },
      {
        t: 'callout',
        title: 'The golden rule',
        text:
          'Buy to the size chart\'s measurements, not to the size letter. A listing\'s "L" is meaningless; its "chest 56cm, length 72cm" is a fact you can check against your own numbers.',
      },
      { t: 'h2', text: 'Shoes: use the insole/foot length' },
      {
        t: 'p',
        text:
          'For sneakers, the most reliable method is matching your foot length in cm to the listing\'s stated insole/length for a given size, then cross-checking against how that specific model is known to fit (some run big, some small). When a listing only gives US/UK/EU labels, convert with the sizing cheat-sheet, but always let the cm measurement win if the two disagree.',
      },
      {
        t: 'table',
        headers: ['Item', 'Most reliable measurement to match'],
        rows: [
          ['Sneakers', 'Foot length (cm) vs. listing insole length; note model-specific run big/small'],
          ['Hoodies / tees', 'Chest width (flat, doubled) and body length vs. a garment you own'],
          ['Jackets', 'Chest + shoulder width + sleeve length'],
          ['Trousers', 'Waist + inseam; check leg opening for the intended fit'],
          ['Bags', 'Actual cm dimensions — photos lie about scale constantly'],
        ],
      },
      { t: 'h2', text: 'Tops, bottoms and the Asian-sizing trap' },
      {
        t: 'p',
        text:
          'Assume factory sizing runs at least one size small versus your Western label until the measurements prove otherwise. If you are normally a Western L, expect to often need an XL or XXL on the tag — but confirm with the chest/length numbers rather than blindly sizing up. For a relaxed/oversized fit, size to the measurement you want the garment to be, not to your body.',
      },
      { t: 'h2', text: 'Bags and accessories' },
      {
        t: 'p',
        text:
          'Bags are almost always bought too small because listing photos distort scale. Ignore the vibe of the photo and read the width × height × depth in cm, then hold a ruler up to a bag you own for a real sense of it. This one habit prevents the most common bag disappointment.',
      },
      {
        t: 'p',
        text:
          'The Sizing Conversion Reference cheat-sheet turns all of this into a one-page card you can keep open while ordering.',
      },
    ],
  },
  {
    slug: 'shipping-and-customs',
    number: 8,
    title: 'Shipping, Consolidation & Getting Through Customs',
    summary:
      'How shipping is really priced, why consolidation saves money, choosing a line, and the 2026 customs reality by region — including the end of US de minimis.',
    minutes: 11,
    free: false,
    blocks: [
      { t: 'h2', text: 'Shipping is usually your biggest variable cost' },
      {
        t: 'p',
        text:
          'After the product, international shipping is the number that makes or breaks a haul. It is priced on weight — but not just the weight on the scale. Carriers charge on the GREATER of actual weight and "volumetric" (dimensional) weight, which is calculated from the parcel\'s size. A puffer jacket weighs little but takes up space, so it can be billed on volume. This is why bulky-but-light hauls surprise people.',
      },
      {
        t: 'callout',
        title: 'Volumetric weight, plainly',
        text:
          'Volume weight = (length × width × height in cm) ÷ a divisor the line sets (commonly 6000–8000). If that number is bigger than the real weight, you pay on it. Practical takeaway: compress soft items, avoid shipping air, and let the agent remove bulky shoe boxes if you do not need them.',
      },
      { t: 'h2', text: 'Consolidation: the easiest money you will save' },
      {
        t: 'p',
        text:
          'Every parcel has base costs. Shipping five items in five parcels pays that base five times; consolidating them into one pays it once. This is why the community builds a "haul" and ships it together. Let items collect at the warehouse, then ship once. The only reasons not to: storage deadlines approaching, or a parcel getting heavy enough that splitting keeps you under a customs threshold (more below).',
      },
      { t: 'h2', text: 'Choosing a shipping line' },
      {
        t: 'p',
        text:
          'Each line trades cost, speed and reliability. There is no universally best one — it depends on your country, weight and risk tolerance.',
      },
      {
        t: 'table',
        headers: ['Line type', 'Trade-off'],
        rows: [
          ['Economy lines (e.g. GD-EUB, sensitive-friendly)', 'Cheapest, slowest (2–5 weeks). Best for non-urgent, cost-sensitive hauls.'],
          ['Standard lines (e.g. YunExpress, CNE)', 'Middle ground on price and speed; solid default for most hauls.'],
          ['Express (EMS, DHL)', 'Fastest (about a week) and priciest; more visible to customs. Use when you need speed and can absorb cost.'],
        ],
      },
      {
        t: 'p',
        text:
          'Do not default to the fastest line. For a first haul, a standard or economy line is usually the right call. Run your actual cart through HaulHQ to see the real cost per line side by side rather than picking blind.',
      },
      { t: 'h2', text: 'Customs in 2026: the reality by region' },
      {
        t: 'p',
        text:
          'This is the part that changed most recently, so treat every figure as a 2026 estimate and confirm current rules for your country. The direction of travel everywhere is: fewer exemptions, more tax collected on imports.',
      },
      {
        t: 'ul',
        items: [
          'United States: the long-standing $800 de-minimis exemption for low-value shipments from China ended in 2025. Parcels can now face duties and processing fees regardless of value, so build import cost into your estimate rather than assuming "under $800 = free."',
          'United Kingdom: import VAT (about 20%) applies on goods over roughly £135; duty generally kicks in above that threshold too. Budget VAT on almost anything of real value.',
          'European Union: there is no VAT de-minimis — VAT applies from the first euro, at your country\'s rate (roughly 19–22%). A €150 threshold only exempts duty, not VAT.',
          'Canada: a very low courier de-minimis means GST/HST plus provincial tax often applies, and brokerage fees are common on express lines.',
          'Australia: GST (10%) applies; the low-value duty threshold is comparatively high (around AU$1000).',
        ],
      },
      {
        t: 'callout',
        title: 'On under-declaring',
        text:
          'Agents can lower the declared value on the customs form, and many buyers ask them to. Understand the trade-off honestly: it can reduce tax but it is misdeclaration, and if a parcel is inspected the risk (extra fees, delays, or seizure) is yours, not the agent\'s. This book will not tell you to break your country\'s rules. Know your real thresholds, decide deliberately, and never assume a low declared value makes a parcel invisible.',
      },
      { t: 'h2', text: 'Reducing seizure and cost risk' },
      {
        t: 'ul',
        items: [
          'Keep individual parcels reasonable in value and quantity; giant single hauls draw more attention and bigger tax bills.',
          'Prefer well-established lines known to work for your country; the community tracks which routes are currently smooth.',
          'Avoid obviously branded outer packaging — good agents ship discreetly by default.',
          'Split a haul into two parcels if that keeps each under a meaningful threshold and the shipping math still works.',
        ],
      },
      {
        t: 'p',
        text:
          'The Customs-by-Country Quick Card summarises the thresholds above on one page — keep it next to HaulHQ when you plan a haul.',
      },
    ],
  },
  {
    slug: 'arrival-and-legit-check',
    number: 9,
    title: 'Arrival: Legit-Check, Aftercare & Building From Here',
    summary:
      'What to do the moment your parcel lands, how to legit-check properly, handling problems, and turning one good haul into a repeatable habit.',
    minutes: 7,
    free: false,
    blocks: [
      { t: 'h2', text: 'The parcel landed — do this first' },
      {
        t: 'ol',
        items: [
          'Film the unboxing. A single continuous video protects you if an item is damaged or wrong and you need to raise it with the agent.',
          'Check contents against your order list. Right items, right sizes, all accessories present.',
          'Inspect for transit damage separate from QC — crushing or breakage that happened in shipping, not at the factory.',
        ],
      },
      { t: 'h2', text: 'Legit-checking properly' },
      {
        t: 'p',
        text:
          'A legit-check ("LC") is comparing your item to genuine references now that you can hold it. You already did the photo version at QC; this is the in-hand version.',
      },
      {
        t: 'ul',
        items: [
          'Pull up authentic retail photos and any known "authenticity marker" guides for that item.',
          'Re-check the same things as QC — logos, stitching, materials, hardware, shape — but now with weight, texture and smell in hand.',
          'For sneakers, check the fit and feel too: a great-looking shoe that fits wrong is still a miss for next time.',
          'If you plan to wear it around people who would know, be honest with yourself about the tells you can now see up close.',
        ],
      },
      {
        t: 'callout',
        title: 'Realistic expectations',
        text:
          'Even a top-tier rep is a replica. The goal is "reads correct in normal use," not "fools an expert with a loupe." Judge your item against that bar and you will be happy far more often.',
      },
      { t: 'h2', text: 'When something is wrong' },
      {
        t: 'p',
        text:
          'If an item arrives damaged or clearly not as QC\'d, contact the agent promptly with your unboxing video and photos. Transit damage and agent errors are usually resolvable. Note that if you approved QC on a flaw that was visible in the photos, that is on you — which is exactly why the QC chapter matters so much.',
      },
      { t: 'h2', text: 'Turning one haul into a habit' },
      {
        t: 'ul',
        items: [
          'Keep a running log: item, listing, size, batch, agent, line, landed cost, and whether you were happy. Your second haul should be smarter than your first.',
          'Save the finds and sellers that came through well — a personal list of trusted listings is worth more than any spreadsheet.',
          'Plan hauls, do not impulse-buy singles. Consolidation rewards patience.',
          'Reuse the tools: run every planned haul through HaulHQ (' +
            HAULHQ_URL +
            ') so cost never surprises you, and browse MurmReps (' +
            MURMREPS_URL +
            ') for vetted finds.',
        ],
      },
      {
        t: 'p',
        text:
          'That is the entire loop, start to finish. You now know more than most people three hauls deep. Keep the cheat-sheets handy for your first few orders, and the instincts will follow fast.',
      },
    ],
  },
];

// ===========================================================================
// CHEAT SHEETS (also rendered as one-page printable PDFs)
// ===========================================================================

export const CHEAT_SHEETS: CheatSheet[] = [
  {
    slug: 'qc-red-flags',
    title: 'QC Red-Flags Checklist',
    summary: 'One-page checklist to run on every set of QC photos before you approve shipping.',
    blocks: [
      { t: 'h2', text: 'Run this on every QC set (about 5 minutes)' },
      {
        t: 'ol',
        items: [
          'Right item, colourway and SIZE on the label.',
          'Logos & text: correct spelling, font, spacing, placement vs. a real reference.',
          'Stitching: straight and even; no skipped or crooked seams on visible areas.',
          'Colour & material: matches reference; texture does not look obviously cheap.',
          'Hardware: zippers/buckles/eyelets aligned, even, unscratched.',
          'Shape & proportions: silhouette matches reference (critical for shoes).',
          'Damage: no glue stains, scuffs, dents or marks beyond trivial.',
          'Accessories: box, tags, dust bag, spare laces present as expected.',
        ],
      },
      { t: 'h2', text: 'Hard reject (do NOT green-light)' },
      {
        t: 'ul',
        items: [
          'Wrong or crooked logo / wrong font.',
          'Wrong colour or wrong shape/proportions.',
          'Structural damage or heavy staining.',
          'Wrong size or wrong variant entirely.',
        ],
      },
      { t: 'h2', text: 'Fine to accept (normal minor flaws)' },
      {
        t: 'ul',
        items: [
          'A stray loose thread (trimmable).',
          'A tiny glue speck that cleans up.',
          'A slightly imperfect tag alignment.',
          'Minor factory dust or a light crease.',
        ],
      },
      {
        t: 'callout',
        title: 'If unsure',
        text: 'Zoom to full res, compare side by side with retail photos, and post for a second opinion BEFORE you approve. Approval closes your free window.',
      },
    ],
  },
  {
    slug: 'agent-vetting-scorecard',
    title: 'Agent Vetting Scorecard',
    summary: 'Score any agent 0–2 on each row. Higher total = safer first choice.',
    blocks: [
      { t: 'h2', text: 'Score each row 0 (poor) / 1 (ok) / 2 (great)' },
      {
        t: 'table',
        headers: ['Criteria', 'What great looks like'],
        rows: [
          ['Shipping-line selection', 'Multiple economy + standard + express lines for your country'],
          ['QC photo quality', 'Clear, multi-angle, high-res photos of the actual item'],
          ['Transparent fees', 'Service fee and shipping markup are easy to find and understand'],
          ['English UI & support', 'Fully usable in English; responsive support'],
          ['Wallet / payment options', 'Smooth wallet + standard card/payment methods'],
          ['Storage window', 'Generous free storage (~60–90 days) for building a haul'],
          ['Reputation', 'Widely used and discussed positively by real buyers'],
          ['Coupons / promos', 'Regular shipping discounts that lower real cost'],
        ],
      },
      {
        t: 'callout',
        title: 'How to read your score',
        text: '12+ = safe first agent. 8–11 = fine, watch the weak areas. Under 8 = keep looking. Remember: the cheapest agent is the one with the best LANDED cost for YOUR cart, not the lowest headline fee. Compare carts in HaulHQ.',
      },
      { t: 'h2', text: 'Instant disqualifiers' },
      {
        t: 'ul',
        items: [
          'Asks you to pay a person directly / outside the platform.',
          'No QC photos before shipping.',
          'No traceable company presence or history.',
          'Pressure to buy a specific "private" seller only they can access.',
        ],
      },
    ],
  },
  {
    slug: 'sizing-reference',
    title: 'Sizing Conversion Reference',
    summary: 'Match measurements, not letters. Approximate conversions — always confirm with the listing chart.',
    blocks: [
      { t: 'h2', text: 'Golden rule' },
      { t: 'p', text: 'Buy to the listing\'s measurements (cm), not the size letter. When cm and label disagree, trust the cm. Assume factory tops run ~1 size small vs. Western until measurements prove otherwise.' },
      { t: 'h2', text: 'Men\'s shoes (approx — verify insole cm)' },
      {
        t: 'table',
        headers: ['Foot length', 'US', 'UK', 'EU'],
        rows: [
          ['25.0 cm', '7', '6', '40'],
          ['25.7 cm', '7.5', '6.5', '40.5'],
          ['26.0 cm', '8', '7', '41'],
          ['26.7 cm', '8.5', '7.5', '42'],
          ['27.3 cm', '9', '8', '42.5'],
          ['28.0 cm', '9.5', '8.5', '43'],
          ['28.6 cm', '10', '9', '44'],
          ['29.4 cm', '11', '10', '45'],
          ['30.0 cm', '12', '11', '46'],
        ],
      },
      { t: 'h2', text: 'Tops (approx body chest — check flat listing width ×2)' },
      {
        t: 'table',
        headers: ['Western size', 'Chest (cm)', 'Typical factory tag'],
        rows: [
          ['S', '86–91', 'M'],
          ['M', '96–101', 'L'],
          ['L', '106–111', 'XL'],
          ['XL', '116–121', 'XXL'],
          ['XXL', '126–131', '3XL'],
        ],
      },
      {
        t: 'callout',
        title: 'Measure once',
        text: 'Record: foot length (cm, larger foot), chest circumference, a well-fitting top\'s flat chest width + length, waist + inseam. Reuse forever. For oversized fits, size to the garment measurement you want, not your body.',
      },
    ],
  },
  {
    slug: 'customs-quick-card',
    title: 'Customs-by-Country Quick Card',
    summary: '2026 estimates for planning only — confirm current rules for your country before you ship.',
    blocks: [
      { t: 'h2', text: 'Import tax at a glance (2026 estimates)' },
      {
        t: 'table',
        headers: ['Country', 'VAT/GST', 'Threshold reality'],
        rows: [
          ['United States', 'No federal VAT', 'The $800 de-minimis for China ended in 2025 — expect duties/fees regardless of value'],
          ['United Kingdom', '~20% VAT', 'Import VAT on goods over ~£135; duty above that too'],
          ['EU (generic)', '~19–22% VAT', 'No VAT de-minimis — VAT from the first euro; €150 only exempts duty'],
          ['Germany', '19% VAT', 'VAT from first euro; duty exempt under €150'],
          ['France', '20% VAT', 'VAT from first euro; duty exempt under €150'],
          ['Canada', 'GST/HST + prov.', 'Very low courier de-minimis; brokerage fees common on express'],
          ['Australia', '10% GST', 'GST applies; duty threshold high (~AU$1000)'],
        ],
      },
      { t: 'h2', text: 'Lower-risk shipping habits' },
      {
        t: 'ul',
        items: [
          'Keep parcel value/quantity reasonable; huge single hauls = bigger tax + more attention.',
          'Use established lines known to work for your country right now.',
          'Discreet packaging (good agents do this by default).',
          'Consider splitting a haul under a threshold if the shipping math still works.',
        ],
      },
      {
        t: 'callout',
        title: 'On declared value',
        text: 'Under-declaring can lower tax but it is misdeclaration and the risk (fees, delays, seizure) is yours. Know your real thresholds, decide deliberately, and run the numbers in HaulHQ before you ship.',
      },
    ],
  },
];

// ---- helpers --------------------------------------------------------------

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function getCheatSheet(slug: string): CheatSheet | undefined {
  return CHEAT_SHEETS.find((c) => c.slug === slug);
}

export const FREE_CHAPTER_SLUGS = CHAPTERS.filter((c) => c.free).map((c) => c.slug);

export function isFreeChapter(slug: string): boolean {
  return FREE_CHAPTER_SLUGS.includes(slug);
}
