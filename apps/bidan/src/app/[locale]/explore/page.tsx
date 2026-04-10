import { PlatformExplorePage } from '@marketplace/web/public/explore-page';

export default async function BidanExplorePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <PlatformExplorePage locale={locale} platformId="bidan" />;
}
