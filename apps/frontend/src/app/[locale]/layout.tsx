import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { routing } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import './globals.css';

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
    themeColor: APP_CONFIG.colors.primary,
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

export default async function RootLayout({
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

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-100 flex justify-center font-sans">
        <NextIntlClientProvider messages={messages}>
          {/* Global Mobile App Container */}
          <div className="w-full max-w-md min-h-[100dvh] bg-white shadow-xl overflow-hidden relative flex flex-col">
            <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
            {/* Navigasi Bawah Otomatis by Pathname */}
            <BottomNavBar />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
