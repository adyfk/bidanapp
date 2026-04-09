import { fetchPlatformNotifications, type NotificationItem } from '@marketplace/sdk';
import { formatDateTime, notificationKindLabel } from './formatters';

export interface NotificationFeedVM {
  createdAtLabel: string;
  id: string;
  kindLabel: string;
  message: string;
  title: string;
}

export interface NotificationFeedController {
  fetchNotifications: typeof fetchPlatformNotifications;
}

export function mapNotificationToFeedVM(item: NotificationItem, locale: string): NotificationFeedVM {
  return {
    createdAtLabel: formatDateTime(item.createdAt, locale),
    id: item.id,
    kindLabel: notificationKindLabel(item.kind, locale),
    message: item.message,
    title: item.title,
  };
}

export function createNotificationFeedController(): NotificationFeedController {
  return {
    fetchNotifications: fetchPlatformNotifications,
  };
}

export type { NotificationItem };
export { fetchPlatformNotifications };
