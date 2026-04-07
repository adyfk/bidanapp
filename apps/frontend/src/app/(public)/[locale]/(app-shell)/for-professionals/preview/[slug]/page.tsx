import type { Metadata } from 'next';
import { ProfessionalDetailScreen } from '@/components/screens/ProfessionalDetailScreen';
import { getPublicBootstrapData } from '@/lib/public-bootstrap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Professional Preview',
};

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProfessionalPreviewPage(props: Props) {
  const { slug } = await props.params;
  const bootstrap = await getPublicBootstrapData();
  const initialProfessional =
    bootstrap.catalog.professionals.find((candidateProfessional) => candidateProfessional.slug === slug) || null;

  return (
    <ProfessionalDetailScreen
      areas={bootstrap.catalog.areas}
      categories={bootstrap.catalog.categories}
      initialProfessional={initialProfessional}
      professionalSlug={slug}
      services={bootstrap.catalog.services}
    />
  );
}
