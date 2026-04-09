import { getServicePlatformOrigin } from '@marketplace/platform-config';
import {
  createLocalizedPath,
  createPlatformAppUrl,
  createPlatformAuthUrl,
  fetchViewerSessionServer,
  ProfessionalWorkspacePage,
} from '@marketplace/web';

export default async function BidanProfessionalDashboardCoveragePage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(
    createLocalizedPath(locale, '/professionals/dashboard/coverage'),
    getServicePlatformOrigin('bidan'),
  );

  return (
    <ProfessionalWorkspacePage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
      section="coverage"
    />
  );
}
