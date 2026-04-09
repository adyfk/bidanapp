import { getServicePlatformOrigin } from '@marketplace/platform-config';
import {
  CustomerSupportPage,
  createLocalizedPath,
  createPlatformAppUrl,
  createPlatformAuthUrl,
  fetchViewerSessionServer,
} from '@marketplace/web';

export default async function BidanSupportPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(createLocalizedPath(locale, '/support'), getServicePlatformOrigin('bidan'));

  return (
    <CustomerSupportPage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
    />
  );
}
