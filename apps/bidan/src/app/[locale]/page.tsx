import { PlatformHomePage } from '@marketplace/web/public/home-page';

export default async function BidanLocalizedHomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <PlatformHomePage locale={locale} platformId="bidan" />;
}
