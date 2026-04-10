import { ViewerSecurityPage } from '@marketplace/web/auth/viewer-security-page';
import { fetchViewerSessionServer } from '@marketplace/web/server';

export default async function BidanSecurityPage(props: { params: Promise<{ locale: string }> }) {
  const [{ locale }, session] = await Promise.all([props.params, fetchViewerSessionServer()]);

  return <ViewerSecurityPage initialSession={session} locale={locale} platformId="bidan" />;
}
