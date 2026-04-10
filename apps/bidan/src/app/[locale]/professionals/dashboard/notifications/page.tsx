import { getServicePlatformOrigin } from '@marketplace/platform-config';
import { createLocalizedPath, createPlatformAppUrl, createPlatformAuthUrl } from '@marketplace/web/platform';
import { ProfessionalWorkspacePage } from '@marketplace/web/professional/workspace-page';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanProfessionalDashboardNotificationsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);
  const nextPath = createPlatformAppUrl(
    createLocalizedPath(locale, '/professionals/dashboard/notifications'),
    getServicePlatformOrigin('bidan'),
  );

  return (
    <ProfessionalWorkspacePage
      authHref={createPlatformAuthUrl(nextPath, locale)}
      initialSession={session}
      locale={locale}
      platformId="bidan"
      section="notifications"
    />
  );
}
