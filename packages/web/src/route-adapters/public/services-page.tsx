import type { ServicePlatformId } from '@marketplace/platform-config';
import { MarketplaceServicesView } from '../../screens/public/services/view';
import { resolvePublicRouteContext, safeOfferings } from './shared';

export async function PlatformServicesPage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const { platform, resolvedLocale } = await resolvePublicRouteContext(platformId, locale);
  const offerings = await safeOfferings(platform.id);

  return <MarketplaceServicesView locale={resolvedLocale} offerings={offerings} platform={platform} />;
}
