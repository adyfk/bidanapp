import { PlatformMarketplaceHomePage } from '@marketplace/web';

export default async function BidanMarketplaceHomePageRoute(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <PlatformMarketplaceHomePage locale={locale} platformId="bidan" />;
}
