import platformManifestJson from '../../../config/platform-manifest.json';

export type ServicePlatformId = string;
export type PlatformLocale = 'id' | 'en';
export type MarketplaceThemePreset = 'classic';
export type MarketplaceMotionPreset = 'rich';

export type ProfessionalFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'document';

export interface ProfessionalRegistrationField {
  key: string;
  label: string;
  type: ProfessionalFieldType;
  required: boolean;
  placeholder?: string;
  helperText?: string;
}

export interface PlatformTheme {
  accent: string;
  background: string;
  border: string;
  borderStrong: string;
  danger: string;
  focusRing: string;
  heroGradient: string;
  heroOverlay: string;
  info: string;
  muted: string;
  navActiveBackground: string;
  navActiveText: string;
  pillBackground: string;
  pillText: string;
  primary: string;
  secondary: string;
  success: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textStrong: string;
  warning: string;
}

export type MasterBrandId = 'admin';

export interface MasterBrandTheme {
  id: MasterBrandId;
  label: string;
  theme: PlatformTheme;
}

export interface PlatformSeo {
  description: string;
  ogDescription: string;
  ogTitle: string;
  title: string;
}

export type PlatformLocaleMap<T> = Partial<Record<PlatformLocale, T>>;

export interface PlatformRegistrationSchema {
  description: string;
  fields: ProfessionalRegistrationField[];
  title: string;
  version: number;
}

export interface PlatformFeatureFlags {
  adminReview: boolean;
  payments: boolean;
  professionalDocuments: boolean;
  professionalOnboarding: boolean;
}

export interface MarketplaceNavItemConfig {
  href: string;
  icon: string;
  id: string;
  label: string;
}

export interface PlatformCategoryTile {
  caption?: string;
  href: string;
  id: string;
  label: string;
  query?: string;
}

export interface PlatformFeaturedSection {
  description: string;
  id: string;
  title: string;
}

export interface PlatformMarketplacePresentation {
  activityDescription: string;
  activityTitle: string;
  categories: PlatformCategoryTile[];
  exploreDescription: string;
  exploreTitle: string;
  helpDescription: string;
  helpTitle: string;
  homeCategorySection: PlatformFeaturedSection;
  homeProfessionalSection: PlatformFeaturedSection;
  homeServiceSection: PlatformFeaturedSection;
  servicesDescription: string;
  servicesTitle: string;
}

export interface PlatformCopyPack {
  accessBadge: string;
  authDescription: string;
  authTitle: string;
  homeEyebrow: string;
  navigation: MarketplaceNavItemConfig[];
}

export type MarketplaceNavConfig = MarketplaceNavItemConfig[];
export type MarketplaceCopyPack = PlatformCopyPack;
export type ProfessionalAttributeSchema = PlatformRegistrationSchema;

export interface PlatformScreenCapabilities {
  admin: boolean;
  authHub: boolean;
  customer: boolean;
  professional: boolean;
  support: boolean;
}

export interface ServicePlatformConfig {
  copy: PlatformCopyPack;
  copyByLocale: PlatformLocaleMap<PlatformCopyPack>;
  defaultLocale: PlatformLocale;
  description: string;
  domains: string[];
  featureFlags: PlatformFeatureFlags;
  id: ServicePlatformId;
  motionPreset: MarketplaceMotionPreset;
  name: string;
  presentation: PlatformMarketplacePresentation;
  registrationSchemaByLocale: PlatformLocaleMap<PlatformRegistrationSchema>;
  registrationSchema: PlatformRegistrationSchema;
  screenCapabilities: PlatformScreenCapabilities;
  seo: PlatformSeo;
  seoByLocale: PlatformLocaleMap<PlatformSeo>;
  slug: string;
  summary: string;
  supportedLocales: PlatformLocale[];
  theme: PlatformTheme;
  themePreset: MarketplaceThemePreset;
}

interface PlatformManifest {
  platforms: ServicePlatformConfig[];
  version: number;
}

const platformManifest = platformManifestJson as PlatformManifest;

export const PLATFORM_MANIFEST_VERSION = platformManifest.version;
export const SERVICE_PLATFORMS: ServicePlatformConfig[] = platformManifest.platforms.map(normalizePlatformConfig);
export const DEFAULT_SERVICE_PLATFORM_ID: ServicePlatformId = SERVICE_PLATFORMS[0]?.id ?? 'default';
export const MASTER_BRANDS: Record<MasterBrandId, MasterBrandTheme> = {
  admin: {
    id: 'admin',
    label: 'Control Plane',
    theme: createMasterBrandTheme('admin'),
  },
};

export function getServicePlatformConfig(platformId: ServicePlatformId): ServicePlatformConfig {
  const platform = SERVICE_PLATFORMS.find((candidate) => candidate.id === platformId);
  if (!platform) {
    throw new Error(`Unknown platform id: ${platformId}`);
  }
  return platform;
}

export function getDefaultServicePlatformConfig(): ServicePlatformConfig {
  return getServicePlatformConfig(DEFAULT_SERVICE_PLATFORM_ID);
}

export function getDefaultServicePlatformName(): string {
  return getDefaultServicePlatformConfig().name;
}

