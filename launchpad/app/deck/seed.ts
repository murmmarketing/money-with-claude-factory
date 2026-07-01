import type { CatDef, StageDef, Venture } from "./types";

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const CATS: CatDef[] = [
  { k: "product", label: "Digital Products" },
  { k: "media", label: "Faceless Content" },
  { k: "build", label: "Micro-Software" },
  { k: "market", label: "Print & Marketplace" },
  { k: "seo", label: "Programmatic & SEO" },
  { k: "visual", label: "AI Visual Studio" },
  { k: "auto", label: "Automation Products" },
  { k: "audience", label: "Audience & Licensing" },
  { k: "data", label: "Data & Info" },
  { k: "learn", label: "Self-Serve Learning" },
];

export const STAGES: StageDef[] = [
  { k: "idea", label: "Idea", sub: "backlog", color: "#7aa2ff" },
  { k: "build", label: "Building", sub: "on the line", color: "#ffcf4a" },
  { k: "launch", label: "Launched", sub: "shipped", color: "#46e6d4" },
  { k: "scale", label: "Scaling", sub: "growing", color: "#c8f14a" },
];

export const CHANNELS = [
  "Pinterest SEO", "Marketplace search", "Programmatic SEO", "Blog/SEO",
  "Reddit & forums", "Product Hunt & directories", "Faceless short-form",
  "Faceless YouTube", "Email/Newsletter", "App/Extension store",
  "Affiliate/Directory", "Direct / other",
];

// Anchor "now" to the design's reference date so demo data lands identically.
const BASE_YEAR = 2026;
const BASE_MONTH = 6; // July (0-indexed)

export function monthsBack(n: number) {
  const out: { key: string; short: string; full: string }[] = [];
  const base = new Date(BASE_YEAR, BASE_MONTH, 1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({
      key: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
      short: MONTHS[d.getMonth()],
      full: MONTHS[d.getMonth()] + " " + d.getFullYear(),
    });
  }
  return out;
}

