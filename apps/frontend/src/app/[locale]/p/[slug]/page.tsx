import { ProfessionalDetailScreen } from '@/components/screens/ProfessionalDetailScreen';
import { getCategoryById, getProfessionalBySlug } from '@/lib/constants';
import { APP_CONFIG } from '@/lib/config';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const professional = getProfessionalBySlug(params.slug);

  if (!professional) {
    return {
      title: `Professional Not Found | ${APP_CONFIG.appName}`,
    };
  }

  const profCategory = getCategoryById(professional.categoryId)?.name || 'Professional';

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
    }
  };
}

export default async function ProfessionalDetailRoute(props: Props) {
  const params = await props.params;
  const professional = getProfessionalBySlug(params.slug);

  if (!professional) {
    notFound();
  }

  return <ProfessionalDetailScreen professionalSlug={params.slug} />;
}
