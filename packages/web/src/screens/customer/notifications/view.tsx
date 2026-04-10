'use client';

import { createMarketplaceApiClient } from '@marketplace/marketplace-core/client';
import type { NotificationItem } from '@marketplace/marketplace-core/notifications';
import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import type { ServicePlatformId } from '@marketplace/platform-config';
import { getServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceEmptyCard,
  MarketplaceFeaturePill,
  MarketplaceFilterChip,
  MarketplaceMobileShell,
  MarketplaceNotificationGroup,
  MarketplaceStatusFilters,
} from '@marketplace/ui/marketplace-lite';
import { MessageBanner } from '@marketplace/ui/primitives';
import { Bell, CalendarClock, CreditCard, LifeBuoy, MessageCircleMore, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { getApiBaseUrl } from '../../../lib/env';
import { formatDateTime, notificationKindLabel } from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { CustomerAccessLock } from '../shared/parts/access-lock';
import { notificationSections } from '../shared/parts/notification-sections';
import { MarketplaceStickyPageHeader } from '../shared/parts/page-header';
import { useCustomerMarketplaceController } from '../shared/use-customer-marketplace-controller';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

type NotificationFilter = 'all' | 'message' | 'order' | 'payment' | 'support';

function resolveNotificationHref(locale: string, item: NotificationItem) {
  if (item.kind === 'support') {
    return createLocalizedPath(locale, '/support');
  }
  if (item.kind === 'order' || item.kind === 'payment' || item.kind === 'message') {
    return createLocalizedPath(locale, `/orders/${item.entityId}`);
  }
  return createLocalizedPath(locale, '/notifications');
}

export function CustomerNotificationsPage({
  authHref,
  initialSession,
  locale,
  platformId,
}: {
  authHref: string;
  initialSession?: ViewerSession | null;
  locale: string;
  platformId: ServicePlatformId;
}) {
  const customerController = useCustomerMarketplaceController();
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [feedback, setFeedback] = useState('');
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    void (async () => {
      try {
        const sessionPayload = await customerController.viewerAuth.fetchSession(client);
        setSession(sessionPayload);
        if (!sessionPayload.isAuthenticated) {
          return;
        }
        const payload = await customerController.notifications.fetchNotifications(client, platformId);
        setItems(payload.items);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Gagal memuat notifikasi.');
      }
    })();
  }, [customerController.notifications, customerController.viewerAuth, platformId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => (activeFilter === 'all' ? true : item.kind === activeFilter));
  }, [activeFilter, items]);

  const sections = notificationSections(filteredItems);
  const attentionCount = items.filter((item) => item.kind === 'payment' || item.kind === 'support').length;
  const todayCount = items.filter(
    (item) => new Date(item.createdAt).toDateString() === new Date().toDateString(),
  ).length;
  const archivedCount = Math.max(items.length - attentionCount - todayCount, 0);

  const iconForNotification = (kind: NotificationItem['kind']) => {
    if (kind === 'payment') {
      return {
        icon: <CreditCard className="h-5 w-5" />,
        iconClassName: 'bg-rose-50 text-rose-600',
        tagClassName: 'bg-rose-50 text-rose-700',
      };
    }
    if (kind === 'support') {
      return {
        icon: <LifeBuoy className="h-5 w-5" />,
        iconClassName: 'bg-pink-50 text-pink-700',
        tagClassName: 'bg-pink-50 text-pink-700',
      };
    }
    if (kind === 'message') {
      return {
        icon: <MessageCircleMore className="h-5 w-5" />,
        iconClassName: 'bg-fuchsia-50 text-fuchsia-700',
        tagClassName: 'bg-fuchsia-50 text-fuchsia-700',
      };
    }
    if (kind === 'order') {
      return {
        icon: <CalendarClock className="h-5 w-5" />,
        iconClassName: 'bg-rose-100 text-rose-700',
        tagClassName: 'bg-rose-100 text-rose-700',
      };
    }
    return {
      icon: <ShieldCheck className="h-5 w-5" />,
      iconClassName: 'bg-rose-50 text-rose-600',
      tagClassName: 'bg-rose-50 text-rose-700',
    };
  };

  const renderNotificationCard = (item: NotificationItem, emphasized: boolean) => {
    const config = iconForNotification(item.kind);
    return (
      <a href={resolveNotificationHref(locale, item)} key={item.id}>
        <article
          className={`rounded-[26px] border bg-white p-4 shadow-sm transition-all hover:bg-gray-50/70 ${
            emphasized ? 'shadow-[0_18px_40px_-30px_rgba(88,49,66,0.16)]' : ''
          }`}
          style={{
            background: emphasized
              ? 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 44%, white) 100%)'
              : '#ffffff',
            borderColor: emphasized ? 'var(--ui-border-strong)' : 'var(--ui-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${config.iconClassName}`}
            >
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.tagClassName}`}>
                  {notificationKindLabel(item.kind, locale)}
                </span>
                <span className="text-[11px] font-medium text-gray-400">{formatDateTime(item.createdAt, locale)}</span>
              </div>
              <h3 className="mt-3 text-[15px] font-bold break-words text-gray-900 [overflow-wrap:anywhere]">
                {item.title}
              </h3>
              <p className="mt-2 break-words text-[13px] leading-6 text-gray-500 [overflow-wrap:anywhere]">
                {item.message}
              </p>
            </div>
          </div>
        </article>
      </a>
    );
  };

  return (
    <MarketplaceMobileShell
      navItems={createPrimaryMarketplaceNav(getServicePlatformConfig(platformId), locale)}
      showNav={Boolean(session?.isAuthenticated)}
    >
      <div className="min-h-full pb-24" style={{ backgroundColor: 'var(--ui-background)' }}>
        <MarketplaceStickyPageHeader backHref={createLocalizedPath(locale)} title="Notifikasi" />

        <div className="space-y-5 px-5 py-5">
          {!session?.isAuthenticated ? (
            <CustomerAccessLock
              authHref={authHref}
              description="Masuk untuk melihat update order, pembayaran, dan pesan penting."
              icon={<Bell className="h-5 w-5" />}
              title="Feed notifikasi belum tersedia"
            />
          ) : (
            <>
              <section
                className="overflow-hidden rounded-[30px] border p-5 text-white"
                style={{
                  background: 'var(--ui-hero-gradient)',
                  borderColor: 'color-mix(in srgb, var(--ui-border-strong) 42%, white)',
                  boxShadow: 'var(--ui-shadow-hero)',
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                      <Bell className="h-3.5 w-3.5" />
                      Feed
                    </div>
                    <h1 className="mt-4 text-[24px] font-bold leading-tight text-white">
                      Prioritas customer dalam satu layar
                    </h1>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/85">
                      Order, pembayaran, support, dan pesan penting dikelompokkan supaya lebih cepat dipindai.
                    </p>
                  </div>
                  <MarketplaceFeaturePill tone="soft">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{activeFilter === 'all' ? 'Semua kanal' : `Filter ${activeFilter}`}</span>
                  </MarketplaceFeaturePill>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-[22px] border border-white/15 bg-white/12 p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/86">Perlu aksi</p>
                    <p className="mt-2 text-[24px] font-bold text-white">{attentionCount}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/15 bg-white/12 p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/86">Terbaru</p>
                    <p className="mt-2 text-[24px] font-bold text-white">{todayCount}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/15 bg-white/12 p-4 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/86">Arsip</p>
                    <p className="mt-2 text-[24px] font-bold text-white">{archivedCount}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/15 bg-white/10 px-4 py-3 text-[12px] leading-6 text-white/84">
                  Fokus utama ada di pembayaran dan support, sementara update order dan pesan lain tetap tersusun rapi
                  di bawahnya.
                </div>
              </section>

              <MarketplaceStatusFilters>
                <MarketplaceFilterChip active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                  Semua
                </MarketplaceFilterChip>
                <MarketplaceFilterChip active={activeFilter === 'order'} onClick={() => setActiveFilter('order')}>
                  Order
                </MarketplaceFilterChip>
                <MarketplaceFilterChip active={activeFilter === 'payment'} onClick={() => setActiveFilter('payment')}>
                  Pembayaran
                </MarketplaceFilterChip>
                <MarketplaceFilterChip active={activeFilter === 'message'} onClick={() => setActiveFilter('message')}>
                  Pesan
                </MarketplaceFilterChip>
                <MarketplaceFilterChip active={activeFilter === 'support'} onClick={() => setActiveFilter('support')}>
                  Support
                </MarketplaceFilterChip>
              </MarketplaceStatusFilters>

              {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

              {filteredItems.length ? (
                <div className="space-y-5">
                  {sections.map((section) => (
                    <MarketplaceNotificationGroup count={section.items.length} key={section.key} title={section.title}>
                      {section.items.map((item) => renderNotificationCard(item, section.emphasized))}
                    </MarketplaceNotificationGroup>
                  ))}
                </div>
              ) : (
                <MarketplaceEmptyCard
                  description="Notifikasi akan muncul setelah ada update order, pembayaran, atau support."
                  title="Belum ada notifikasi"
                />
              )}
            </>
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
