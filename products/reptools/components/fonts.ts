// Trader-terminal type system: Space Grotesk (display), Inter (text),
// JetBrains Mono (numeric tables). Loaded once at module scope and attached to
// <html> in layout.tsx as CSS variables.
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const fontVariableClasses = [inter.variable, spaceGrotesk.variable, jetbrains.variable].join(
  ' '
);
