import { CustomerAccessScreen } from '@/components/screens/CustomerAccessScreen';
import type { CustomerAccessIntent } from '@/lib/routes';

export default async function CustomerAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: CustomerAccessIntent; next?: string }>;
}) {
  const { intent, next } = await searchParams;

  return <CustomerAccessScreen intent={intent} nextHref={next} />;
}
