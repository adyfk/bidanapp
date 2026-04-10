import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { CustomerOrderDetailPage } from '@marketplace/web/customer/order-detail-page';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanOrderDetailPage(props: { params: Promise<{ locale: string; orderId: string }> }) {
  const [{ locale, orderId }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(
    createLocalizedPath(locale, `/orders/${orderId}`),
    getServicePlatformOrigin('bidan'),
  );

  return (
    <CustomerOrderDetailPage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      orderId={orderId}
      platformId="bidan"
    />
  );
}
