'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ADMIN_ROUTES } from '@/features/admin/lib/routes';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ADMIN_ROUTES.overview);
  }, [router]);

  return null;
}
