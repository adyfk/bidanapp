import { fetchViewerSessionServer, ViewerSessionsPage } from '@marketplace/web';

export default async function BidanSessionsPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);

  return <ViewerSessionsPage initialSession={session} locale={locale} platformId="bidan" />;
}
