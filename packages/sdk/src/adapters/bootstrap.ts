import type { BidanappApiClient, BidanappComponents } from '../client';

export type PublicBootstrap = BidanappComponents['schemas']['BootstrapData'];

export async function fetchPublicBootstrap(client: BidanappApiClient): Promise<PublicBootstrap> {
  const result = await client.GET('/bootstrap');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load public bootstrap');
  }

  return result.data.data;
}
