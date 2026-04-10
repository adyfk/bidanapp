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
import { getApiBaseUrl } from '../../lib/env';
import { resolvePlatformLocale } from '../../lib/platform';
import { resolvePlatformContext } from '../../lib/platform-server';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

export async function resolvePublicRouteContext(platformId: ServicePlatformId, locale: string) {
  const platform = await resolvePlatformContext(platformId);

  return {
    platform,
    resolvedLocale: resolvePlatformLocale(platform, locale),
  };
}

export async function safeProfessionals(platformId: string): Promise<DirectoryProfessional[]> {
  try {
    const result = await fetchDirectoryProfessionals(client, platformId);
    return result.professionals ?? [];
  } catch {
    return [];
  }
}

export async function safeOfferings(platformId: string): Promise<DirectoryOffering[]> {
  try {
    const result = await fetchDirectoryOfferings(client, platformId);
    return result.offerings ?? [];
  } catch {
    return [];
  }
}

export async function safeProfessionalDetail(
  platformId: string,
  slug: string,
): Promise<DirectoryProfessionalDetail | null> {
  try {
    return await fetchDirectoryProfessionalBySlug(client, platformId, slug);
  } catch {
    return null;
  }
}

export async function safeOfferingDetail(platformId: string, slug: string): Promise<DirectoryOfferingDetail | null> {
  try {
    return await fetchDirectoryOfferingBySlug(client, platformId, slug);
  } catch {
    return null;
  }
}
