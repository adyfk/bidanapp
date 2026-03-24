import { ExploreScreen } from '@/components/screens/ExploreScreen';
import { getPublicBootstrapData } from '@/lib/public-bootstrap';

export const metadata = {
  title: 'Explore Professionals - BidanCare',
  description: 'Find and filter independent professionals near you.',
};

export default async function ExplorePage() {
  const bootstrap = await getPublicBootstrapData();

  return (
    <ExploreScreen
      areas={bootstrap.catalog.areas}
      categories={bootstrap.catalog.categories}
      professionals={bootstrap.catalog.professionals}
      services={bootstrap.catalog.services}
      userContext={bootstrap.currentUserContext}
    />
  );
}
