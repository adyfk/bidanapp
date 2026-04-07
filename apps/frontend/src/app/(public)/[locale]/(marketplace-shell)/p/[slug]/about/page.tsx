import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfessionalAboutContent } from '@/features/professional-marketplace/components/ProfessionalAboutContent';
import { ProfessionalMarketplaceShell } from '@/features/professional-marketplace/components/ProfessionalMarketplaceShell';
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
      title: 'Professional About Not Found',
    };
  }

  return buildProfessionalPageMetadata({
    locale,
    pageData,
    section: 'about',
  });
}

export default async function ProfessionalAboutPage(props: Props) {
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
          section: 'about',
        })}
      />
      <ProfessionalMarketplaceShell activeSection="about" locale={locale} pageData={pageData}>
        <ProfessionalAboutContent locale={locale} pageData={pageData} />
      </ProfessionalMarketplaceShell>
    </>
  );
}
