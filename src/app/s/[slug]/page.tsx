import { APP_CONFIG } from '@/lib/config';
import { MOCK_SERVICES } from '@/lib/constants';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ServiceDetailScreen } from '@/components/screens/ServiceDetailScreen';

interface Props {
  params: {
    slug: string;
  };
}

// Generate static params for all services
export function generateStaticParams() {
  return MOCK_SERVICES.map((svc) => ({
    slug: svc.slug,
  }));
}

// Generate dynamic metadata for SEO
export function generateMetadata({ params }: Props): Metadata {
  const service = MOCK_SERVICES.find((s) => s.slug === params.slug);
  
  if (!service) {
    return {
      title: `Service Not Found | ${APP_CONFIG.appName}`,
    };
  }

  return {
    title: `${service.name} Services - Find Top Providers | ${APP_CONFIG.appName}`,
    description: service.description,
  };
}

export default function ServiceRoute({ params }: Props) {
  const service = MOCK_SERVICES.find((s) => s.slug === params.slug);
  
  if (!service) {
    notFound();
  }

  return <ServiceDetailScreen serviceId={service.id} />;
}
