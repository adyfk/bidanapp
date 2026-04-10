import type { ServicePlatformId } from '@marketplace/platform-config';
import { createLocalizedPath, createPlatformLoginPath } from '../../lib/platform';
import { fetchViewerSessionServer } from '../../lib/viewer-session-server';
import { MarketplaceProfessionalDetailView } from '../../screens/public/professional-detail/view';
import { resolvePublicRouteContext, safeProfessionalDetail } from './shared';

export async function PlatformProfessionalDetailPage({
  locale,
  platformId,
  slug,
}: {
  locale: string;
  platformId: ServicePlatformId;
  slug: string;
}) {
  const { platform, resolvedLocale } = await resolvePublicRouteContext(platformId, locale);
  const [detail, session] = await Promise.all([safeProfessionalDetail(platform.id, slug), fetchViewerSessionServer()]);

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-8">
        <div
          className="mx-auto max-w-md rounded-[28px] border px-5 py-8 text-center shadow-sm"
          style={{ backgroundColor: '#ffffff', borderColor: '#f0f1f4' }}
        >
          <h1 className="text-[20px] font-bold text-gray-900">Profil belum tersedia</h1>
          <p className="mt-2 text-[13px] leading-6 text-gray-500">
            Profesional ini belum bisa ditampilkan untuk publik.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MarketplaceProfessionalDetailView
      detail={detail}
      loginHref={createPlatformLoginPath(resolvedLocale, createLocalizedPath(resolvedLocale, `/p/${slug}`))}
      locale={resolvedLocale}
      ordersHref={createLocalizedPath(resolvedLocale, '/orders')}
      platformName={platform.name}
      session={session}
      servicesHref={createLocalizedPath(resolvedLocale, '/services')}
    />
  );
}
