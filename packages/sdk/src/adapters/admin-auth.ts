import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type AdminAuthCreateSessionInput = MarketplaceComponents['schemas']['AdminAuthCreateSessionRequest'];
export type AdminAuthSession = MarketplaceComponents['schemas']['AdminAuthSessionData'];
export type AdminAuthSessionUpdateInput = MarketplaceComponents['schemas']['AdminAuthSessionUpdateRequest'];

export async function createAdminAuthSession(
  client: MarketplaceApiClient,
  input: AdminAuthCreateSessionInput,
): Promise<AdminAuthSession> {
  const result = await client.POST('/admin/auth/session', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create admin auth session');
  }

  return result.data.data;
}

export async function fetchAdminAuthSession(client: MarketplaceApiClient): Promise<AdminAuthSession> {
  const result = await client.GET('/admin/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin auth session');
  }

  return result.data.data;
}

export async function updateAdminAuthSession(
  client: MarketplaceApiClient,
  input: AdminAuthSessionUpdateInput,
): Promise<AdminAuthSession> {
  const result = await client.PUT('/admin/auth/session', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update admin auth session');
  }

  return result.data.data;
}

export async function deleteAdminAuthSession(client: MarketplaceApiClient): Promise<AdminAuthSession> {
  const result = await client.DELETE('/admin/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to delete admin auth session');
  }

  return result.data.data;
}
