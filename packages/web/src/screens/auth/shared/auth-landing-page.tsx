'use client';

import { ViewerAuthPage } from './viewer-auth-page';

export function AuthLandingPage({ defaultNextPath, locale = 'id' }: { defaultNextPath: string; locale?: string }) {
  return <ViewerAuthPage defaultNextPath={defaultNextPath} isHub locale={locale} mode="login" />;
}
