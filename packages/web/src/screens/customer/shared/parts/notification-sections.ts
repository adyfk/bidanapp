import type { NotificationItem } from '@marketplace/marketplace-core/notifications';

export function notificationSections(items: NotificationItem[]) {
  const todayKey = new Date().toDateString();
  return items.reduce(
    (acc, item) => {
      if (new Date(item.createdAt).toDateString() === todayKey) {
        acc.today.push(item);
      } else {
        acc.earlier.push(item);
      }
      return acc;
    },
    { earlier: [] as NotificationItem[], today: [] as NotificationItem[] },
  );
}
