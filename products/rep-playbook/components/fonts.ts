// Editorial handbook type system: Fraunces (display serif, book-cover feel) for
// titles + Inter (text) for readable body copy. Loaded once at module scope and
// attached to <html> in layout.tsx as CSS variables.
import { Inter, Fraunces } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const fontVariableClasses = [inter.variable, fraunces.variable].join(' ');
