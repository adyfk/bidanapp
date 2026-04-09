import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type NotificationItem = MarketplaceComponents['schemas']['NotificationItem'];

export async function fetchPlatformNotifications(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ items: NotificationItem[] }> {
  const result = await client.GET('/platforms/{platform_id}/notifications', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load platform notifications');
  }

  return {
    items: result.data.data.items ?? [],
  };
}
