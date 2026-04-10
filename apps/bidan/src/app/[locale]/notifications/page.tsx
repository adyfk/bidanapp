import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { CustomerNotificationsPage } from '@marketplace/web/customer/notifications-page';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanNotificationsPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(
    createLocalizedPath(locale, '/notifications'),
    getServicePlatformOrigin('bidan'),
  );

  return (
    <CustomerNotificationsPage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
    />
  );
}
