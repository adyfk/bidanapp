import { PlatformOfferingDetailPage } from '@marketplace/web';

export default async function BidanOfferingDetailAppPage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await props.params;
  return <PlatformOfferingDetailPage locale={locale} platformId="bidan" slug={slug} />;
}
