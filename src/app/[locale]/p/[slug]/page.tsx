import { ProfessionalDetailScreen } from '@/components/screens/ProfessionalDetailScreen';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES } from '@/lib/constants';
import { APP_CONFIG } from '@/lib/config';
import { Metadata } from 'next';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const professional = MOCK_PROFESSIONALS.find(p => p.slug === params.slug) || MOCK_PROFESSIONALS[0];
  const profCategory = MOCK_CATEGORIES.find(c => c.id === professional.categoryId)?.name || 'Professional';

  return {
    title: `${professional.name} - ${profCategory} | ${APP_CONFIG.appName}`,
    description: professional.about,
    openGraph: {
      title: `${professional.name} | ${APP_CONFIG.appName}`,
      description: professional.about,
      images: [professional.image || APP_CONFIG.ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${professional.name} | ${APP_CONFIG.appName}`,
      description: professional.about,
      images: [professional.image || APP_CONFIG.ogImage],
    }
  };
}

export default async function ProfessionalDetailRoute(props: Props) {
  const params = await props.params;
  return <ProfessionalDetailScreen professionalSlug={params.slug} />;
}
