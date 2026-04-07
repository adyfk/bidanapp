import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import '../../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  // You could fetch white-label data here based on headers/domain
  // For now, we use the central APP_CONFIG

  return {
    title: {
      template: `%s | ${APP_CONFIG.appName}`,
      default: APP_CONFIG.appName,
    },
    description: APP_CONFIG.seoDescription,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: APP_CONFIG.appName,
    },
    metadataBase: new URL(APP_CONFIG.baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        id: '/id',
        en: '/en',
      },
    },
    openGraph: {
      title: APP_CONFIG.appName,
      description: APP_CONFIG.seoDescription,
      url: APP_CONFIG.baseUrl,
      siteName: APP_CONFIG.appName,
      images: [
        {
          url: APP_CONFIG.ogImage,
          width: 512,
          height: 512,
          alt: APP_CONFIG.appName,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: APP_CONFIG.appName,
      description: APP_CONFIG.seoDescription,
      images: [APP_CONFIG.ogImage],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'en' | 'id')) {
    notFound();
  }

  setRequestLocale(locale as (typeof routing.locales)[number]);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-slate-50 text-slate-950">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