export function monthKey(off: number) {
  const base = new Date(BASE_YEAR, BASE_MONTH, 1);
  const d = new Date(base.getFullYear(), base.getMonth() + off, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export function monthShort(key: string) {
  const p = String(key).split("-");
  return MONTHS[Number(p[1]) - 1] || key;
}

export function seedDemo(): Venture[] {
  const M = monthsBack(10).map((m) => m.key);
  const build = (revs: number[], viss: number[], unis: number[]) =>
    revs.map((r, i) => ({
      m: M[10 - revs.length + i],
      rev: r,
      vis: viss[i],
      units: unis[i],
    }));
  return [
    {
      id: "d1", name: "Second Brain OS", ideaN: 1, cat: "product",
      channel: "Pinterest SEO", model: "sub", stage: "scale", goal: 6000,
      created: Date.parse("2025-10-01"), demo: true,
      traffic: [{ src: "Pinterest", pct: 64 }, { src: "Google", pct: 21 }, { src: "Direct", pct: 15 }],
      tasks: [
        { t: "Ship 25 new pins this week", done: false },
        { t: 'Add a "students" niche variant', done: true },
        { t: "A/B test $12 → $15 tier", done: false },
      ],
      history: build(
        [180, 420, 690, 1020, 1480, 2050, 2680, 3220, 3760, 4240],
        [900, 1600, 2400, 3100, 3900, 4700, 5500, 6200, 6900, 7600],
        [9, 21, 34, 51, 74, 102, 134, 161, 188, 212],
      ),
      events: [
        { ts: M[9], text: "Crossed $4K MRR — best month yet." },
        { ts: M[7], text: 'Launched the "founders" niche variant.' },
        { ts: M[4], text: "Pinterest board hit 1M monthly views." },
      ],
    },
    {
      id: "d2", name: "Plumber Canva Pack Shop", ideaN: 2, cat: "product",
      channel: "Marketplace search", model: "oneoff", stage: "launch", goal: 2500,
      created: Date.parse("2026-01-01"), demo: true,
      traffic: [{ src: "Etsy search", pct: 72 }, { src: "Google", pct: 16 }, { src: "Direct", pct: 12 }],
      tasks: [
        { t: "Add 3 new trades (roofer, HVAC, electrician)", done: false },
        { t: "Refresh listing keywords", done: true },
      ],
      history: build(
        [120, 340, 520, 780, 910, 1080, 1240, 1390],
        [300, 620, 880, 1150, 1330, 1520, 1710, 1880],
        [4, 11, 17, 26, 31, 37, 43, 48],
      ),
      events: [
        { ts: M[9], text: "Best-seller badge on the dentist pack." },
        { ts: M[6], text: "Added the realtor + landscaper trades." },
      ],
    },
    {
      id: "d3", name: "Faceless Finance Shorts", ideaN: null, cat: "media",
      channel: "Faceless short-form", model: "oneoff", stage: "launch", goal: 2000,
      created: Date.parse("2025-12-01"), demo: true,
      traffic: [{ src: "TikTok", pct: 49 }, { src: "YouTube", pct: 33 }, { src: "Instagram", pct: 18 }],
      tasks: [
        { t: "Batch 20 scripts with Claude", done: true },
        { t: "Add affiliate links to top 5 videos", done: false },
        { t: "Repurpose to a weekly newsletter", done: false },
      ],
      history: build(
        [20, 60, 140, 210, 300, 380, 470, 560, 680],
        [4200, 9800, 18000, 26000, 35000, 42000, 51000, 60000, 72000],
        [3, 8, 15, 22, 29, 35, 42, 49, 58],
      ),
      events: [
        { ts: M[9], text: "A short crossed 1.2M views." },
        { ts: M[8], text: "Joined an affiliate program for the linked tool." },
      ],
    },
    {
      id: "d4", name: "AI for Realtors Cookbook", ideaN: 11, cat: "product",
      channel: "Blog/SEO", model: "oneoff", stage: "build", goal: 1000,
      created: Date.parse("2026-05-01"), demo: true,
      traffic: [{ src: "Google", pct: 58 }, { src: "Direct", pct: 24 }, { src: "Referral", pct: 18 }],
      tasks: [
        { t: 'Publish 10 programmatic "AI for [task]" pages', done: false },
        { t: "Finish the PDF layout in Claude Design", done: false },
        { t: "Set up the Gumroad listing", done: false },
      ],
      history: build([0, 60, 180], [0, 140, 430], [0, 2, 6]),
      events: [
        { ts: M[9], text: "First 6 sales from a single ranking page." },
        { ts: M[8], text: "Draft cookbook finished with Claude." },
      ],
    },
  ];
}

export function seedInitial(): Venture[] {
  return [
    {
      id: "haulhq",
      name: "HaulHQ",
      ideaN: null,
      cat: "build", // Micro-Software
      channel: "Email/Newsletter", // MurmReps newsletter distribution
      model: "sub", // $6/mo Pro
      stage: "launch", // deployed & live
      goal: 2000,
      created: Date.parse("2026-07-01"),
      demo: false,
      traffic: [],
      tasks: [
        { t: "Connect Stripe ($6/mo + $48/yr price IDs + webhook)", done: false },
        { t: "Connect Resend (verify domain) for Pro login emails", done: false },
        { t: "Seed HaulHQ to the MurmReps newsletter", done: false },
        { t: "Point a real domain + fill legal placeholders", done: false },
      ],
      history: [], // zero revenue logged yet
      events: [
        { ts: monthKey(0), text: "Launched — free Haul Builder live at haulhq.vercel.app" },
      ],
    },
    {
      id: "rep-playbook",
      name: "The Rep Playbook",
      ideaN: null,
      cat: "product", // Digital Products
      channel: "Blog/SEO",
      model: "oneoff", // $19 one-time
      stage: "launch", // deployed & live (waitlist mode until Stripe connected)
      goal: 1000,
      created: Date.parse("2026-07-01"),
      demo: false,
      traffic: [],
      tasks: [
        { t: "Connect Stripe (create $19 one-time price + webhook)", done: false },
        { t: "Connect Resend (magic-link delivery for downloads)", done: false },
        { t: "Cross-sell from HaulHQ + the MurmReps newsletter", done: false },
        { t: "Point a domain + fill legal placeholders", done: false },
      ],
      history: [], // zero revenue logged yet
      events: [
        { ts: monthKey(0), text: "Launched — live at rep-playbook-claude-5fc19916.vercel.app" },
      ],
    },
  ];
}
