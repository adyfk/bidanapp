import { fetchViewerSessionServer, ViewerSecurityPage } from '@marketplace/web';

export default async function BidanSecurityPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);

  return <ViewerSecurityPage initialSession={session} locale={locale} platformId="bidan" />;
}
