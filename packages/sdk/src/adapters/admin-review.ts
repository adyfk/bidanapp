import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type ProfessionalApplicationReviewItem = MarketplaceComponents['schemas']['ProfessionalApplicationReviewItem'];
export type ReviewProfessionalApplicationInput =
  MarketplaceComponents['schemas']['ReviewProfessionalApplicationRequest'];

export async function fetchPlatformProfessionalApplications(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ applications: ProfessionalApplicationReviewItem[] }> {
  const result = await client.GET('/admin/platforms/{platform_id}/professional-applications', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional review queue');
  }

  return {
    applications: result.data.data.applications ?? [],
  };
}

export async function reviewPlatformProfessionalApplication(
  client: MarketplaceApiClient,
  platformId: string,
  applicationId: string,
  input: ReviewProfessionalApplicationInput,
): Promise<ProfessionalApplicationReviewItem> {
  const result = await client.POST('/admin/platforms/{platform_id}/professional-applications/{application_id}/review', {
    params: {
      path: {
        application_id: applicationId,
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to review professional application');
  }

  return result.data.data;
}
