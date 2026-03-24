import { notFound } from 'next/navigation';
import { PUBLIC_ENV } from '@/lib/env';

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!PUBLIC_ENV.adminConsoleEnabled) {
    notFound();
  }

  return children;
}
