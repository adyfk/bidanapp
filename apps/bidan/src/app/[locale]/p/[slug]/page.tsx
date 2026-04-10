import { PlatformProfessionalDetailPage } from '@marketplace/web/public/professional-detail-page';

export default async function BidanProfessionalDetailAppPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  return <PlatformProfessionalDetailPage locale={locale} platformId="bidan" slug={slug} />;
}
