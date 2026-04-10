import type { ServicePlatformId } from '@marketplace/platform-config';
import { createLocalizedPath } from '../../lib/platform';
import { MarketplaceOfferingDetailView } from '../../screens/public/service-detail/view';
import { resolvePublicRouteContext, safeOfferingDetail } from './shared';

export async function PlatformOfferingDetailPage({
  locale,
  platformId,
  slug,
}: {
  locale: string;
  platformId: ServicePlatformId;
  slug: string;
}) {
  const { platform, resolvedLocale } = await resolvePublicRouteContext(platformId, locale);
  const detail = await safeOfferingDetail(platform.id, slug);

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-8">
        <div
          className="mx-auto max-w-md rounded-[28px] border px-5 py-8 text-center shadow-sm"
          style={{ backgroundColor: '#ffffff', borderColor: '#f0f1f4' }}
        >
          <h1 className="text-[20px] font-bold text-gray-900">Layanan belum tersedia</h1>
          <p className="mt-2 text-[13px] leading-6 text-gray-500">
            Offering ini belum dipublikasikan atau sudah tidak aktif.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MarketplaceOfferingDetailView
      detail={detail}
      locale={resolvedLocale}
      ordersHref={createLocalizedPath(resolvedLocale, '/orders')}
    />
  );
}
