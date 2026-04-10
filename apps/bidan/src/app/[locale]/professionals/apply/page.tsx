import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { ProfessionalApplyPage } from '@marketplace/web/professional/apply-page';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanProfessionalApplyPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(
    createLocalizedPath(locale, '/professionals/apply'),
    getServicePlatformOrigin('bidan'),
  );

  return (
    <ProfessionalApplyPage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
    />
  );
}
