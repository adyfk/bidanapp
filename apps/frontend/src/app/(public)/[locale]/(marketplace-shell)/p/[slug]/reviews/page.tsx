import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfessionalMarketplaceShell } from '@/features/professional-marketplace/components/ProfessionalMarketplaceShell';
import { ProfessionalReviewsContent } from '@/features/professional-marketplace/components/ProfessionalReviewsContent';
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
      title: 'Professional Reviews Not Found',
    };
  }

  return buildProfessionalPageMetadata({
    locale,
    pageData,
    section: 'reviews',
  });
}

export default async function ProfessionalReviewsPage(props: Props) {
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
          section: 'reviews',
        })}
      />
      <ProfessionalMarketplaceShell activeSection="reviews" locale={locale} pageData={pageData}>
        <ProfessionalReviewsContent locale={locale} pageData={pageData} />
      </ProfessionalMarketplaceShell>
    </>
  );
}
