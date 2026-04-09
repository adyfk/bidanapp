import { PlatformServicesPage } from '@marketplace/web';

export default async function BidanServicesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <PlatformServicesPage locale={locale} platformId="bidan" />;
}
