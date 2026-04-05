'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { hydrateCustomerNotificationStateFromApi, syncCustomerNotificationStateToApi } from '@/lib/app-state-api';
import { hasCustomerAuthSessionHint, subscribeCustomerAuthSessionHint } from '@/lib/customer-auth-storage';
import { APP_ROUTES, activityRoute } from '@/lib/routes';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import type { Appointment } from '@/types/appointments';
import type { CustomerNotificationItem, CustomerNotificationState } from '@/types/notifications';

const customerNotificationEventName = 'bidanapp:customer-notification-change';
const relativeTimeThresholdDay = 24 * 60 * 60 * 1000;
const relativeTimeThresholdWeek = 7 * relativeTimeThresholdDay;
let cachedCustomerNotificationReadIds: string[] = [];

interface CustomerNotificationCopy {
  paymentPendingBody: (values: { price: string; service: string; time: string }) => string;
  paymentPendingTitle: string;
  profileReminderBody: string;
  profileReminderTitle: string;
  requestSubmittedBody: (values: { professional: string; service: string }) => string;
  requestSubmittedTitle: string;
  reviewReminderBody: (values: { professional: string; service: string }) => string;
  reviewReminderTitle: string;
  scheduleConfirmedBody: (values: { professional: string; service: string; time: string }) => string;
  scheduleConfirmedTitle: string;
  sessionInProgressBody: (values: { professional: string; service: string }) => string;
  sessionInProgressTitle: string;
  systemLabel: string;
}

const normalizeReadIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)));
};

const readCustomerNotificationIds = () => cachedCustomerNotificationReadIds;

const writeCustomerNotificationIds = (nextReadIds: string[]) => {
  cachedCustomerNotificationReadIds = normalizeReadIds(nextReadIds);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(customerNotificationEventName));
};

const persistReadNotificationIds = (nextReadIds: string[], syncBackend: boolean) => {
  const normalizedReadIds = normalizeReadIds(nextReadIds);
  writeCustomerNotificationIds(normalizedReadIds);

  if (syncBackend) {
    syncCustomerNotificationStateToApi({
      readIds: normalizedReadIds,
    });
  }
};

const isSameLocalDay = (leftDate: Date, rightDate: Date) =>
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

