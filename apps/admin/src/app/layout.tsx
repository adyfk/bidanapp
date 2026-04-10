import { getMasterBrandTheme } from '@marketplace/platform-config';
import { themeStyleVariables } from '@marketplace/ui/foundations';
import { appFontClassName } from '@marketplace/web/fonts';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BidanApp Admin',
    template: '%s | BidanApp Admin',
  },
  description: 'Admin surface for the new multi-app architecture.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = getMasterBrandTheme('admin');

  return (
    <html lang="id">
      <body className={appFontClassName} style={themeStyleVariables(brand.theme)}>
        {children}
      </body>
    </html>
  );
}
