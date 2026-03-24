'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminConsoleShell } from '@/components/screens/admin/AdminConsoleShell';
import { useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { ADMIN_ROUTES } from '@/features/admin/lib/routes';

export default function AdminConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasHydrated, isAuthenticated, setLastVisitedRoute } = useAdminSession();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace(ADMIN_ROUTES.login);
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && pathname) {
      setLastVisitedRoute(pathname as Route);
    }
  }, [hasHydrated, isAuthenticated, pathname, setLastVisitedRoute]);

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  return <AdminConsoleShell>{children}</AdminConsoleShell>;
}
