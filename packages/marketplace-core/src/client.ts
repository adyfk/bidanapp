import {
  createMarketplaceApiClient as createSdkMarketplaceApiClient,
  type MarketplaceApiClient,
} from '@marketplace/sdk';

export function getMarketplaceApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://api.lvh.me:8080/api/v1';
}

export function getMarketplaceApiOrigin() {
  return getMarketplaceApiBaseUrl().replace(/\/api\/v1\/?$/, '');
}

export function getMarketplaceSiteUrl(fallback = '') {
  return process.env.NEXT_PUBLIC_SITE_URL ?? fallback;
}

export function createMarketplaceApiClient(baseUrl = getMarketplaceApiBaseUrl()): MarketplaceApiClient {
  return createSdkMarketplaceApiClient(baseUrl);
}

let sharedMarketplaceClient: MarketplaceApiClient | null = null;

export function getMarketplaceApiClient() {
  if (!sharedMarketplaceClient) {
    sharedMarketplaceClient = createMarketplaceApiClient();
  }
  return sharedMarketplaceClient;
}

export type { MarketplaceApiClient };
