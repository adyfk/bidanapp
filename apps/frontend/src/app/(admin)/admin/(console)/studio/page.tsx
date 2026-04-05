import { notFound } from 'next/navigation';
import { AdminDataStudioScreen } from '@/components/screens/admin/AdminModuleScreens';
import { PUBLIC_ENV } from '@/lib/env';

export default function AdminDataStudioPage() {
  if (!PUBLIC_ENV.adminStudioEnabled) {
    notFound();
  }

  return <AdminDataStudioScreen />;
}
