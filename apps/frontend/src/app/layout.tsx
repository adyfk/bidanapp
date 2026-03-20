import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { APP_CONFIG } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.baseUrl),
  title: {
    default: APP_CONFIG.appName,
    template: `%s | ${APP_CONFIG.appName}`,
  },
  description: APP_CONFIG.seoDescription,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_CONFIG.appName,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.appName,
    description: APP_CONFIG.seoDescription,
    images: [APP_CONFIG.ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: APP_CONFIG.colors.primary,
};

const resolveDocumentLanguage = async () => {
  const requestHeaders = await headers();
  const locale = requestHeaders.get('X-NEXT-INTL-LOCALE');

  return locale === 'en' || locale === 'id' ? locale : 'id';
};

export default async function AppRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const documentLanguage = await resolveDocumentLanguage();

  return (
    <html lang={documentLanguage}>
      <body>{children}</body>
    </html>
  );
}
