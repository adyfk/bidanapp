import { getMarketplaceApiBaseUrl, type ViewerSession } from '@marketplace/marketplace-core';
import { headers } from 'next/headers';

export async function fetchViewerSessionServer(): Promise<ViewerSession | null> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie');

  try {
    const response = await fetch(`${getMarketplaceApiBaseUrl()}/auth/session`, {
      cache: 'no-store',
      headers: cookie ? { cookie } : {},
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: ViewerSession };
    return payload.data ?? null;
  } catch {
    return null;
  }
}
