import { ViewerAuthPage } from '@marketplace/web/auth/viewer-auth-page';
import { createLocalizedPath } from '@marketplace/web/platform';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanRegisterPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ locale }, searchParams, session] = await Promise.all([
    props.params,
    props.searchParams,
    fetchViewerSessionServer(),
  ]);

  return (
    <ViewerAuthPage
      defaultNextPath={searchParams.next || createLocalizedPath(locale)}
      initialSession={session}
      locale={locale}
      mode="register"
      platformId="bidan"
    />
  );
}
