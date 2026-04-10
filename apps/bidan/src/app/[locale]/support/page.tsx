import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { CustomerSupportPage } from '@marketplace/web/customer/support-page';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { fetchViewerSessionServer } from '@marketplace/web/server';

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