export function getServicePlatformOrigin(platformId: ServicePlatformId): string {
  const platform = getServicePlatformConfig(platformId);
  return `https://${platform.domains[0]}`;
}

export function getMasterBrandTheme(brandId: MasterBrandId): MasterBrandTheme {
  return MASTER_BRANDS[brandId];
}

export function listServicePlatforms(): ServicePlatformConfig[] {
  return [...SERVICE_PLATFORMS];
}

export function normalizePlatformLocale(value?: string | null): PlatformLocale {
  if (value === 'en') {
    return 'en';
  }
  return 'id';
}

export function getPlatformSeo(platform: ServicePlatformConfig, locale?: string | null): PlatformSeo {
  const resolvedLocale = normalizePlatformLocale(locale ?? platform.defaultLocale);
  return platform.seoByLocale[resolvedLocale] ?? platform.seo;
}

export function getPlatformRegistrationSchema(
  platform: ServicePlatformConfig,
  locale?: string | null,
): PlatformRegistrationSchema {
  const resolvedLocale = normalizePlatformLocale(locale ?? platform.defaultLocale);
  return platform.registrationSchemaByLocale[resolvedLocale] ?? platform.registrationSchema;
}

export function getPlatformCopy(platform: ServicePlatformConfig, locale?: string | null): PlatformCopyPack {
  const resolvedLocale = normalizePlatformLocale(locale ?? platform.defaultLocale);
  return platform.copyByLocale[resolvedLocale] ?? platform.copy;
}

export function getPlatformMarketplacePresentation(platform: ServicePlatformConfig): PlatformMarketplacePresentation {
  return platform.presentation;
}

export function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/:\d+$/, '');
}

export function resolveServicePlatformByHost(host: string): ServicePlatformConfig | null {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return null;
  }

  const directMatch = SERVICE_PLATFORMS.find((platform) =>
    platform.domains.some((domain) => normalizeHost(domain) === normalizedHost),
  );
  if (directMatch) {
    return directMatch;
  }

  const subdomain = normalizedHost.split('.')[0];
  return SERVICE_PLATFORMS.find((platform) => platform.slug === subdomain) ?? null;
}

function normalizePlatformConfig(platform: ServicePlatformConfig): ServicePlatformConfig {
  const defaultLocale = normalizePlatformLocale(
    (platform as ServicePlatformConfig & { defaultLocale?: string }).defaultLocale,
  );
  const supportedLocales = normalizeLocales(
    (platform as ServicePlatformConfig & { supportedLocales?: string[] }).supportedLocales,
    defaultLocale,
  );
  const seoByLocale = normalizeLocaleMap(
    (platform as ServicePlatformConfig & { seoByLocale?: PlatformLocaleMap<PlatformSeo> }).seoByLocale,
    platform.seo,
    supportedLocales,
  );
  const registrationSchemaByLocale = normalizeLocaleMap(
    (
      platform as ServicePlatformConfig & {
        registrationSchemaByLocale?: PlatformLocaleMap<PlatformRegistrationSchema>;
      }
    ).registrationSchemaByLocale,
    platform.registrationSchema,
    supportedLocales,
  );
  const defaultCopy =
    (
      platform as ServicePlatformConfig & {
        copy?: PlatformCopyPack;
      }
    ).copy ?? createDefaultCopy(platform.name);
  const copyByLocale = normalizeLocaleMap(
    (platform as ServicePlatformConfig & { copyByLocale?: PlatformLocaleMap<PlatformCopyPack> }).copyByLocale,
    defaultCopy,
    supportedLocales,
  );

  return {
    ...platform,
    copy: copyByLocale[defaultLocale] ?? defaultCopy,
    copyByLocale,
    defaultLocale,
    motionPreset: platform.motionPreset ?? 'rich',
    presentation:
      (platform as ServicePlatformConfig & { presentation?: PlatformMarketplacePresentation }).presentation ??
      createDefaultPresentation(),
    registrationSchema: registrationSchemaByLocale[defaultLocale] ?? platform.registrationSchema,
    registrationSchemaByLocale,
    screenCapabilities: platform.screenCapabilities ?? {
      admin: true,
      authHub: true,
      customer: true,
      professional: true,
      support: true,
    },
    seo: seoByLocale[defaultLocale] ?? platform.seo,
    seoByLocale,
    supportedLocales,
    theme: normalizePlatformTheme(platform.theme),
    themePreset: platform.themePreset ?? 'classic',
  };
}

function normalizeLocaleMap<T>(
  source: PlatformLocaleMap<T> | undefined,
  fallback: T,
  supportedLocales: PlatformLocale[],
): PlatformLocaleMap<T> {
  const normalized: PlatformLocaleMap<T> = {};
  for (const locale of supportedLocales) {
    normalized[locale] = source?.[locale] ?? fallback;
  }
  return normalized;
}

function normalizeLocales(source: string[] | undefined, fallback: PlatformLocale): PlatformLocale[] {
  const values = new Set<PlatformLocale>([fallback]);
  for (const locale of source ?? []) {
    values.add(normalizePlatformLocale(locale));
  }
  return Array.from(values);
}

