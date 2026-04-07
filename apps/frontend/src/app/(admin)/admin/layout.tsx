import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import { APP_CONFIG } from '@/lib/config';
import { PUBLIC_ENV } from '@/lib/env';
import '../../globals.css';

const adminSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const adminMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-admin-mono',
  weight: ['400', '500', '600'],
});

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
      <body className={`${adminSans.className} ${adminMono.variable} bg-[#edf3f9] text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
