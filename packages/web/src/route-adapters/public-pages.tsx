import {
  createMarketplaceApiClient,
  type DirectoryOffering,
  type DirectoryOfferingDetail,
  type DirectoryProfessional,
  type DirectoryProfessionalDetail,
  fetchDirectoryOfferingBySlug,
  fetchDirectoryOfferings,
  fetchDirectoryProfessionalBySlug,
  fetchDirectoryProfessionals,
} from '@marketplace/marketplace-core';
import type { ServicePlatformId } from '@marketplace/platform-config';
import { getApiBaseUrl } from '../lib/env';
import {
  createLocalizedPath,
  createPlatformLoginPath,
  createPlatformRegisterPath,
  resolvePlatformLocale,
} from '../lib/platform';
import { resolvePlatformContext } from '../lib/platform-server';
import { fetchViewerSessionServer } from '../lib/viewer-session-server';
import {
  MarketplaceExploreView,
  MarketplaceHomeView,
  MarketplaceOfferingDetailView,
  MarketplaceOnboardingView,
  MarketplaceProfessionalDetailView,
  MarketplaceServicesView,
} from '../screens/public/shared/view';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

export async function PlatformHomePage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const platform = await resolvePlatformContext(platformId);
  const resolvedLocale = resolvePlatformLocale(platform, locale);
  const session = await fetchViewerSessionServer();

  return (
    <MarketplaceOnboardingView
      currentPath={createLocalizedPath(resolvedLocale)}
      locale={resolvedLocale}
      loginHref={createPlatformLoginPath(resolvedLocale, createLocalizedPath(resolvedLocale, '/home'))}
      platformId={platform.id}
      platformName={platform.name}
      professionalHref={createLocalizedPath(resolvedLocale, '/professionals/apply')}
      registerHref={createPlatformRegisterPath(resolvedLocale, createLocalizedPath(resolvedLocale, '/home'))}
      session={session}
      visitorHref={createLocalizedPath(resolvedLocale, '/home')}
    />
  );
}

export async function PlatformMarketplaceHomePage({
  locale,
  platformId,
}: {
  locale: string;
  platformId: ServicePlatformId;
}) {
  const platform = await resolvePlatformContext(platformId);
  const resolvedLocale = resolvePlatformLocale(platform, locale);
  const [professionals, offerings, initialSession] = await Promise.all([
    safeProfessionals(platform.id),
    safeOfferings(platform.id),
    fetchViewerSessionServer(),
  ]);

  return (
    <MarketplaceHomeView
      currentPath={createLocalizedPath(resolvedLocale, '/home')}
      locale={resolvedLocale}
      loginHref={createPlatformLoginPath(resolvedLocale, createLocalizedPath(resolvedLocale, '/home'))}
      notificationsHref={createLocalizedPath(resolvedLocale, '/notifications')}
      offerings={offerings}
      ordersHref={createLocalizedPath(resolvedLocale, '/orders')}
      platform={platform}
      professionals={professionals}
      profileHref={createLocalizedPath(resolvedLocale, '/profile')}
      servicesHref={createLocalizedPath(resolvedLocale, '/services')}
      session={initialSession}
      supportHref={createLocalizedPath(resolvedLocale, '/support')}
    />
  );
}

export async function PlatformExplorePage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const platform = await resolvePlatformContext(platformId);
  const resolvedLocale = resolvePlatformLocale(platform, locale);
  const [professionals, initialSession] = await Promise.all([
    safeProfessionals(platform.id),
    fetchViewerSessionServer(),
  ]);

  return (
    <MarketplaceExploreView
      currentPath={createLocalizedPath(resolvedLocale, '/explore')}
      locale={resolvedLocale}
      notificationsHref={createLocalizedPath(resolvedLocale, '/notifications')}
      platform={platform}
      professionals={professionals}
      profileHref={
        initialSession?.isAuthenticated
          ? createLocalizedPath(resolvedLocale, '/profile')
          : createPlatformLoginPath(resolvedLocale, createLocalizedPath(resolvedLocale, '/explore'))
      }
      session={initialSession}
    />
  );
}

export async function PlatformServicesPage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const platform = await resolvePlatformContext(platformId);
  const resolvedLocale = resolvePlatformLocale(platform, locale);
  const offerings = await safeOfferings(platform.id);

  return <MarketplaceServicesView locale={resolvedLocale} offerings={offerings} platform={platform} />;
}

export async function PlatformProfessionalDetailPage({
  locale,
  platformId,
  slug,
}: {
  locale: string;
  platformId: ServicePlatformId;
  slug: string;
}) {
  const platform = await resolvePlatformContext(platformId);
  const resolvedLocale = resolvePlatformLocale(platform, locale);
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

export async function PlatformOfferingDetailPage({
  locale,
  platformId,
  slug,
}: {
  locale: string;
  platformId: ServicePlatformId;
  slug: string;
}) {
  const platform = await resolvePlatformContext(platformId);
  const resolvedLocale = resolvePlatformLocale(platform, locale);
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

async function safeProfessionals(platformId: string): Promise<DirectoryProfessional[]> {
  try {
    const result = await fetchDirectoryProfessionals(client, platformId);
    return result.professionals ?? [];
  } catch {
    return [];
  }
}

async function safeOfferings(platformId: string): Promise<DirectoryOffering[]> {
  try {
    const result = await fetchDirectoryOfferings(client, platformId);
    return result.offerings ?? [];
  } catch {
    return [];
  }
}

async function safeProfessionalDetail(platformId: string, slug: string): Promise<DirectoryProfessionalDetail | null> {
  try {
    return await fetchDirectoryProfessionalBySlug(client, platformId, slug);
  } catch {
    return null;
  }
}

async function safeOfferingDetail(platformId: string, slug: string): Promise<DirectoryOfferingDetail | null> {
  try {
    return await fetchDirectoryOfferingBySlug(client, platformId, slug);
  } catch {
    return null;
  }
}
