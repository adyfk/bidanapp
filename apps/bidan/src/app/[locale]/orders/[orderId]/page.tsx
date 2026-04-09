import { getServicePlatformOrigin } from '@marketplace/platform-config';
import {
  CustomerOrderDetailPage,
  createLocalizedPath,
  createPlatformAppUrl,
  createPlatformAuthUrl,
  fetchViewerSessionServer,
} from '@marketplace/web';

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
