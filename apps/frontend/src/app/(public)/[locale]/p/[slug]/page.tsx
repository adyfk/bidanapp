import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfessionalDetailScreen } from '@/components/screens/ProfessionalDetailScreen';
import { getProfessionalCategoryLabel } from '@/lib/catalog-selectors';
import { APP_CONFIG } from '@/lib/config';
import { getPublicBootstrapData } from '@/lib/public-bootstrap';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const bootstrap = await getPublicBootstrapData();
  const professional = bootstrap.catalog.professionals.find(
    (candidateProfessional) => candidateProfessional.slug === params.slug,
  );

  if (!professional) {
    return {
      title: `Professional Not Found | ${APP_CONFIG.appName}`,
    };
  }

  const profCategory =
    getProfessionalCategoryLabel({
      categories: bootstrap.catalog.categories,
      professional,
      services: bootstrap.catalog.services,
    }) || 'Professional';

  return {
    title: `${professional.name} - ${profCategory} | ${APP_CONFIG.appName}`,
    description: professional.about,
    openGraph: {
      title: `${professional.name} | ${APP_CONFIG.appName}`,
      description: professional.about,
      images: [professional.coverImage || professional.image || APP_CONFIG.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${professional.name} | ${APP_CONFIG.appName}`,
      description: professional.about,
      images: [professional.coverImage || professional.image || APP_CONFIG.ogImage],
    },
  };
}

export default async function ProfessionalDetailRoute(props: Props) {
  const params = await props.params;
  const bootstrap = await getPublicBootstrapData();
  const professional = bootstrap.catalog.professionals.find(
    (candidateProfessional) => candidateProfessional.slug === params.slug,
  );

  if (!professional) {
    notFound();
  }

  return (
    <ProfessionalDetailScreen
      areas={bootstrap.catalog.areas}
      categories={bootstrap.catalog.categories}
      initialProfessional={professional}
      professionalSlug={params.slug}
      services={bootstrap.catalog.services}
    />
  );
}