function normalizePlatformTheme(source: PlatformTheme): PlatformTheme {
  return {
    accent: source.accent,
    background: source.background,
    border: source.border ?? 'color-mix(in srgb, var(--ui-primary, #e11d87) 12%, white)',
    borderStrong: source.borderStrong ?? 'color-mix(in srgb, var(--ui-primary, #e11d87) 24%, white)',
    danger: source.danger ?? '#c2416c',
    focusRing: source.focusRing ?? 'color-mix(in srgb, var(--ui-primary, #e11d87) 24%, white)',
    heroGradient: source.heroGradient,
    heroOverlay: source.heroOverlay ?? 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.2) 100%)',
    info: source.info ?? '#0f766e',
    muted: source.muted,
    navActiveBackground: source.navActiveBackground ?? '#331322',
    navActiveText: source.navActiveText ?? '#fff8fb',
    pillBackground: source.pillBackground ?? 'color-mix(in srgb, var(--ui-primary, #e11d87) 12%, white)',
    pillText: source.pillText ?? source.primary,
    primary: source.primary,
    secondary: source.secondary,
    success: source.success ?? '#15803d',
    surface: source.surface,
    surfaceElevated: source.surfaceElevated ?? source.surface,
    surfaceMuted: source.surfaceMuted ?? 'color-mix(in srgb, var(--ui-primary, #e11d87) 4%, white)',
    text: source.text,
    textMuted: source.textMuted ?? source.muted,
    textStrong: source.textStrong ?? source.text,
    warning: source.warning ?? '#c67a02',
  };
}

function createDefaultCopy(platformName: string): PlatformCopyPack {
  return {
    accessBadge: 'Get started',
    authDescription: `Masuk ke ${platformName} untuk melanjutkan order, chat, dan profil Anda.`,
    authTitle: `Masuk ke ${platformName}`,
    homeEyebrow: 'Get started',
    navigation: [
      { href: '/', icon: 'sparkles', id: 'home', label: 'Home' },
      { href: '/services', icon: 'search', id: 'services', label: 'Cari' },
      { href: '/explore', icon: 'compass', id: 'explore', label: 'Ahli' },
      { href: '/orders', icon: 'calendar', id: 'orders', label: 'Aktivitas' },
    ],
  };
}

function createDefaultPresentation(): PlatformMarketplacePresentation {
  return {
    activityDescription: 'Pantau order, pembayaran, dan tindak lanjut dalam satu tempat.',
    activityTitle: 'Aktivitas customer',
    categories: [
      {
        caption: 'Untuk ibu baru',
        href: '/services?q=pascamelahirkan',
        id: 'postpartum',
        label: 'Pascamelahirkan',
        query: 'pascamelahirkan',
      },
      { caption: 'ASI dan menyusui', href: '/services?q=laktasi', id: 'lactation', label: 'Laktasi', query: 'laktasi' },
      {
        caption: 'Konsultasi ringan',
        href: '/services?q=konsultasi',
        id: 'consultation',
        label: 'Konsultasi',
        query: 'konsultasi',
      },
      { caption: 'Produk edukasi', href: '/services?q=workbook', id: 'digital', label: 'Edukasi', query: 'workbook' },
    ],
    exploreDescription: 'Cari profesional berdasarkan kebutuhan dan area yang paling relevan.',
    exploreTitle: 'Jelajahi profesional',
    helpDescription: 'Buka support bila Anda membutuhkan bantuan untuk order atau tindak lanjut.',
    helpTitle: 'Butuh bantuan cepat?',
    homeCategorySection: {
      description: 'Mulai dari kategori yang paling dekat dengan kebutuhan Anda hari ini.',
      id: 'home-categories',
      title: 'Kategori pilihan',
    },
    homeProfessionalSection: {
      description: 'Buka profil profesional dan lanjutkan ke layanan yang paling cocok.',
      id: 'home-professionals',
      title: 'Profesional tepercaya',
    },
    homeServiceSection: {
      description: 'Layanan populer untuk konsultasi, kunjungan rumah, dan edukasi pendamping.',
      id: 'home-services',
      title: 'Layanan populer',
    },
    servicesDescription: 'Telusuri layanan yang sudah siap dibuka, lalu lanjutkan ke profil atau order.',
    servicesTitle: 'Katalog layanan',
  };
}

function createMasterBrandTheme(brandId: MasterBrandId): PlatformTheme {
  const defaultPlatformTheme = getDefaultServicePlatformConfig().theme;
  if (brandId === 'admin') {
    return normalizePlatformTheme({
      ...defaultPlatformTheme,
      navActiveBackground: '#2b1630',
      navActiveText: '#fff7fb',
      pillBackground: '#fde7f3',
      pillText: '#ad1457',
      surfaceMuted: '#fff4f8',
    });
  }

  return normalizePlatformTheme({
    ...defaultPlatformTheme,
    heroOverlay: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.28) 100%)',
    navActiveBackground: '#4f1d3a',
    navActiveText: '#fffafc',
    pillBackground: '#ffe7f2',
    pillText: '#bc2065',
  });
}
