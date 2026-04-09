import { Inter } from 'next/font/google';

const displayFont = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const appFontClassName = `${displayFont.variable} ${bodyFont.variable}`;
