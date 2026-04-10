import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { CustomerProfilePage } from '@marketplace/web/customer/profile-page';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { fetchViewerSessionServer } from '@marketplace/web/server';

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
