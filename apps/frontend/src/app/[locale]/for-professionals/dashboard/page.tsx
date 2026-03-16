import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { PROFESSIONAL_DASHBOARD_DEFAULT_TAB } from '@/lib/routes';

export default async function ProfessionalDashboardPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  redirect(`/${params.locale}/for-professionals/dashboard/${PROFESSIONAL_DASHBOARD_DEFAULT_TAB}` as Route);
}
