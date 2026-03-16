'use client';

import { Bell, CalendarClock, CheckCheck, CreditCard, MessageCircleMore, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { CustomerAccessScreen } from '@/components/screens/CustomerAccessScreen';
import { ProfilePageHeader } from '@/features/profile/components/ProfilePagePrimitives';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { APP_ROUTES, professionalDashboardRoute } from '@/lib/routes';
import { useCustomerNotifications } from '@/lib/use-customer-notifications';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { CustomerNotificationState, CustomerNotificationType } from '@/types/notifications';

type NotificationFilter = 'all' | 'unread' | 'appointments' | 'messages';

const notificationTypeConfig: Record<
  CustomerNotificationType,
  {
    icon: typeof CalendarClock;
    iconClassName: string;
    tagClassName: string;
  }
> = {
  account: {
    icon: ShieldCheck,
    iconClassName: 'bg-blue-50 text-blue-600',
    tagClassName: 'bg-blue-50 text-blue-700',
  },
  appointment: {
    icon: CalendarClock,
    iconClassName: 'bg-pink-50 text-pink-600',
    tagClassName: 'bg-pink-50 text-pink-700',
  },
  message: {
    icon: MessageCircleMore,
    iconClassName: 'bg-violet-50 text-violet-600',
    tagClassName: 'bg-violet-50 text-violet-700',
  },
  payment: {
    icon: CreditCard,
    iconClassName: 'bg-amber-50 text-amber-600',
    tagClassName: 'bg-amber-50 text-amber-700',
  },
};

const isAppointmentNotification = (type: CustomerNotificationType) => type === 'appointment' || type === 'payment';

export const NotificationsScreen = () => {
  const router = useRouter();
  const t = useTranslations('Notifications');
  const { hasUnread, markAllAsRead, markAsRead, notifications, unreadCount } = useCustomerNotifications();
  const { isCustomer, isProfessional } = useViewerSession();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    if (isProfessional) {
      router.replace(professionalDashboardRoute('overview'));
    }
  }, [isProfessional, router]);

  if (isProfessional) {
    return null;
  }

  if (!isCustomer) {
    return <CustomerAccessScreen intent="notifications" nextHref={APP_ROUTES.notifications} />;
  }

  const filteredNotifications = notifications.filter((notification) => {
    switch (activeFilter) {
      case 'appointments':
        return isAppointmentNotification(notification.type);
      case 'messages':
        return notification.type === 'message';
      case 'unread':
        return notification.isUnread;
      default:
        return true;
    }
  });

  const todayNotifications = filteredNotifications.filter((notification) => notification.section === 'today');
  const earlierNotifications = filteredNotifications.filter((notification) => notification.section === 'earlier');

  const filterOptions: Array<{ id: NotificationFilter; label: string }> = [
    { id: 'all', label: t('filters.all') },
    { id: 'unread', label: t('filters.unread') },
    { id: 'appointments', label: t('filters.appointments') },
    { id: 'messages', label: t('filters.messages') },
  ];

  const openNotification = (notification: CustomerNotificationState) => {
    if (notification.isUnread) {
      markAsRead(notification.id);
    }

    router.push(notification.href);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-24 custom-scrollbar">
      <ProfilePageHeader onBack={() => router.back()} title={t('title')} />

      <div className="space-y-6 px-5 py-6">
        <section
          className="overflow-hidden rounded-[30px] p-5 text-white shadow-[0_24px_60px_-32px_rgba(190,24,93,0.55)]"
          style={{
            background: `linear-gradient(145deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.secondary} 100%)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                <Bell className="h-3.5 w-3.5" />
                {t('eyebrow')}
              </div>
              <h1 className="mt-4 text-[24px] font-bold leading-tight">{t('heroTitle')}</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-white/85">
                {hasUnread ? t('heroDescriptionUnread', { count: unreadCount }) : t('heroDescriptionClear')}
              </p>
            </div>

            {hasUnread ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-white/18"
              >
                <CheckCheck className="h-4 w-4" />
                {t('actions.markAllRead')}
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-white/15 bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                {t('summary.unread')}
              </p>
              <p className="mt-2 text-[28px] font-bold">{unreadCount}</p>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-white/12 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                {t('summary.total')}
              </p>
              <p className="mt-2 text-[28px] font-bold">{notifications.length}</p>
            </div>
          </div>
        </section>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 custom-scrollbar">
          {filterOptions.map((filter) => {
            const isActive = filter.id === activeFilter;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive ? 'text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600'
                }`}
                style={{ backgroundColor: isActive ? APP_CONFIG.colors.primary : undefined }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="space-y-5">
            {todayNotifications.length > 0 ? (
              <NotificationSection
                actionLabelResolver={(key) => t(`actions.${key}`)}
                items={todayNotifications}
                onOpen={openNotification}
                typeLabelResolver={(type) => t(`types.${type}`)}
                title={t('sections.today')}
                unreadLabel={t('badges.unread')}
              />
            ) : null}

            {earlierNotifications.length > 0 ? (
              <NotificationSection
                actionLabelResolver={(key) => t(`actions.${key}`)}
                items={earlierNotifications}
                onOpen={openNotification}
                typeLabelResolver={(type) => t(`types.${type}`)}
                title={t('sections.earlier')}
                unreadLabel={t('badges.unread')}
              />
            ) : null}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white px-5 py-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-[18px] font-bold text-gray-900">{t('empty.title')}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('empty.description')}</p>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="mt-5 rounded-full bg-gray-100 px-4 py-2.5 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              {t('empty.resetAction')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationSection = ({
  actionLabelResolver,
  items,
  onOpen,
  title,
  typeLabelResolver,
  unreadLabel,
}: {
  actionLabelResolver: (actionKey: CustomerNotificationState['actionKey']) => string;
  items: CustomerNotificationState[];
  onOpen: (notification: CustomerNotificationState) => void;
  title: string;
  typeLabelResolver: (type: CustomerNotificationType) => string;
  unreadLabel: string;
}) => (
  <section>
    <div className="mb-3 flex items-center justify-between px-1">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gray-400">{title}</h2>
      <span className="text-[12px] font-medium text-gray-400">{items.length}</span>
    </div>

    <div className="space-y-3">
      {items.map((notification) => {
        const config = notificationTypeConfig[notification.type];
        const Icon = config.icon;

        return (
          <article
            key={notification.id}
            className={`rounded-[26px] border bg-white p-4 shadow-sm transition-all ${
              notification.isUnread ? 'border-pink-100 shadow-pink-100/40' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${config.iconClassName}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.tagClassName}`}>
                    {typeLabelResolver(notification.type)}
                  </span>
                  {notification.isUnread ? (
                    <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-semibold text-pink-600">
                      {unreadLabel}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 text-[16px] font-bold leading-snug text-gray-900">{notification.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{notification.body}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[12px] font-medium text-gray-400">{notification.timeLabel}</span>
                  <button
                    type="button"
                    onClick={() => onOpen(notification)}
                    className="rounded-full bg-gray-100 px-4 py-2 text-[12px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    {actionLabelResolver(notification.actionKey)}
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);
