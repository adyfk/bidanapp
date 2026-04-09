import { getServicePlatformOrigin } from '@marketplace/platform-config';
import {
  CustomerNotificationsPage,
  createLocalizedPath,
  createPlatformAppUrl,
  createPlatformAuthUrl,
  fetchViewerSessionServer,
} from '@marketplace/web';

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
