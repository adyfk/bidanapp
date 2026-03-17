'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { APP_ROUTES, professionalDashboardRequestsRoute, professionalDashboardRoute } from '@/lib/routes';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import type { ProfessionalNotificationState } from '@/types/notifications';

const professionalNotificationStorageKey = 'bidanapp:professional-notification-read-ids';
const professionalNotificationEventName = 'bidanapp:professional-notification-change';

const sanitizeStoredReadIds = (value: unknown): Record<string, string[]> => {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.length > 0)
      .map(([key, ids]) => [
        key,
        Array.from(new Set(Array.isArray(ids) ? ids.filter((item): item is string => typeof item === 'string') : [])),
      ]),
  );
};

const readStoredReadIds = (): Record<string, string[]> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(professionalNotificationStorageKey);

    if (!storedValue) {
      return {};
    }

    return sanitizeStoredReadIds(JSON.parse(storedValue));
  } catch {
    return {};
  }
};

const persistStoredReadIds = (nextValue: Record<string, string[]>) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(professionalNotificationStorageKey, JSON.stringify(sanitizeStoredReadIds(nextValue)));
  window.dispatchEvent(new Event(professionalNotificationEventName));
};

export const useProfessionalNotifications = () => {
  const t = useTranslations('ProfessionalPortal');
  const {
    activeCoverageAreas,
    activeReviewState,
    activeServiceConfigurations,
    getAreaLabel,
    getServiceLabel,
    portalState,
  } = useProfessionalPortal();
  const [storedReadIds, setStoredReadIds] = useState<Record<string, string[]>>(readStoredReadIds);
  const activeProfessionalId = portalState.activeProfessionalId;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncReadIds = () => {
      setStoredReadIds(readStoredReadIds());
    };

    window.addEventListener('storage', syncReadIds);
    window.addEventListener(professionalNotificationEventName, syncReadIds);

    return () => {
      window.removeEventListener('storage', syncReadIds);
      window.removeEventListener(professionalNotificationEventName, syncReadIds);
    };
  }, []);

  const notifications = useMemo<ProfessionalNotificationState[]>(() => {
    const requestNotifications = [...portalState.requestBoard]
      .sort((leftRequest, rightRequest) => {
        const leftUpdatedAt =
          leftRequest.statusHistory[leftRequest.statusHistory.length - 1]?.createdAt || leftRequest.requestedAt;
        const rightUpdatedAt =
          rightRequest.statusHistory[rightRequest.statusHistory.length - 1]?.createdAt || rightRequest.requestedAt;

        return new Date(rightUpdatedAt).getTime() - new Date(leftUpdatedAt).getTime();
      })
      .slice(0, 6)
      .map((request) => {
        const latestHistory = request.statusHistory[request.statusHistory.length - 1];
        const requestNotificationId = `request:${request.id}:${request.status}:${latestHistory?.createdAt || request.requestedAt}`;
        const sharedFields = {
          badgeLabel: t(`requests.priority.${request.priority}`),
          href: professionalDashboardRequestsRoute({
            requestId: request.id,
            status: request.status,
          }),
          id: requestNotificationId,
          isUrgent: request.priority === 'high',
          timeLabel: latestHistory?.createdAtLabel || request.requestedAtLabel,
        } as const;

        if (request.status === 'new') {
          return {
            ...sharedFields,
            actionKey: 'openRequestBoard' as const,
            body: t('notifications.items.newRequestBody', {
              area: getAreaLabel(request.areaId),
              service: getServiceLabel(request.serviceId),
            }),
            isUnreadByDefault: true,
            section: 'actionNeeded' as const,
            title: t('notifications.items.newRequestTitle', {
              client: request.clientName,
            }),
            type: 'request' as const,
          };
        }

        if (request.status === 'quoted') {
          return {
            ...sharedFields,
            actionKey: 'openRequestBoard' as const,
            body: t('notifications.items.quotedRequestBody', {
              client: request.clientName,
              service: getServiceLabel(request.serviceId),
            }),
            isUnreadByDefault: true,
            section: 'actionNeeded' as const,
            title: t('notifications.items.quotedRequestTitle'),
            type: 'request' as const,
          };
        }

        if (request.status === 'scheduled') {
          return {
            ...sharedFields,
            actionKey: 'openRequestBoard' as const,
            body: t('notifications.items.scheduledRequestBody', {
              client: request.clientName,
              service: getServiceLabel(request.serviceId),
            }),
            isUnreadByDefault: Boolean(latestHistory),
            section: 'monitoring' as const,
            title: t('notifications.items.scheduledRequestTitle'),
            type: 'schedule' as const,
          };
        }

        return {
          ...sharedFields,
          actionKey: 'openRequestBoard' as const,
          body: t('notifications.items.completedRequestBody', {
            client: request.clientName,
            service: getServiceLabel(request.serviceId),
          }),
          isUnreadByDefault: false,
          section: 'monitoring' as const,
          title: t('notifications.items.completedRequestTitle'),
          type: 'schedule' as const,
        };
      });
    const operationalNotifications = [];

    if (activeReviewState.status === 'submitted') {
      operationalNotifications.push({
        actionKey: 'reviewProfile' as const,
        body: t('notifications.items.reviewPendingBody'),
        href: professionalDashboardRoute('requests'),
        id: `operations:review-pending:${activeProfessionalId}`,
        isUnreadByDefault: true,
        section: 'monitoring' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.reviewPendingTitle'),
        type: 'operations' as const,
      });
    }

    if (activeReviewState.status === 'changes_requested') {
      operationalNotifications.push({
        actionKey: 'reviewProfile' as const,
        body: t('notifications.items.reviewChangesRequestedBody'),
        href: professionalDashboardRoute('requests'),
        id: `operations:review-changes:${activeProfessionalId}`,
        isUnreadByDefault: true,
        isUrgent: true,
        section: 'actionNeeded' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.reviewChangesRequestedTitle'),
        type: 'operations' as const,
      });
    }

    if (activeReviewState.status === 'verified') {
      operationalNotifications.push({
        actionKey: 'reviewProfile' as const,
        body: t('notifications.items.reviewVerifiedBody'),
        href: professionalDashboardRoute('requests'),
        id: `operations:review-verified:${activeProfessionalId}`,
        isUnreadByDefault: true,
        section: 'actionNeeded' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.reviewVerifiedTitle'),
        type: 'operations' as const,
      });
    }

    if (activeServiceConfigurations.length === 0) {
      operationalNotifications.push({
        actionKey: 'reviewServices' as const,
        body: t('notifications.items.servicesMissingBody'),
        href: professionalDashboardRoute('services'),
        id: `operations:services-empty:${activeProfessionalId}`,
        isUnreadByDefault: true,
        section: 'actionNeeded' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.servicesMissingTitle'),
        type: 'operations' as const,
      });
    } else if (!activeServiceConfigurations.some((service) => service.featured)) {
      operationalNotifications.push({
        actionKey: 'reviewServices' as const,
        body: t('notifications.items.featuredServiceBody'),
        href: professionalDashboardRoute('services'),
        id: `operations:services-featured:${activeProfessionalId}`,
        isUnreadByDefault: true,
        section: 'monitoring' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.featuredServiceTitle'),
        type: 'operations' as const,
      });
    }

    if (!portalState.acceptingNewClients) {
      operationalNotifications.push({
        actionKey: 'reviewCoverage' as const,
        body: t('notifications.items.acceptingPausedBody'),
        href: professionalDashboardRoute('coverage'),
        id: `operations:accepting-paused:${activeProfessionalId}`,
        isUnreadByDefault: false,
        section: 'monitoring' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.acceptingPausedTitle'),
        type: 'operations' as const,
      });
    }

    if (activeCoverageAreas.length === 0) {
      operationalNotifications.push({
        actionKey: 'reviewCoverage' as const,
        body: t('notifications.items.coverageMissingBody'),
        href: professionalDashboardRoute('coverage'),
        id: `operations:coverage-empty:${activeProfessionalId}`,
        isUnreadByDefault: true,
        section: 'actionNeeded' as const,
        timeLabel: t('notifications.labels.system'),
        title: t('notifications.items.coverageMissingTitle'),
        type: 'operations' as const,
      });
    }

    const activeReadIds = storedReadIds[activeProfessionalId] || [];

    return [...requestNotifications, ...operationalNotifications].map((notification) => ({
      ...notification,
      isUnread: notification.isUnreadByDefault && !activeReadIds.includes(notification.id),
    }));
  }, [
    activeCoverageAreas.length,
    activeProfessionalId,
    activeReviewState.status,
    activeServiceConfigurations,
    getAreaLabel,
    getServiceLabel,
    portalState.acceptingNewClients,
    portalState.requestBoard,
    storedReadIds,
    t,
  ]);

  const unreadNotifications = notifications.filter((notification) => notification.isUnread);

  const updateReadIds = (nextIds: string[]) => {
    const normalizedIds = Array.from(new Set(nextIds));
    const nextValue = sanitizeStoredReadIds({
      ...storedReadIds,
      [activeProfessionalId]: normalizedIds,
    });

    setStoredReadIds(nextValue);
    persistStoredReadIds(nextValue);
  };

  return {
    hasUnread: unreadNotifications.length > 0,
    markAllAsRead: () =>
      updateReadIds([...(storedReadIds[activeProfessionalId] || []), ...unreadNotifications.map((item) => item.id)]),
    markAsRead: (notificationId: string) => {
      const activeIds = storedReadIds[activeProfessionalId] || [];

      if (activeIds.includes(notificationId)) {
        return;
      }

      updateReadIds([...activeIds, notificationId]);
    },
    notifications,
    route: APP_ROUTES.professionalNotifications,
    unreadCount: unreadNotifications.length,
  };
};
