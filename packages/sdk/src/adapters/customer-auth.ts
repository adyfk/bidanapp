import type { BidanappApiClient, BidanappComponents } from '../client';

export type CustomerAuthCreateSessionInput = BidanappComponents['schemas']['CustomerAuthCreateSessionRequest'];
export type CustomerAuthRegisterInput = BidanappComponents['schemas']['CustomerAuthRegisterRequest'];
export type CustomerAuthSession = BidanappComponents['schemas']['CustomerAuthSessionData'];
export type CustomerAuthUpdateAccountInput = BidanappComponents['schemas']['CustomerAuthUpdateAccountRequest'];
export type CustomerAuthUpdatePasswordInput = BidanappComponents['schemas']['CustomerAuthUpdatePasswordRequest'];

export async function createCustomerAuthSession(
  client: BidanappApiClient,
  input: CustomerAuthCreateSessionInput,
): Promise<CustomerAuthSession> {
  const result = await client.POST('/customers/auth/session', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create customer auth session');
  }

  return result.data.data;
}

export async function registerCustomerAuthAccount(
  client: BidanappApiClient,
  input: CustomerAuthRegisterInput,
): Promise<CustomerAuthSession> {
  const result = await client.POST('/customers/auth/register', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to register customer account');
  }

  return result.data.data;
}

export async function fetchCustomerAuthSession(client: BidanappApiClient): Promise<CustomerAuthSession> {
  const result = await client.GET('/customers/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer auth session');
  }

  return result.data.data;
}

export async function updateCustomerAuthAccount(
  client: BidanappApiClient,
  input: CustomerAuthUpdateAccountInput,
): Promise<CustomerAuthSession> {
  const result = await client.PUT('/customers/auth/account', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update customer account');
  }

  return result.data.data;
}

export async function updateCustomerAuthPassword(
  client: BidanappApiClient,
  input: CustomerAuthUpdatePasswordInput,
): Promise<CustomerAuthSession> {
  const result = await client.PUT('/customers/auth/password', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update customer password');
  }

  return result.data.data;
}

export async function deleteCustomerAuthSession(client: BidanappApiClient): Promise<CustomerAuthSession> {
  const result = await client.DELETE('/customers/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to delete customer auth session');
  }

  return result.data.data;
}
