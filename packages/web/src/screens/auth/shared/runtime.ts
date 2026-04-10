'use client';

import { createMarketplaceApiClient } from '@marketplace/marketplace-core/client';
import { getServicePlatformConfig, type ServicePlatformId } from '@marketplace/platform-config';
import { getApiBaseUrl } from '../../../lib/env';

const apiBaseUrl = getApiBaseUrl();

export const viewerAuthClient = createMarketplaceApiClient(apiBaseUrl);

export function authContext(platformId?: ServicePlatformId, isHub?: boolean) {
  if (platformId) {
    return getServicePlatformConfig(platformId);
  }
  if (isHub) {
    return null;
  }
  return null;
}
