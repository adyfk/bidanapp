import createClient from 'openapi-fetch';
import type { components, operations, paths } from './generated/types';

export type MarketplaceApiClient = ReturnType<typeof createMarketplaceApiClient>;
export type MarketplaceComponents = components;
export type MarketplaceOperations = operations;
export type MarketplacePaths = paths;

export function createMarketplaceApiClient(baseUrl: string) {
  return createClient<paths>({
    baseUrl,
    credentials: 'include',
  });
}
