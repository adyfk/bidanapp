'use client';

import { useEffect, useState } from 'react';
import { CUSTOMER_NOTIFICATIONS } from '@/lib/mock-db/notifications';
import type { CustomerNotificationState } from '@/types/notifications';

const customerNotificationStorageKey = 'bidanapp:customer-notification-read-ids';
const customerNotificationEventName = 'bidanapp:customer-notification-change';

const normalizeReadIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)));
};

const readStoredNotificationIds = (): string[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(customerNotificationStorageKey);

    if (!storedValue) {
      return [];
    }

    return normalizeReadIds(JSON.parse(storedValue));
  } catch {
    return [];
  }
};

const persistReadNotificationIds = (nextReadIds: string[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedReadIds = normalizeReadIds(nextReadIds);
  window.localStorage.setItem(customerNotificationStorageKey, JSON.stringify(normalizedReadIds));
  window.dispatchEvent(new Event(customerNotificationEventName));
};

export const useCustomerNotifications = () => {
  const [readIds, setReadIds] = useState<string[]>(readStoredNotificationIds);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncReadIds = () => {
      setReadIds(readStoredNotificationIds());
    };

    window.addEventListener('storage', syncReadIds);
    window.addEventListener(customerNotificationEventName, syncReadIds);

    return () => {
      window.removeEventListener('storage', syncReadIds);
      window.removeEventListener(customerNotificationEventName, syncReadIds);
    };
  }, []);

  const updateReadIds = (nextReadIds: string[]) => {
    const normalizedReadIds = normalizeReadIds(nextReadIds);
    setReadIds(normalizedReadIds);
    persistReadNotificationIds(normalizedReadIds);
  };

  const notifications: CustomerNotificationState[] = CUSTOMER_NOTIFICATIONS.map((notification) => ({
    ...notification,
    isUnread: notification.isUnreadByDefault && !readIds.includes(notification.id),
  }));

  const unreadNotifications = notifications.filter((notification) => notification.isUnread);

  return {
    hasUnread: unreadNotifications.length > 0,
    markAllAsRead: () => updateReadIds([...readIds, ...unreadNotifications.map((notification) => notification.id)]),
    markAsRead: (notificationId: string) => {
      if (readIds.includes(notificationId)) {
        return;
      }

      updateReadIds([...readIds, notificationId]);
    },
    notifications,
    unreadCount: unreadNotifications.length,
  };
};
