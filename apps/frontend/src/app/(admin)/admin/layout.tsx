import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { APP_CONFIG } from '@/lib/config';
import { PUBLIC_ENV } from '@/lib/env';
import '../../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.baseUrl),
  title: {
    default: `Admin | ${APP_CONFIG.appName}`,
    template: `%s | ${APP_CONFIG.appName}`,
  },
  description: APP_CONFIG.seoDescription,
  robots: {
    follow: false,
    index: false,
  },
};

export const viewport: Viewport = {
  themeColor: APP_CONFIG.colors.primary,
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!PUBLIC_ENV.adminConsoleEnabled) {
    notFound();
  }

  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
