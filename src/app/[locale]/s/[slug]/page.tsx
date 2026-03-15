import { APP_CONFIG } from '@/lib/config';
import { MOCK_SERVICES } from '@/lib/constants';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ServiceDetailScreen } from '@/components/screens/ServiceDetailScreen';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all services
export function generateStaticParams() {
  return MOCK_SERVICES.map((svc) => ({
    slug: svc.slug,
  }));
}

// Generate dynamic metadata for SEO
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const service = MOCK_SERVICES.find((s) => s.slug === params.slug);

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
      images: [APP_CONFIG.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} | ${APP_CONFIG.appName}`,
      description: service.description,
      images: [APP_CONFIG.ogImage],
    }
  };
}

export default async function ServiceRoute(props: Props) {
  const params = await props.params;
  const service = MOCK_SERVICES.find((s) => s.slug === params.slug);

  if (!service) {
    notFound();
  }

  return <ServiceDetailScreen serviceId={service.id} />;
}
