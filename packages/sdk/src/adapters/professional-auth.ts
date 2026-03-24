import type { BidanappApiClient, BidanappComponents } from '../client';

export type ProfessionalAuthCreateSessionInput = BidanappComponents['schemas']['ProfessionalAuthCreateSessionRequest'];
export type ProfessionalAuthRegisterInput = BidanappComponents['schemas']['ProfessionalAuthRegisterRequest'];
export type ProfessionalAuthSession = BidanappComponents['schemas']['ProfessionalAuthSessionData'];
export type ProfessionalAuthUpdateAccountInput = BidanappComponents['schemas']['ProfessionalAuthUpdateAccountRequest'];
export type ProfessionalAuthUpdatePasswordInput =
  BidanappComponents['schemas']['ProfessionalAuthUpdatePasswordRequest'];
export type ProfessionalAuthPasswordRecoveryInput =
  BidanappComponents['schemas']['ProfessionalAuthRequestPasswordRecoveryRequest'];
export type ProfessionalAuthPasswordRecoveryState =
  BidanappComponents['schemas']['ProfessionalAuthPasswordRecoveryData'];

export async function createProfessionalAuthSession(
  client: BidanappApiClient,
  input: ProfessionalAuthCreateSessionInput,
): Promise<ProfessionalAuthSession> {
  const result = await client.POST('/professionals/auth/session', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create professional auth session');
  }

  return result.data.data;
}

export async function registerProfessionalAuthAccount(
  client: BidanappApiClient,
  input: ProfessionalAuthRegisterInput,
): Promise<ProfessionalAuthSession> {
  const result = await client.POST('/professionals/auth/register', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to register professional account');
  }

  return result.data.data;
}

export async function fetchProfessionalAuthSession(client: BidanappApiClient): Promise<ProfessionalAuthSession> {
  const result = await client.GET('/professionals/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional auth session');
  }

  return result.data.data;
}

export async function updateProfessionalAuthAccount(
  client: BidanappApiClient,
  input: ProfessionalAuthUpdateAccountInput,
): Promise<ProfessionalAuthSession> {
  const result = await client.PUT('/professionals/auth/account', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional account');
  }

  return result.data.data;
}

export async function updateProfessionalAuthPassword(
  client: BidanappApiClient,
  input: ProfessionalAuthUpdatePasswordInput,
): Promise<ProfessionalAuthSession> {
  const result = await client.PUT('/professionals/auth/password', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update professional password');
  }

  return result.data.data;
}

export async function requestProfessionalPasswordRecovery(
  client: BidanappApiClient,
  input: ProfessionalAuthPasswordRecoveryInput,
): Promise<ProfessionalAuthPasswordRecoveryState> {
  const result = await client.POST('/professionals/auth/password-recovery', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to request professional password recovery');
  }

  return result.data.data;
}

export async function deleteProfessionalAuthSession(client: BidanappApiClient): Promise<ProfessionalAuthSession> {
  const result = await client.DELETE('/professionals/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to delete professional auth session');
  }

  return result.data.data;
}
