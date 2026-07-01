// Shared frontend contracts. Mirrors the D2 landing_pages / tool_specs shape.
// NOTE: the spec named this lib/types.ts, but lib/ is owned by another package,
// so the frontend-owned copy lives under components/ and is imported everywhere
// the frontend needs the Brand contract.

export type TemplateVariant = 'centered' | 'split' | 'left-rail';

/** The D2 brand contract stored on landing_pages.brand / tool_specs.brand (jsonb). */
export type Brand = {
  accent?: string; // primary action color
  accentInk?: string; // text/icon color on top of accent
  bg?: string; // page background
  surface?: string; // card / band background
  ink?: string; // primary text
  muted?: string; // secondary text
  border?: string; // hairline color
  radius?: string | number; // corner radius (number => px)
  fontKey?: string; // selects a display+text pairing (see components/fonts.ts)
  logo?: string; // optional logo URL
  monogram?: string; // optional explicit monogram override
};

export type Faq = { q: string; a: string };

/** Row shape consumed by app/l/[id]/page.tsx (superset; all optional beyond id). */
export type LandingPage = {
  id: string;
  headline: string;
  subhead?: string;
  eyebrow?: string;
  cta_label?: string;
  bullets?: string[];
  faq?: Faq[];
  brand?: Brand;
  template?: TemplateVariant;
  live?: boolean;
  promoted?: boolean;
  deposit_cents?: number;
  deposit_currency?: string; // ISO 4217, default EUR
  live_signup_count?: number;
  signup_count?: number;
  proof_threshold?: number;
  proof_note?: string;
  urgency?: string;
  trust_line?: string;
  share_incentive?: string;
};

// ---- Tool spec contract (db 0004 tool_specs) ----

export type ToolInputType = 'number' | 'range' | 'select' | 'boolean';

export type ToolInput = {
  key: string;
  label: string;
  type?: ToolInputType;
  default?: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  help?: string;
  options?: { label: string; value: number | string }[];
};

export type ToolOutputFormat = 'number' | 'integer' | 'currency' | 'percent';

export type ToolOutput = {
  key: string;
  label: string;
  /** Arithmetic expression over input keys and prior output keys. */
  expr: string;
  unit?: string;
  format?: ToolOutputFormat;
  currency?: string;
  precision?: number;
  help?: string;
};

export type ToolExample = {
  label?: string;
  inputs: Record<string, number | string | boolean>;
};

export type ToolSpec = {
  id: string;
  title: string;
  description?: string;
  intro?: string;
  unitsNote?: string;
  inputs: ToolInput[];
  outputs: ToolOutput[];
  examples?: ToolExample[];
  brand?: Brand;
  live?: boolean;
  promoted?: boolean;
};
