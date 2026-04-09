import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type CreateProfessionalDocumentUploadTokenInput =
  MarketplaceComponents['schemas']['IssueProfessionalDocumentUploadRequest'];
export type ProfessionalDocumentUploadToken = MarketplaceComponents['schemas']['ProfessionalDocumentUploadToken'];
export type ProfessionalWorkspaceSnapshot = MarketplaceComponents['schemas']['ProfessionalWorkspaceSnapshot'];
export type ProfessionalOrderSummary = MarketplaceComponents['schemas']['ProfessionalOrderSummary'];
export type ReplaceProfessionalAvailabilityInput =
  MarketplaceComponents['schemas']['ReplaceProfessionalAvailabilityRequest'];
export type ReplaceProfessionalCoverageInput = MarketplaceComponents['schemas']['ReplaceProfessionalCoverageRequest'];
export type ReplaceProfessionalPortfolioInput = MarketplaceComponents['schemas']['ReplaceProfessionalPortfolioRequest'];
export type ReplaceProfessionalTrustInput = MarketplaceComponents['schemas']['ReplaceProfessionalTrustRequest'];
export type UpdateProfessionalNotificationPreferencesInput =
  MarketplaceComponents['schemas']['UpdateProfessionalNotificationPreferencesRequest'];
export type UpsertProfessionalWorkspaceProfileInput =
  MarketplaceComponents['schemas']['UpsertProfessionalWorkspaceProfileRequest'];

export async function fetchProfessionalWorkspaceSnapshot(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.GET('/platforms/{platform_id}/professionals/me/workspace', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional workspace snapshot');
  }

  return result.data.data;
}

export async function fetchProfessionalWorkspaceOrders(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ orders: ProfessionalOrderSummary[] }> {
  const result = await client.GET('/platforms/{platform_id}/professionals/me/workspace/orders', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional workspace orders');
  }

  return {
    orders: result.data.data.orders ?? [],
  };
}

export async function upsertProfessionalWorkspaceProfile(
  client: MarketplaceApiClient,
  platformId: string,
  input: UpsertProfessionalWorkspaceProfileInput,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/workspace/profile', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional workspace profile');
  }

  return result.data.data;
}

export async function replaceProfessionalWorkspacePortfolio(
  client: MarketplaceApiClient,
  platformId: string,
  input: ReplaceProfessionalPortfolioInput,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/workspace/portfolio', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional portfolio workspace');
  }

  return result.data.data;
}

export async function replaceProfessionalWorkspaceTrust(
  client: MarketplaceApiClient,
  platformId: string,
  input: ReplaceProfessionalTrustInput,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/workspace/trust', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional trust workspace');
  }

  return result.data.data;
}

export async function replaceProfessionalWorkspaceCoverage(
  client: MarketplaceApiClient,
  platformId: string,
  input: ReplaceProfessionalCoverageInput,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/workspace/coverage', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional coverage workspace');
  }

  return result.data.data;
}

export async function replaceProfessionalWorkspaceAvailability(
  client: MarketplaceApiClient,
  platformId: string,
  input: ReplaceProfessionalAvailabilityInput,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/workspace/availability', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional availability workspace');
  }

  return result.data.data;
}

export async function updateProfessionalWorkspaceNotifications(
  client: MarketplaceApiClient,
  platformId: string,
  input: UpdateProfessionalNotificationPreferencesInput,
): Promise<ProfessionalWorkspaceSnapshot> {
  const result = await client.PUT('/platforms/{platform_id}/professionals/me/workspace/notifications', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional notification preferences');
  }

  return result.data.data;
}

export async function issueProfessionalDocumentUploadToken(
  client: MarketplaceApiClient,
  platformId: string,
  input: CreateProfessionalDocumentUploadTokenInput,
): Promise<ProfessionalDocumentUploadToken> {
  const result = await client.POST('/platforms/{platform_id}/professionals/me/documents/upload-token', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to issue professional document upload token');
  }

  return result.data.data;
}
