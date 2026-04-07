import type { Metadata } from 'next';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { getPublicBootstrapData } from '@/lib/public-bootstrap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home - BidanApp',
  description: 'Find your doctor and make an appointment.',
};

export default async function HomeRoute() {
  const bootstrap = await getPublicBootstrapData();

  return (
    <HomeScreen
      areas={bootstrap.catalog.areas}
      categories={bootstrap.catalog.categories}
      homeFeed={bootstrap.activeHomeFeed}
      sectionConfig={bootstrap.appSectionConfig}
      services={bootstrap.catalog.services}
    />
  );
}
