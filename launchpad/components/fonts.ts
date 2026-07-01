// Display + text font pairings loaded once at module scope (next/font/google).
// All CSS variables are attached to <html> in layout.tsx; a page then selects a
// pairing via brand.fontKey which sets --font-display / --font-text.
import { Inter, Fraunces, Space_Grotesk, Manrope } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', variable: '--font-fraunces' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' });
const manrope = Manrope({ subsets: ['latin'], display: 'swap', variable: '--font-manrope' });

/** Space-joined className exposing every raw font var on the element it is set on. */
export const fontVariableClasses = [
  inter.variable,
  fraunces.variable,
  spaceGrotesk.variable,
  manrope.variable,
].join(' ');

const FALLBACK = ', -apple-system, system-ui, "Segoe UI", Roboto, sans-serif';

type Pair = { display: string; text: string };

const DEFAULT: Pair = { display: 'var(--font-space-grotesk)', text: 'var(--font-inter)' };

const PAIRINGS: Record<string, Pair> = {
  geometric: { display: 'var(--font-space-grotesk)', text: 'var(--font-inter)' },
  editorial: { display: 'var(--font-fraunces)', text: 'var(--font-inter)' },
  classic: { display: 'var(--font-fraunces)', text: 'var(--font-inter)' },
  serif: { display: 'var(--font-fraunces)', text: 'var(--font-inter)' },
  modern: { display: 'var(--font-manrope)', text: 'var(--font-manrope)' },
  clean: { display: 'var(--font-inter)', text: 'var(--font-inter)' },
  grotesk: { display: 'var(--font-space-grotesk)', text: 'var(--font-space-grotesk)' },
};

/** Resolve a fontKey to full font-family stacks (with system fallbacks). */
export function fontVars(key?: string): Pair {
  const p = (key && PAIRINGS[key]) || DEFAULT;
  return { display: p.display + FALLBACK, text: p.text + FALLBACK };
}