const formatNotificationTimeLabel = (value: string, locale: string) => {
  const notificationDate = new Date(value);

  if (Number.isNaN(notificationDate.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = notificationDate.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const formatLocale = locale === 'id' ? 'id-ID' : 'en-US';
  const relativeTime = new Intl.RelativeTimeFormat(formatLocale, {
    numeric: 'auto',
  });

  if (absDiffMs < relativeTimeThresholdDay) {
    const hourDelta = Math.round(diffMs / (60 * 60 * 1000));

    if (Math.abs(hourDelta) >= 1) {
      return relativeTime.format(hourDelta, 'hour');
    }

    const minuteDelta = Math.round(diffMs / (60 * 1000));
    return relativeTime.format(minuteDelta || -1, 'minute');
  }

  if (absDiffMs < relativeTimeThresholdWeek) {
    const dayDelta = Math.round(diffMs / relativeTimeThresholdDay);
    return relativeTime.format(dayDelta, 'day');
  }

  return new Intl.DateTimeFormat(formatLocale, {
    dateStyle: 'medium',
  }).format(notificationDate);
};

const getAppointmentNotificationTimestamp = (appointment: Appointment) =>
  appointment.timeline[appointment.timeline.length - 1]?.createdAt || appointment.requestedAt;

const buildAppointmentNotification = ({
  appointment,
  copy,
  formatTimeLabel,
}: {
  appointment: Appointment;
  copy: CustomerNotificationCopy;
  formatTimeLabel: (value: string) => string;
}): CustomerNotificationItem | null => {
  const notificationTimestamp = getAppointmentNotificationTimestamp(appointment);
  const section: CustomerNotificationItem['section'] = isSameLocalDay(new Date(notificationTimestamp), new Date())
    ? 'today'
    : 'earlier';
  const sharedFields = {
    href: activityRoute(appointment.id),
    id: `appointment:${appointment.id}:${appointment.status}:${notificationTimestamp}`,
    section,
    timeLabel: formatTimeLabel(notificationTimestamp),
  };

  if (appointment.status === 'awaiting_payment' || appointment.status === 'approved_waiting_payment') {
    return {
      ...sharedFields,
      actionKey: 'completePayment',
      body: copy.paymentPendingBody({
        price: appointment.totalPrice,
        service: appointment.service.name,
        time: appointment.time,
      }),
      isUnreadByDefault: true,
      title: copy.paymentPendingTitle,
      type: 'payment',
    };
  }

  if (appointment.status === 'requested') {
    return {
      ...sharedFields,
      actionKey: 'openActivity',
      body: copy.requestSubmittedBody({
        professional: appointment.professional.name,
        service: appointment.service.name,
      }),
      isUnreadByDefault: true,
      title: copy.requestSubmittedTitle,
      type: 'appointment',
    };
  }

  if (appointment.status === 'confirmed') {
    return {
      ...sharedFields,
      actionKey: 'openActivity',
      body: copy.scheduleConfirmedBody({
        professional: appointment.professional.name,
        service: appointment.service.name,
        time: appointment.time,
      }),
      isUnreadByDefault: true,
      title: copy.scheduleConfirmedTitle,
      type: 'appointment',
    };
  }

  if (appointment.status === 'in_service') {
    return {
      ...sharedFields,
      actionKey: 'replyNow',
      body: copy.sessionInProgressBody({
        professional: appointment.professional.name,
        service: appointment.service.name,
      }),
      isUnreadByDefault: true,
      title: copy.sessionInProgressTitle,
      type: 'message',
    };
  }

  if (appointment.status === 'completed' && !appointment.feedback) {
    return {
      ...sharedFields,
      actionKey: 'leaveReview',
      body: copy.reviewReminderBody({
        professional: appointment.professional.name,
        service: appointment.service.name,
      }),
      isUnreadByDefault: true,
      title: copy.reviewReminderTitle,
      type: 'appointment',
    };
  }

  return null;
};

export const useCustomerNotifications = () => {
  const locale = useLocale();
  const t = useTranslations('Notifications');
  const { customerAppointments } = useProfessionalPortal();
  const { favoriteProfessionalIds, isCustomLocation } = useProfessionalUserPreferences();
  const [readIds, setReadIds] = useState<string[]>(readCustomerNotificationIds);
  const [hasCustomerAuthSession, setHasCustomerAuthSession] = useState(() => hasCustomerAuthSessionHint());
  const hasLoadedBackendRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncReadIds = () => {
      setReadIds(readCustomerNotificationIds());
    };

    window.addEventListener(customerNotificationEventName, syncReadIds);
    const unsubscribeAuth = subscribeCustomerAuthSessionHint(() => {
      const nextHasCustomerAuthSession = hasCustomerAuthSessionHint();
      setHasCustomerAuthSession(nextHasCustomerAuthSession);

      if (!nextHasCustomerAuthSession) {
        writeCustomerNotificationIds([]);
      }
    });

    return () => {
      window.removeEventListener(customerNotificationEventName, syncReadIds);
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    hasLoadedBackendRef.current = hasCustomerAuthSession;
    if (!hasCustomerAuthSession) {
      writeCustomerNotificationIds([]);
      setReadIds([]);
      return;
    }

    let isCancelled = false;

    void hydrateCustomerNotificationStateFromApi().then((apiState) => {
      if (!apiState || isCancelled) {
        return;
      }

      const nextReadIds = normalizeReadIds(apiState.readIds);
      setReadIds(nextReadIds);
      writeCustomerNotificationIds(nextReadIds);
    });

    return () => {
      isCancelled = true;
    };
  }, [hasCustomerAuthSession]);

  const updateReadIds = (nextReadIds: string[]) => {
    const normalizedReadIds = normalizeReadIds(nextReadIds);
    setReadIds(normalizedReadIds);
    persistReadNotificationIds(normalizedReadIds, hasLoadedBackendRef.current);
  };

  const formatTimeLabel = (value: string) => formatNotificationTimeLabel(value, locale);
  const notificationCopy: CustomerNotificationCopy = {
    paymentPendingBody: (values) => t('items.paymentPendingBody', values),
    paymentPendingTitle: t('items.paymentPendingTitle'),
    profileReminderBody: t('items.profileReminderBody'),
    profileReminderTitle: t('items.profileReminderTitle'),
    requestSubmittedBody: (values) => t('items.requestSubmittedBody', values),
    requestSubmittedTitle: t('items.requestSubmittedTitle'),
    reviewReminderBody: (values) => t('items.reviewReminderBody', values),
    reviewReminderTitle: t('items.reviewReminderTitle'),
    scheduleConfirmedBody: (values) => t('items.scheduleConfirmedBody', values),
    scheduleConfirmedTitle: t('items.scheduleConfirmedTitle'),
    sessionInProgressBody: (values) => t('items.sessionInProgressBody', values),
    sessionInProgressTitle: t('items.sessionInProgressTitle'),
    systemLabel: t('labels.system'),
  };
  const appointmentNotifications = [...customerAppointments]
    .sort(
      (leftAppointment, rightAppointment) =>
        new Date(getAppointmentNotificationTimestamp(rightAppointment)).getTime() -
        new Date(getAppointmentNotificationTimestamp(leftAppointment)).getTime(),
    )
    .map((appointment) =>
      buildAppointmentNotification({
        appointment,
        copy: notificationCopy,
        formatTimeLabel,
      }),
    )
    .filter((notification): notification is CustomerNotificationItem => Boolean(notification));
  const profileReminderNeeded = favoriteProfessionalIds.length === 0 || !isCustomLocation;
  const notifications: CustomerNotificationState[] = [
    ...appointmentNotifications,
    ...(profileReminderNeeded
      ? [
          {
            actionKey: 'openProfile' as const,
            body: notificationCopy.profileReminderBody,
            href: APP_ROUTES.profile,
            id: 'customer:profile-reminder',
            isUnreadByDefault: false,
            section: 'earlier' as const,
            timeLabel: notificationCopy.systemLabel,
            title: notificationCopy.profileReminderTitle,
            type: 'account' as const,
          } satisfies CustomerNotificationItem,
        ]
      : []),
  ].map((notification) => ({
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
