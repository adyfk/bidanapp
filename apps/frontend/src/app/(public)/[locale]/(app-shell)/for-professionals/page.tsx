import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import type { ProfessionalAccessTab } from '@/lib/routes';

export default async function ProfessionalAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: ProfessionalAccessTab }>;
}) {
  const { tab } = await searchParams;

  return <ProfessionalAccessScreen defaultTab={tab === 'register' ? 'register' : 'login'} />;
}
