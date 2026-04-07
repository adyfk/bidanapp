import { Plus_Jakarta_Sans } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';

const marketplaceSans = Plus_Jakarta_Sans({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-marketplace-sans',
});

const marketplaceThemeStyle = {
  '--marketplace-bg': '#f3f8fc',
  '--marketplace-surface': '#ffffff',
  '--marketplace-surface-muted': '#f5f9fc',
  '--marketplace-line': '#d8e7f3',
  '--marketplace-primary': '#0369a1',
  '--marketplace-primary-soft': '#e0f2fe',
  '--marketplace-ink': '#0f172a',
  '--marketplace-ink-muted': '#475569',
  '--marketplace-success': '#047857',
} as CSSProperties;

export default function MarketplaceShellLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div
      className={`${marketplaceSans.variable} min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.5)_0%,transparent_26%),radial-gradient(circle_at_top_right,rgba(167,243,208,0.3)_0%,transparent_22%),linear-gradient(180deg,#f4f9fc_0%,#fbfdff_38%,#f6f8fb_100%)] font-[family:var(--font-marketplace-sans)] text-[color:var(--marketplace-ink)]`}
      style={marketplaceThemeStyle}
    >
      {children}
    </div>
  );
}
