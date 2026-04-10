import { Figtree, Noto_Sans } from 'next/font/google';

const displayFont = Figtree({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const bodyFont = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const appFontClassName = `${displayFont.variable} ${bodyFont.variable}`;
