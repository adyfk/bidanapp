import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type PlatformDefinition = MarketplaceComponents['schemas']['PlatformDefinition'];
export type PlatformProfessionalSchema = MarketplaceComponents['schemas']['PlatformProfessionalSchema'];

export async function fetchPlatforms(client: MarketplaceApiClient): Promise<PlatformDefinition[]> {
  const result = await client.GET('/platforms');

  if (result.error || !result.data?.data?.platforms) {
    throw new Error('Failed to load platform registry');
  }

  return result.data.data.platforms;
}

export async function fetchPlatformById(client: MarketplaceApiClient, platformId: string): Promise<PlatformDefinition> {
  const result = await client.GET('/platforms/{platform_id}', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load platform definition');
  }

  return result.data.data;
}

export async function resolvePlatformByHost(client: MarketplaceApiClient, host: string): Promise<PlatformDefinition> {
  const result = await client.GET('/platforms/resolve', {
    params: {
      query: {
        host,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to resolve platform from host');
  }

  return result.data.data;
}

export async function fetchProfessionalAttributeSchema(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<PlatformProfessionalSchema> {
  const result = await client.GET('/platforms/{platform_id}/professional-schema', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional schema');
  }

  return result.data.data;
}
