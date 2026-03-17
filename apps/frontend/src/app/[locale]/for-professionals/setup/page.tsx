import type { Route } from 'next';
import { redirect } from 'next/navigation';

export default async function ProfessionalProfileRedirectPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  redirect(`/${params.locale}/for-professionals/dashboard` as Route);
}
