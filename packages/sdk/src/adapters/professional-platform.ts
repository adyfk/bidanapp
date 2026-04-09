import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type ProfessionalPlatformWorkspace = MarketplaceComponents['schemas']['ProfessionalPlatformWorkspace'];
export type UpsertProfessionalPlatformApplicationInput =
  MarketplaceComponents['schemas']['UpsertProfessionalPlatformApplicationRequest'];

export async function fetchProfessionalPlatformWorkspace(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<ProfessionalPlatformWorkspace> {
  const result = await client.GET('/platforms/{platform_id}/professionals/me/onboarding', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional platform workspace');
  }

  return result.data.data;
}

export async function saveProfessionalPlatformApplication(
  client: MarketplaceApiClient,
  platformId: string,
  input: UpsertProfessionalPlatformApplicationInput,
): Promise<ProfessionalPlatformWorkspace> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/onboarding', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to save professional platform workspace');
  }

  return result.data.data;
}
