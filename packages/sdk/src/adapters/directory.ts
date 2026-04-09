import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type DirectoryOffering = MarketplaceComponents['schemas']['DirectoryOffering'];
export type DirectoryOfferingDetail = MarketplaceComponents['schemas']['DirectoryOfferingDetail'];
export type DirectoryProfessional = MarketplaceComponents['schemas']['DirectoryProfessional'];
export type DirectoryProfessionalDetail = MarketplaceComponents['schemas']['DirectoryProfessionalDetail'];

export async function fetchDirectoryProfessionals(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ professionals: DirectoryProfessional[] }> {
  const result = await client.GET('/platforms/{platform_id}/directory/professionals', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load directory professionals');
  }

  return {
    professionals: result.data.data.professionals ?? [],
  };
}

export async function fetchDirectoryProfessionalBySlug(
  client: MarketplaceApiClient,
  platformId: string,
  slug: string,
): Promise<DirectoryProfessionalDetail> {
  const result = await client.GET('/platforms/{platform_id}/directory/professionals/{slug}', {
    params: {
      path: {
        platform_id: platformId,
        slug,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load directory professional detail');
  }

  return result.data.data;
}

export async function fetchDirectoryOfferings(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ offerings: DirectoryOffering[] }> {
  const result = await client.GET('/platforms/{platform_id}/directory/offerings', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load directory offerings');
  }

  return {
    offerings: result.data.data.offerings ?? [],
  };
}

export async function fetchDirectoryOfferingBySlug(
  client: MarketplaceApiClient,
  platformId: string,
  slug: string,
): Promise<DirectoryOfferingDetail> {
  const result = await client.GET('/platforms/{platform_id}/directory/offerings/{slug}', {
    params: {
      path: {
        platform_id: platformId,
        slug,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load directory offering detail');
  }

  return result.data.data;
}
