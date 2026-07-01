// Central manifest for every converter in the suite.
// Each entry drives: the route /convert/[slug], SEO metadata,
// HowTo + FAQ JSON-LD, internal links, and the sitemap.

export type FaqItem = { q: string; a: string };

export type Tool = {
  slug: string;
  name: string;
  // Short label used in nav / cards.
  short: string;
  // The converter component key (maps to components/Converters).
  component:
    | 'image'
    | 'units'
    | 'csv-json'
    | 'timestamp'
    | 'color'
    | 'base64'
    | 'case';
  // SEO
  title: string;
  description: string;
  keywords: string[];
  // Card copy
  tagline: string;
  emoji: string;
  // On-page long intro (rendered above the tool)
  intro: string;
  // HowTo steps for structured data + the on-page "How to use" list.
  howTo: string[];
  faqs: FaqItem[];
  // Whether the Pro batch mode applies to this tool.
  hasBatch: boolean;
};

export const TOOLS: Tool[] = [
  {
    slug: 'image-converter',
    name: 'Image Converter (PNG · JPG · WEBP)',
    short: 'Image Converter',
    component: 'image',
    title: 'Image Converter — Convert PNG, JPG & WEBP in Your Browser | QuickConvert',
    description:
      'Convert images between PNG, JPG and WEBP instantly. 100% private — files never leave your browser, no upload, no sign-up. Drag, drop, download.',
    keywords: [
      'convert png to jpg',
      'convert jpg to webp',
      'webp to png',
      'image format converter',
      'png to webp online',
    ],
    tagline: 'PNG, JPG and WEBP conversion that never uploads your files.',
    emoji: '🖼️',
    intro:
      'Change an image from one format to another without uploading it anywhere. The conversion runs entirely on your device using the browser Canvas API, so your photos stay private and there are no file-size caps imposed by a server.',
    howTo: [
      'Drag an image onto the drop zone, or click to pick a file.',
      'Choose the output format: PNG, JPG or WEBP.',
      'Adjust quality if you selected a lossy format (JPG/WEBP).',
      'Click Convert, then Download the result — nothing was uploaded.',
    ],
    faqs: [
      {
        q: 'Are my images uploaded to a server?',
        a: 'No. Every conversion happens locally in your browser using the Canvas API. Your files never leave your device, which is why this works offline once the page has loaded.',
      },
      {
        q: 'Does converting PNG to JPG lose quality?',
        a: 'JPG is a lossy format, so a small amount of detail is discarded — but you control the quality slider. PNG and WEBP can preserve transparency; JPG cannot, so transparent areas become white.',
      },
      {
        q: 'What is the maximum file size?',
        a: 'Because there is no server, the only limit is your device memory. Most phones and laptops handle images up to tens of megapixels comfortably. Pro raises internal safety limits and unlocks batch conversion.',
      },
    ],
    hasBatch: true,
  },
  {
    slug: 'unit-converter',
    name: 'Unit & Measurement Converter',
    short: 'Unit Converter',
    component: 'units',
    title: 'Unit Converter — Length, Weight, Temperature & More | QuickConvert',
    description:
      'Fast, accurate unit converter for length, weight, temperature, volume and data size. Runs in your browser — no ads-first walls, no sign-up.',
    keywords: [
      'unit converter',
      'cm to inches',
      'kg to lbs',
      'celsius to fahrenheit',
      'measurement converter',
    ],
    tagline: 'Length, weight, temperature, volume and data size in one place.',
    emoji: '📏',
    intro:
      'Convert between common units of measurement with exact, well-defined conversion factors. Pick a category, type a value, and every equivalent updates instantly. All math happens client-side, so it is fast and works offline.',
    howTo: [
      'Choose a category: length, weight, temperature, volume or data.',
      'Type a value into any field.',
      'Read the converted values in every other unit instantly.',
      'Click a result to copy it to your clipboard.',
    ],
    faqs: [
      {
        q: 'Which conversion factors do you use?',
        a: 'We use the internationally defined exact factors — for example 1 inch = 25.4 mm and 1 pound = 0.45359237 kg — so results match official standards rather than rounded approximations.',
      },
      {
        q: 'Can I convert temperature?',
        a: 'Yes. The temperature category converts between Celsius, Fahrenheit and Kelvin using the correct offset formulas, not a naive multiplication.',
      },
    ],
    hasBatch: false,
  },
  {
    slug: 'csv-to-json',
    name: 'CSV to JSON Converter',
    short: 'CSV → JSON',
    component: 'csv-json',
    title: 'CSV to JSON Converter — Instant & Private | QuickConvert',
    description:
      'Paste or drop a CSV file and get clean JSON instantly. Handles quoted fields, custom delimiters and headers. Runs in your browser — nothing is uploaded.',
    keywords: [
      'csv to json',
      'convert csv to json online',
      'csv parser',
      'csv to json array',
      'spreadsheet to json',
    ],
    tagline: 'Turn spreadsheets into clean JSON without uploading sensitive data.',
    emoji: '🧾',
    intro:
      'Convert CSV data into a JSON array of objects. The parser understands quoted values, escaped quotes and configurable delimiters, and you can choose whether the first row is a header. Because it runs locally, you can safely convert customer or internal data.',
    howTo: [
      'Paste CSV text, or drop a .csv file onto the input.',
      'Set the delimiter (comma, semicolon or tab) and whether row 1 is a header.',
      'The JSON output updates live as you type.',
      'Copy the JSON or download it as a .json file.',
    ],
    faqs: [
      {
        q: 'Does it handle commas inside quoted fields?',
        a: 'Yes. The parser is RFC 4180-aware: it respects double-quoted fields, escaped quotes ("") and newlines inside quotes, so values like "Smith, John" stay intact.',
      },
      {
        q: 'Is my data sent anywhere?',
        a: 'No. Parsing happens entirely in your browser, which makes this safe for confidential spreadsheets that you would never paste into a random online tool.',
      },
    ],
    hasBatch: false,
  },
  {
    slug: 'timestamp-converter',
    name: 'Unix Timestamp / Epoch Converter',
    short: 'Timestamp',
    component: 'timestamp',
    title: 'Unix Timestamp Converter — Epoch to Date & Back | QuickConvert',
    description:
      'Convert Unix epoch timestamps to human dates and back, in seconds or milliseconds, across time zones. Live, private, and free.',
    keywords: [
      'unix timestamp converter',
      'epoch converter',
      'timestamp to date',
      'epoch to date',
      'milliseconds to date',
    ],
    tagline: 'Epoch seconds or milliseconds to a readable date, and back.',
    emoji: '⏱️',
    intro:
      'Translate between Unix epoch timestamps and human-readable dates. It supports both seconds and milliseconds, shows the result in your local time and in UTC, and includes a live clock so you can grab the current timestamp with one click.',
    howTo: [
      'Enter a Unix timestamp to see the matching date in UTC and local time.',
      'Or pick a date and time to get the epoch value.',
      'Toggle between seconds and milliseconds precision.',
      'Click any value to copy it.',
    ],
    faqs: [
      {
        q: 'Seconds or milliseconds — how do I know which I have?',
        a: 'A 10-digit number is almost always seconds; a 13-digit number is milliseconds. The tool auto-detects the likely unit and lets you override it with a toggle.',
      },
      {
        q: 'What time zone is used?',
        a: 'Timestamps are absolute points in time. We display each one in both UTC and your browser’s local time zone so there is no ambiguity.',
      },
    ],
    hasBatch: false,
  },
  {
    slug: 'color-converter',
    name: 'Color Converter (HEX · RGB · HSL)',
    short: 'Color',
    component: 'color',
    title: 'Color Converter — HEX, RGB & HSL | QuickConvert',
    description:
      'Convert colors between HEX, RGB and HSL with a live preview. Copy CSS-ready values instantly. Runs in your browser, no sign-up.',
    keywords: [
      'hex to rgb',
      'rgb to hex',
      'hsl converter',
      'color converter',
      'hex to hsl',
    ],
    tagline: 'HEX, RGB and HSL with a live swatch and copy-ready CSS.',
    emoji: '🎨',
    intro:
      'Convert a color between HEX, RGB and HSL notations and see a live preview swatch. Edit any format and the others update in sync, with values formatted exactly as you would paste them into CSS.',
    howTo: [
      'Type a color in any field: HEX (#3b82f6), RGB or HSL.',
      'Or use the color picker to choose visually.',
      'All three notations and the preview update together.',
      'Click a value to copy the CSS-ready string.',
    ],
    faqs: [
      {
        q: 'Do you support shorthand and alpha?',
        a: 'Yes. Three-digit HEX like #39f is expanded automatically, and you can read RGB/HSL values that map to standard CSS color syntax.',
      },
      {
        q: 'Are the conversions accurate?',
        a: 'Conversions use the standard RGB↔HSL algorithms, so round-tripping a color returns the same value apart from expected rounding on the last digit.',
      },
    ],
    hasBatch: false,
  },
  {
    slug: 'base64-converter',
    name: 'Base64 Encode / Decode',
    short: 'Base64',
    component: 'base64',
    title: 'Base64 Encoder & Decoder — Text & Files | QuickConvert',
    description:
      'Encode text to Base64 or decode Base64 back to text, with full Unicode support. Also encode files to data URLs. Private, in-browser, free.',
    keywords: [
      'base64 encode',
      'base64 decode',
      'base64 converter',
      'text to base64',
      'base64 to text',
    ],
    tagline: 'Encode and decode Base64 — Unicode-safe, files included.',
    emoji: '🔐',
    intro:
      'Encode text to Base64 or decode it back, with correct handling of Unicode characters (emoji and accented letters included). You can also encode a file to a Base64 data URL for embedding. Everything runs locally so secrets never touch a server.',
    howTo: [
      'Choose Encode or Decode.',
      'Type or paste your text, or drop a file to get a data URL.',
      'The result updates live.',
      'Copy the output with one click.',
    ],
    faqs: [
      {
        q: 'Does it handle emoji and accents?',
        a: 'Yes. We encode via UTF-8 first, so multi-byte characters like é or 😀 round-trip correctly, unlike naive btoa() usage which throws on them.',
      },
      {
        q: 'Can I encode an image or PDF?',
        a: 'Yes. Drop a file and you get a complete data: URL you can paste directly into HTML or CSS. Large files are handled in the browser subject to your device memory.',
      },
    ],
    hasBatch: false,
  },
  {
    slug: 'case-converter',
    name: 'Text Case Converter',
    short: 'Text Case',
    component: 'case',
    title: 'Text Case Converter — Upper, Lower, Title, camelCase & More | QuickConvert',
    description:
      'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case and more. Live character count included.',
    keywords: [
      'text case converter',
      'uppercase to lowercase',
      'title case converter',
      'camelcase converter',
      'snake case converter',
    ],
    tagline: 'UPPER, lower, Title, camelCase, snake_case, kebab-case and more.',
    emoji: '🔤',
    intro:
      'Retype nothing. Paste text and instantly get it in any case style — upper, lower, sentence, title, camelCase, PascalCase, snake_case, kebab-case or CONSTANT_CASE — with a live word and character count.',
    howTo: [
      'Paste or type your text into the box.',
      'Pick the case style you want.',
      'The converted text appears instantly with word/character counts.',
      'Copy the result to your clipboard.',
    ],
    faqs: [
      {
        q: 'What is the difference between Title Case and Sentence case?',
        a: 'Title Case capitalises the first letter of every significant word; Sentence case capitalises only the first letter of each sentence. Both are supported.',
      },
      {
        q: 'Does camelCase handle spaces and punctuation?',
        a: 'Yes. Words are split on spaces, hyphens and underscores, then recombined into the chosen programmer-friendly style.',
      },
    ],
    hasBatch: false,
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

// Simple "related tools" — everything except the current one, capped.
export function relatedTools(slug: string, limit = 4): Tool[] {
  return TOOLS.filter((t) => t.slug !== slug).slice(0, limit);
}

export const SITE = {
  name: 'QuickConvert',
  tagline: 'Fast, private, in-browser converters.',
  accent: '#4f46e5',
  accentDark: '#4338ca',
};

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://quickconvert.tools'
  );
}
