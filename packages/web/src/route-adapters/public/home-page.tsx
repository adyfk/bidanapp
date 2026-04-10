import type { ServicePlatformId } from '@marketplace/platform-config';
import { createLocalizedPath } from '../../lib/platform';
import { MarketplaceOnboardingView } from '../../screens/public/onboarding/view';
import { resolvePublicRouteContext } from './shared';

export async function PlatformHomePage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const { platform, resolvedLocale } = await resolvePublicRouteContext(platformId, locale);

  return (
    <MarketplaceOnboardingView
      currentPath={createLocalizedPath(resolvedLocale)}
      locale={resolvedLocale}
      platformName={platform.name}
      visitorHref={createLocalizedPath(resolvedLocale, '/home')}
    />
  );
}
