import { createLocalizedPath, fetchViewerSessionServer, ViewerAuthPage } from '@marketplace/web';

export default async function BidanLoginPage(props: {
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
      defaultNextPath={searchParams.next || createLocalizedPath(locale, '/home')}
      initialSession={session}
      locale={locale}
      mode="login"
      platformId="bidan"
    />
  );
}
