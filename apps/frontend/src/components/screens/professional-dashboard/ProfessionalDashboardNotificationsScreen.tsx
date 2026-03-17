'use client';

import { ArrowRight, Bell, CheckCheck, ClipboardList, Layers3, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { surfaceCardPaddedClass } from '@/components/ui/tokens';
import { ProfilePageHeader } from '@/features/profile/components/ProfilePagePrimitives';
import { useRouter } from '@/i18n/routing';
import { useProfessionalNotifications } from '@/lib/use-professional-notifications';
import type { ProfessionalNotificationState, ProfessionalNotificationType } from '@/types/notifications';
import { MiniStatCard, SectionHeading } from './ProfessionalDashboardShared';
import { useProfessionalDashboardPageData } from './useProfessionalDashboardPageData';

type NotificationFilter = 'all' | 'unread' | 'requests' | 'operations';

const notificationTypeStyles: Record<
  ProfessionalNotificationType,
  {
    icon: typeof ClipboardList;
    iconClassName: string;
    tagClassName: string;
  }
> = {
  operations: {
    icon: Layers3,
    iconClassName: 'bg-blue-50 text-blue-600',
    tagClassName: 'bg-blue-50 text-blue-700',
  },
  request: {
    icon: ClipboardList,
    iconClassName: 'bg-rose-50 text-rose-600',
    tagClassName: 'bg-rose-50 text-rose-700',
  },
  schedule: {
    icon: Wallet,
    iconClassName: 'bg-amber-50 text-amber-600',
    tagClassName: 'bg-amber-50 text-amber-700',
  },
};

export const ProfessionalDashboardNotificationsScreen = () => {
  const router = useRouter();
  const t = useTranslations('ProfessionalPortal');
  const { activeProfessional, hasMounted, isProfessional } = useProfessionalDashboardPageData();
  const { hasUnread, markAllAsRead, markAsRead, notifications, unreadCount } = useProfessionalNotifications();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  if (!activeProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  const filteredNotifications = notifications.filter((notification) => {
    switch (activeFilter) {
      case 'operations':
        return notification.type === 'operations';
      case 'requests':
        return notification.type === 'request' || notification.type === 'schedule';
      case 'unread':
        return notification.isUnread;
      default:
        return true;
    }
  });
  const actionNeededNotifications = filteredNotifications.filter(
    (notification) => notification.section === 'actionNeeded',
  );
  const monitoringNotifications = filteredNotifications.filter((notification) => notification.section === 'monitoring');
  const requestNotificationCount = notifications.filter(
    (notification) => notification.type === 'request' || notification.type === 'schedule',
  ).length;
  const operationalNotificationCount = notifications.filter(
    (notification) => notification.type === 'operations',
  ).length;
  const filterOptions: Array<{ id: NotificationFilter; label: string }> = [
    { id: 'all', label: t('notifications.filters.all') },
    { id: 'unread', label: t('notifications.filters.unread') },
    { id: 'requests', label: t('notifications.filters.requests') },
    { id: 'operations', label: t('notifications.filters.operations') },
  ];

  const openNotification = (notification: ProfessionalNotificationState) => {
    if (notification.isUnread) {
      markAsRead(notification.id);
    }

    router.push(notification.href);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-10 custom-scrollbar">
      <ProfilePageHeader
        onBack={() => router.back()}
        title={t('notifications.title')}
        rightSlot={
          hasUnread ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-slate-800"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>{t('notifications.actions.markAllRead')}</span>
            </button>
          ) : (
            <div className="w-10" />
          )
        }
      />

      <div className="space-y-5 px-5 py-5">
        <section className={surfaceCardPaddedClass}>
          <SectionHeading
            icon={<Bell className="h-5 w-5" />}
            eyebrow={t('notifications.eyebrow')}
            title={activeProfessional.name}
            description={
              hasUnread
                ? t('notifications.heroDescriptionUnread', { count: unreadCount })
                : t('notifications.heroDescriptionClear')
            }
          />
        </section>

        <section className="grid grid-cols-3 gap-3">
          <MiniStatCard label={t('notifications.summary.unread')} value={String(unreadCount)} />
          <MiniStatCard label={t('notifications.summary.requests')} value={String(requestNotificationCount)} />
          <MiniStatCard label={t('notifications.summary.operations')} value={String(operationalNotificationCount)} />
        </section>

        <div className="flex gap-2 overflow-x-auto px-0.5 pb-1 custom-scrollbar">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="space-y-5">
            {actionNeededNotifications.length > 0 ? (
              <ProfessionalNotificationSection
                actionLabelResolver={(actionKey) => t(`notifications.actions.${actionKey}`)}
                items={actionNeededNotifications}
                onOpen={openNotification}
                sectionTitle={t('notifications.sections.actionNeeded')}
                typeLabelResolver={(type) => t(`notifications.types.${type}`)}
                unreadLabel={t('notifications.badges.unread')}
                urgentLabel={t('notifications.badges.urgent')}
              />
            ) : null}

            {monitoringNotifications.length > 0 ? (
              <ProfessionalNotificationSection
                actionLabelResolver={(actionKey) => t(`notifications.actions.${actionKey}`)}
                items={monitoringNotifications}
                onOpen={openNotification}
                sectionTitle={t('notifications.sections.monitoring')}
                typeLabelResolver={(type) => t(`notifications.types.${type}`)}
                unreadLabel={t('notifications.badges.unread')}
                urgentLabel={t('notifications.badges.urgent')}
              />
            ) : null}
          </div>
        ) : (
          <div className={surfaceCardPaddedClass}>
            <SectionHeading
              icon={<Bell className="h-5 w-5" />}
              title={t('notifications.emptyTitle')}
              description={t('notifications.emptyDescription')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ProfessionalNotificationSection = ({
  actionLabelResolver,
  items,
  onOpen,
  sectionTitle,
  typeLabelResolver,
  unreadLabel,
  urgentLabel,
}: {
  actionLabelResolver: (actionKey: ProfessionalNotificationState['actionKey']) => string;
  items: ProfessionalNotificationState[];
  onOpen: (notification: ProfessionalNotificationState) => void;
  sectionTitle: string;
  typeLabelResolver: (type: ProfessionalNotificationState['type']) => string;
  unreadLabel: string;
  urgentLabel: string;
}) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">{sectionTitle}</h2>
      <span className="text-[12px] font-medium text-slate-400">{items.length}</span>
    </div>

    {items.map((notification) => {
      const style = notificationTypeStyles[notification.type];
      const Icon = style.icon;

      return (
        <article
          key={notification.id}
          className={`rounded-[24px] border bg-white p-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)] ${
            notification.isUnread ? 'border-blue-200' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[16px] ${style.iconClassName}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.tagClassName}`}>
                  {typeLabelResolver(notification.type)}
                </span>
                {notification.badgeLabel ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {notification.badgeLabel}
                  </span>
                ) : null}
                {notification.isUnread ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                    {unreadLabel}
                  </span>
                ) : null}
                {notification.isUrgent ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
                    {urgentLabel}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 text-[16px] font-bold leading-snug text-slate-900">{notification.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{notification.body}</p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium text-slate-400">{notification.timeLabel}</span>
                <button
                  type="button"
                  onClick={() => onOpen(notification)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-slate-800"
                >
                  <span>{actionLabelResolver(notification.actionKey)}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </article>
      );
    })}
  </section>
);
