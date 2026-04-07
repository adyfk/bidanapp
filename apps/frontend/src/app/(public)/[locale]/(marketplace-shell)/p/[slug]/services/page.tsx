import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfessionalMarketplaceShell } from '@/features/professional-marketplace/components/ProfessionalMarketplaceShell';
import { ProfessionalServicesExperience } from '@/features/professional-marketplace/components/ProfessionalServicesExperience';
import { ProfessionalStructuredData } from '@/features/professional-marketplace/components/ProfessionalStructuredData';
import {
  buildProfessionalPageMetadata,
  buildProfessionalStructuredData,
  getProfessionalPublicPageData,
} from '@/features/professional-marketplace/lib/page-data';

export const revalidate = 600;

interface Props {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const pageData = await getProfessionalPublicPageData(slug, locale);

  if (!pageData) {
    return {
      title: 'Professional Services Not Found',
    };
  }

  return buildProfessionalPageMetadata({
    locale,
    pageData,
    section: 'services',
  });
}

export default async function ProfessionalServicesPage(props: Props) {
  const { locale, slug } = await props.params;
  const pageData = await getProfessionalPublicPageData(slug, locale);

  if (!pageData) {
    notFound();
  }

  return (
    <>
      <ProfessionalStructuredData
        data={buildProfessionalStructuredData({
          locale,
          pageData,
          section: 'services',
        })}
      />
      <ProfessionalMarketplaceShell activeSection="services" locale={locale} pageData={pageData}>
        <ProfessionalServicesExperience
          areas={pageData.areas}
          categories={pageData.categories}
          initialProfessional={pageData.professional}
          professionalSlug={slug}
          services={pageData.services}
        />
      </ProfessionalMarketplaceShell>
    </>
  );
}
