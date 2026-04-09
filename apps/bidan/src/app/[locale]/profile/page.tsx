import { getServicePlatformOrigin } from '@marketplace/platform-config';
import {
  CustomerProfilePage,
  createLocalizedPath,
  createPlatformAppUrl,
  createPlatformAuthUrl,
  fetchViewerSessionServer,
} from '@marketplace/web';

export default async function BidanProfilePage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(createLocalizedPath(locale, '/profile'), getServicePlatformOrigin('bidan'));

  return (
    <CustomerProfilePage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
    />
  );
}
