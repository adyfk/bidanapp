import { PlatformHomePage } from '@marketplace/web';

export default async function BidanLocalizedHomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <PlatformHomePage locale={locale} platformId="bidan" />;
}
