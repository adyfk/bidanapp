import { ViewerAuthPage } from '@marketplace/web/auth/viewer-auth-page';
import { createLocalizedPath } from '@marketplace/web/platform';

export default async function BidanForgotPasswordPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ locale }, searchParams] = await Promise.all([props.params, props.searchParams]);

  return (
    <ViewerAuthPage
      defaultNextPath={searchParams.next || createLocalizedPath(locale, '/home')}
      locale={locale}
      mode="forgot-password"
      platformId="bidan"
    />
  );
}
