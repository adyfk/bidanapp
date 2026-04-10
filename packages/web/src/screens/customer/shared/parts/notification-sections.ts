import type { NotificationItem } from '@marketplace/marketplace-core/notifications';

export interface MarketplaceNotificationSection {
  emphasized: boolean;
  items: NotificationItem[];
  key: 'attention' | 'recent' | 'archive';
  title: string;
}

function needsImmediateAttention(item: NotificationItem) {
  return item.kind === 'payment' || item.kind === 'support';
}

export function notificationSections(items: NotificationItem[]) {
  const todayKey = new Date().toDateString();
  const grouped = items.reduce(
    (acc, item) => {
      if (needsImmediateAttention(item)) {
        acc.attention.push(item);
        return acc;
      }
      if (new Date(item.createdAt).toDateString() === todayKey) {
        acc.recent.push(item);
        return acc;
      }
      acc.archive.push(item);
      return acc;
    },
    {
      archive: [] as NotificationItem[],
      attention: [] as NotificationItem[],
      recent: [] as NotificationItem[],
    },
  );

  return [
    {
      emphasized: true,
      items: grouped.attention,
      key: 'attention' as const,
      title: 'Perlu aksi',
    },
    {
      emphasized: true,
      items: grouped.recent,
      key: 'recent' as const,
      title: 'Terbaru',
    },
    {
      emphasized: false,
      items: grouped.archive,
      key: 'archive' as const,
      title: 'Arsip',
    },
  ].filter((section) => section.items.length > 0);
}
