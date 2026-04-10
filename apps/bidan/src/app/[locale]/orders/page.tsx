import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { OrdersPage } from '@marketplace/web/customer/orders-page';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanOrdersPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(createLocalizedPath(locale, '/orders'), getServicePlatformOrigin('bidan'));

  return (
    <OrdersPage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
    />
  );
}
