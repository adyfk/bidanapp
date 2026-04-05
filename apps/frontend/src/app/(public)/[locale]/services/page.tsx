import { ServicesScreen } from '@/components/screens/ServicesScreen';
import { getPublicBootstrapData } from '@/lib/public-bootstrap';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Explore Services - BidanCare',
  description: 'Browse all available services provided by our independent professionals.',
};

export default async function ServicesPage() {
  const bootstrap = await getPublicBootstrapData();

  return (
    <ServicesScreen
      categories={bootstrap.catalog.categories}
      professionals={bootstrap.catalog.professionals}
      services={bootstrap.catalog.services}
    />
  );
}
