import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ServiceDetailScreen } from '@/components/screens/ServiceDetailScreen';
import { APP_CONFIG } from '@/lib/config';
import { getPublicBootstrapData } from '@/lib/public-bootstrap';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const bootstrap = await getPublicBootstrapData();

  return bootstrap.catalog.services.map((service) => ({
    slug: service.slug,
  }));
}

// Generate dynamic metadata for SEO
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const bootstrap = await getPublicBootstrapData();
  const service = bootstrap.catalog.services.find((candidateService) => candidateService.slug === params.slug);

  if (!service) {
    return {
      title: `Service Not Found | ${APP_CONFIG.appName}`,
    };
  }

  return {
    title: `${service.name} Services - Find Top Providers | ${APP_CONFIG.appName}`,
    description: service.description,
    openGraph: {
      title: `${service.name} | ${APP_CONFIG.appName}`,
      description: service.description,
      images: [service.coverImage || service.image || APP_CONFIG.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} | ${APP_CONFIG.appName}`,
      description: service.description,
      images: [service.coverImage || service.image || APP_CONFIG.ogImage],
    },
  };
}

export default async function ServiceRoute(props: Props) {
  const params = await props.params;
  const bootstrap = await getPublicBootstrapData();
  const service = bootstrap.catalog.services.find((candidateService) => candidateService.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <ServiceDetailScreen
      areas={bootstrap.catalog.areas}
      categories={bootstrap.catalog.categories}
      professionals={bootstrap.catalog.professionals}
      serviceId={service.id}
      services={bootstrap.catalog.services}
    />
  );
}
