'use client';

import {
  type CustomerPlatformOrder,
  createMarketplaceApiClient,
  type DirectoryOffering,
  type OrderPaymentSession,
  type ViewerSession,
} from '@marketplace/marketplace-core';
import { getServicePlatformConfig, type ServicePlatformId } from '@marketplace/platform-config';
import {
  MarketplaceActivityHeader,
  MarketplaceEmptyCard,
  MarketplaceFilterChip,
  MarketplaceMobileShell,
  MarketplaceSearchField,
  MarketplaceSegmentedTabs,
  MarketplaceStatusFilters,
  MarketplaceSurfaceCard,
  MessageBanner,
  PrimaryButton,
  SecondaryButton,
  TextAreaField,
  TextField,
} from '@marketplace/ui';
import { Bell, Calendar, ChevronRight, Clock3, CreditCard, Search, Tag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { getApiBaseUrl } from '../../../lib/env';
import {
  deliveryModeLabel,
  formatCurrency,
  isEnglishLocale,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { useCustomerMarketplaceController } from '../shared/use-customer-marketplace-controller';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);
const LOCAL_PAYMENT_PROVIDER_ID = 'manual_test';

function readOrderText(source: Record<string, unknown> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function LegacyActivityHeader({
  locale,
  onQueryChange,
  query,
}: {
  locale: string;
  onQueryChange: (value: string) => void;
  query: string;
}) {
  const en = isEnglishLocale(locale);

  return (
    <MarketplaceActivityHeader
      search={
        <MarketplaceSearchField
          onChange={onQueryChange}
          placeholder={en ? 'Search appointment or service' : 'Cari janji atau layanan'}
          trailing={<Search className="h-5 w-5" />}
          value={query}
        />
      }
      title={en ? 'Activity' : 'Aktivitas'}
      trailing={
        <a
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-slate-100 transition-colors hover:bg-slate-50"
          href={createLocalizedPath(locale, '/notifications')}
        >
          <Bell className="h-5 w-5" />
        </a>
      }
    />
  );
}

function ActivitySummaryHero({
  activeCount,
  historyCount,
  locale,
}: {
  activeCount: number;
  historyCount: number;
  locale: string;
}) {
  const en = isEnglishLocale(locale);

  return (
    <section className="overflow-hidden rounded-[30px] border border-pink-100/80 bg-[linear-gradient(180deg,#FFF7FB_0%,#FFFFFF_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(17,24,39,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]">
            <Calendar className="h-3.5 w-3.5" />
            {en ? 'Activity' : 'Aktivitas'}
          </div>
          <h1 className="mt-4 text-[22px] font-bold leading-tight text-slate-900">
            {en ? 'Orders and follow-up' : 'Order dan tindak lanjut'}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            {en
              ? 'See the active order flow first, then continue to history after the visit is done.'
              : 'Lihat order yang sedang berjalan lebih dulu, lalu lanjut ke riwayat setelah layanan selesai.'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-pink-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {en ? 'Active' : 'Berjalan'}
          </p>
          <p className="mt-2 text-[28px] font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-[22px] border border-pink-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {en ? 'History' : 'Riwayat'}
          </p>
          <p className="mt-2 text-[28px] font-bold text-slate-900">{historyCount}</p>
        </div>
      </div>
    </section>
  );
}

function ActivityOrderCard({
  locale,
  order,
  offering,
}: {
  locale: string;
  order: CustomerPlatformOrder;
  offering?: DirectoryOffering | null;
}) {
  const en = isEnglishLocale(locale);
  const schedule = readOrderText(order.fulfillmentDetails, 'preferredSchedule', 'schedule', 'visitSchedule');
  const note = readOrderText(order.fulfillmentDetails, 'notes', 'note', 'message');

  return (
    <a href={createLocalizedPath(locale, `/orders/${order.id}`)}>
      <article className="rounded-[26px] border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-[0_18px_36px_-30px_rgba(17,24,39,0.22)] active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-semibold text-pink-700">
                {paymentStatusLabel(order.paymentStatus, locale)}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                {orderStatusLabel(order.status, locale)}
              </span>
            </div>

            <h3 className="mt-3 text-[16px] font-bold leading-snug text-gray-900">{order.offeringTitle}</h3>
            <p className="mt-1 text-[13px] text-gray-500">
              {offering?.professionalDisplayName || (en ? 'Assigned professional' : 'Profesional terkait')}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {offering ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  {deliveryModeLabel(offering.deliveryMode, locale)}
                </span>
              ) : null}
              {schedule ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                  {schedule}
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  {en ? 'Status' : 'Status'}
                </div>
                <div className="mt-1 text-[14px] font-bold text-slate-900">
                  {orderStatusLabel(order.status, locale)}
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  {en ? 'Amount' : 'Nominal'}
                </div>
                <div className="mt-1 text-[14px] font-bold text-slate-900">
                  {formatCurrency(order.totalAmount, locale, order.currency)}
                </div>
              </div>
            </div>

            {note ? <p className="mt-3 line-clamp-2 text-[12.5px] leading-6 text-gray-500">{note}</p> : null}
          </div>

          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-50">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </article>
    </a>
  );
}

function QuickOrderOptionCard({
  active,
  locale,
  offering,
  onSelect,
}: {
  active: boolean;
  locale: string;
  offering: DirectoryOffering;
  onSelect: () => void;
}) {
  return (
    <button
      className="w-full rounded-[24px] border px-4 py-4 text-left transition-all active:scale-[0.99]"
      onClick={onSelect}
      style={
        active
          ? {
              background: 'linear-gradient(180deg,#FFF7FB 0%,#FFFFFF 100%)',
              borderColor: 'rgba(244,114,182,0.36)',
              boxShadow: '0 18px 36px -30px rgba(233,30,140,0.16)',
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: '#f0f1f4',
            }
      }
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{
                backgroundColor: active ? '#fdf2f8' : '#f8fafc',
                color: active ? 'var(--ui-primary)' : '#64748b',
              }}
            >
              {offeringTypeLabel(offering.offeringType, locale)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
              {deliveryModeLabel(offering.deliveryMode, locale)}
            </span>
          </div>

          <div className="mt-3 text-[15px] font-bold text-gray-900">{offering.title}</div>
          <div className="mt-1 text-[12px] text-gray-500">{offering.professionalDisplayName}</div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-gray-500">{offering.description}</p>
        </div>

        <div className="rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold text-white">
          {formatCurrency(offering.priceAmount, locale, offering.currency)}
        </div>
      </div>
    </button>
  );
}

export function OrdersPage({
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
  const en = isEnglishLocale(locale);
  const customerController = useCustomerMarketplaceController();
  const platform = getServicePlatformConfig(platformId);
  const [offerings, setOfferings] = useState<DirectoryOffering[]>([]);
  const [orders, setOrders] = useState<CustomerPlatformOrder[]>([]);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [latestPaymentSession, setLatestPaymentSession] = useState<OrderPaymentSession | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    fulfillmentNotes: '',
    fulfillmentSchedule: '',
    offeringId: '',
  });

  const selectedOffering = offerings.find((offering) => offering.id === form.offeringId) ?? null;

  const load = async () => {
    try {
      setLoading(true);
      setFeedback('');

      const [directoryOfferingResult, sessionResult, orderResult] = await Promise.allSettled([
        customerController.directory.fetchOfferings(client, platformId),
        customerController.viewerAuth.fetchSession(client),
        customerController.orders.fetchOrders(client, platformId),
      ]);

      if (directoryOfferingResult.status === 'fulfilled') {
        setOfferings(directoryOfferingResult.value.offerings);
        setForm((current) => ({
          ...current,
          offeringId: current.offeringId || directoryOfferingResult.value.offerings[0]?.id || '',
        }));
      } else {
        setOfferings([]);
      }

      if (sessionResult.status === 'fulfilled') {
        setSession(sessionResult.value);
      } else {
        setSession(null);
      }

      if (orderResult.status === 'fulfilled') {
        setOrders(orderResult.value.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : en ? 'Failed to load activity.' : 'Gagal memuat aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [customerController, platformId]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        const inActiveBucket =
          order.status !== 'completed' && order.status !== 'refunded' && order.status !== 'cancelled';
        const matchesTab = activeTab === 'active' ? inActiveBucket : !inActiveBucket;
        const matchesQuery =
          normalizedQuery.length === 0
            ? true
            : order.offeringTitle.toLowerCase().includes(normalizedQuery) ||
              order.id.toLowerCase().includes(normalizedQuery);
        const matchesPayment =
          paymentFilter === 'all'
            ? true
            : paymentFilter === 'paid'
              ? order.paymentStatus === 'paid'
              : order.paymentStatus !== 'paid';
        return matchesTab && matchesQuery && matchesPayment;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [activeTab, orders, paymentFilter, query]);

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      setFeedback('');

      const order = await customerController.orders.createOrder(client, platformId, {
        fulfillmentDetails: {
          notes: form.fulfillmentNotes,
          preferredSchedule: form.fulfillmentSchedule,
        },
        offeringId: form.offeringId,
      });

      const paymentSession = await customerController.orders.createPaymentSession(client, order.id, {
        provider: LOCAL_PAYMENT_PROVIDER_ID,
        returnUrl: typeof window !== 'undefined' ? window.location.href : '',
      });

      setLatestPaymentSession(paymentSession);
      setForm((current) => ({
        ...current,
        fulfillmentNotes: '',
        fulfillmentSchedule: '',
      }));
      await load();
      setFeedback(
        en
          ? 'Order created. Continue to payment to finish this request.'
          : 'Order berhasil dibuat. Lanjutkan pembayaran untuk menyelesaikan permintaan ini.',
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : en ? 'Failed to create order.' : 'Gagal membuat order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!latestPaymentSession?.paymentId) {
      return;
    }

    try {
      setIsSimulatingPayment(true);
      setFeedback('');
      await customerController.orders.settlePayment(client, LOCAL_PAYMENT_PROVIDER_ID, {
        paymentId: latestPaymentSession.paymentId,
        status: 'paid',
      });
      await load();
      setFeedback(
        en
          ? 'Payment marked as completed. This order is now ready for follow-up.'
          : 'Pembayaran berhasil ditandai selesai. Order ini sekarang siap dilanjutkan.',
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : en
            ? 'Failed to simulate payment.'
            : 'Gagal mensimulasikan pembayaran.',
      );
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const activeCount = orders.filter(
    (order) => order.status !== 'completed' && order.status !== 'refunded' && order.status !== 'cancelled',
  ).length;
  const historyCount = orders.length - activeCount;

  return (
    <MarketplaceMobileShell
      activeNavId={session?.isAuthenticated ? 'orders' : undefined}
      navItems={createPrimaryMarketplaceNav(platform, locale)}
      showNav={Boolean(session?.isAuthenticated)}
    >
      <div className="min-h-full bg-[#f9fafb] pb-24">
        <LegacyActivityHeader locale={locale} onQueryChange={setQuery} query={query} />

        <div className="space-y-5 px-5 py-5">
          {!session?.isAuthenticated ? (
            <MarketplaceSurfaceCard tone="white" className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f7] text-[var(--ui-primary)]">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="text-[18px] font-bold text-gray-900">
                {en ? 'Sign in to continue your activity' : 'Masuk untuk melanjutkan aktivitas Anda'}
              </div>
              <div className="mt-2 text-[14px] leading-relaxed text-gray-500">
                {en
                  ? 'Your appointments, follow-up, and support stay in the same customer account.'
                  : 'Janji, tindak lanjut, dan support semuanya tetap tersimpan di akun customer yang sama.'}
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <a href={authHref}>
                  <PrimaryButton className="w-full" type="button">
                    {en ? 'Sign in / register' : 'Masuk / daftar'}
                  </PrimaryButton>
                </a>
                <a href={createLocalizedPath(locale, '/services')}>
                  <SecondaryButton className="w-full" type="button">
                    {en ? 'Continue as visitor' : 'Lanjut sebagai visitor'}
                  </SecondaryButton>
                </a>
              </div>
            </MarketplaceSurfaceCard>
          ) : (
            <>
              <ActivitySummaryHero activeCount={activeCount} historyCount={historyCount} locale={locale} />

              {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

              <MarketplaceSurfaceCard tone="white">
                <div className="mb-4">
                  <h2 className="text-[17px] font-bold text-slate-900">{en ? 'My activity' : 'Aktivitas saya'}</h2>
                  <p className="mt-1 text-[12.5px] leading-6 text-slate-500">
                    {en
                      ? 'Track orders, payment, and post-service follow-up.'
                      : 'Pantau order, pembayaran, dan tindak lanjut sesudah layanan.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <MarketplaceSegmentedTabs
                    items={[
                      { label: en ? 'Active' : 'Berjalan', onClick: () => setActiveTab('active'), value: 'active' },
                      { label: en ? 'History' : 'Riwayat', onClick: () => setActiveTab('history'), value: 'history' },
                    ]}
                    value={activeTab}
                  />

                  <MarketplaceStatusFilters>
                    <MarketplaceFilterChip active={paymentFilter === 'all'} onClick={() => setPaymentFilter('all')}>
                      {en ? 'All' : 'Semua'}
                    </MarketplaceFilterChip>
                    <MarketplaceFilterChip
                      active={paymentFilter === 'unpaid'}
                      onClick={() => setPaymentFilter('unpaid')}
                    >
                      {en ? 'Need payment' : 'Perlu bayar'}
                    </MarketplaceFilterChip>
                    <MarketplaceFilterChip active={paymentFilter === 'paid'} onClick={() => setPaymentFilter('paid')}>
                      {en ? 'Paid' : 'Sudah bayar'}
                    </MarketplaceFilterChip>
                  </MarketplaceStatusFilters>

                  {loading ? (
                    <MarketplaceEmptyCard
                      description={en ? 'Preparing your activity.' : 'Menyiapkan aktivitas Anda.'}
                      title={en ? 'Loading activity' : 'Memuat aktivitas'}
                    />
                  ) : filteredOrders.length ? (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <ActivityOrderCard
                          key={order.id}
                          locale={locale}
                          offering={offerings.find((item) => item.id === order.offeringId) ?? null}
                          order={order}
                        />
                      ))}
                    </div>
                  ) : (
                    <MarketplaceEmptyCard
                      description={
                        en
                          ? 'Your orders will appear here after the first transaction.'
                          : 'Order Anda akan muncul di sini setelah transaksi pertama dibuat.'
                      }
                      title={en ? 'No activity yet' : 'Belum ada aktivitas'}
                    />
                  )}
                </div>
              </MarketplaceSurfaceCard>

              <section className="rounded-[28px] border border-pink-100/80 bg-[linear-gradient(180deg,#FFF7FB_0%,#FFFFFF_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(17,24,39,0.18)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]">
                      {en ? 'Quick order' : 'Order cepat'}
                    </div>
                    <h2 className="mt-4 text-[22px] font-bold leading-tight text-slate-900">
                      {en ? 'Create a new order' : 'Buat order baru'}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                      {selectedOffering
                        ? `${selectedOffering.professionalDisplayName} • ${deliveryModeLabel(
                            selectedOffering.deliveryMode,
                            locale,
                          )}`
                        : en
                          ? 'Choose a published service, then continue to the payment step.'
                          : 'Pilih layanan yang sudah tayang, lalu lanjut ke langkah pembayaran.'}
                    </p>
                  </div>
                </div>

                {latestPaymentSession?.paymentId ? (
                  <div className="mt-5 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          {en ? 'Payment step' : 'Langkah pembayaran'}
                        </p>
                        <p className="mt-2 text-[14px] font-bold text-emerald-900">
                          {en ? 'Payment is ready to continue' : 'Pembayaran siap dilanjutkan'}
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-emerald-700">
                          {en
                            ? 'Finish the latest order flow from here after reviewing the request details.'
                            : 'Selesaikan alur order terbaru dari sini setelah meninjau detail permintaannya.'}
                        </p>
                      </div>
                      <PrimaryButton disabled={isSimulatingPayment} onClick={handleSimulatePayment} type="button">
                        {isSimulatingPayment ? 'Memproses...' : en ? 'Mark as paid' : 'Tandai sudah bayar'}
                      </PrimaryButton>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5">
                  {offerings.length ? (
                    <div className="space-y-3">
                      {offerings.map((offering) => (
                        <QuickOrderOptionCard
                          key={offering.id}
                          active={form.offeringId === offering.id}
                          locale={locale}
                          offering={offering}
                          onSelect={() => setForm((current) => ({ ...current, offeringId: offering.id }))}
                        />
                      ))}
                    </div>
                  ) : (
                    <MarketplaceEmptyCard
                      description={
                        en ? 'No public services are ready yet.' : 'Belum ada layanan publik yang siap dipesan.'
                      }
                      title={en ? 'Service list is empty' : 'Daftar layanan masih kosong'}
                    />
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  <TextField
                    label={en ? 'Preferred schedule' : 'Jadwal yang diinginkan'}
                    placeholder={en ? 'Tomorrow morning / 10 Apr 09.00' : 'Besok pagi / 10 Apr 09.00'}
                    value={form.fulfillmentSchedule}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fulfillmentSchedule: event.target.value }))
                    }
                  />
                  <TextAreaField
                    label={en ? 'Notes for the professional' : 'Catatan untuk profesional'}
                    placeholder={
                      en
                        ? 'Tell us what you need, symptoms, or preferred visit details.'
                        : 'Ceritakan kebutuhan, keluhan, atau detail kunjungan yang diinginkan.'
                    }
                    value={form.fulfillmentNotes}
                    onChange={(event) => setForm((current) => ({ ...current, fulfillmentNotes: event.target.value }))}
                  />
                  <PrimaryButton
                    className="w-full"
                    disabled={isSubmitting || !form.offeringId}
                    onClick={handleCreate}
                    type="button"
                  >
                    {isSubmitting ? 'Memproses...' : en ? 'Create order' : 'Buat order'}
                  </PrimaryButton>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}

function offeringTypeLabel(value: string | undefined, locale?: string | null) {
  if (value === 'home_visit') {
    return isEnglishLocale(locale) ? 'Home visit' : 'Kunjungan rumah';
  }
  if (value === 'online_session') {
    return isEnglishLocale(locale) ? 'Online session' : 'Sesi online';
  }
  if (value === 'digital_product') {
    return isEnglishLocale(locale) ? 'Digital product' : 'Produk digital';
  }
  return value?.replaceAll('_', ' ') || (isEnglishLocale(locale) ? 'Service' : 'Layanan');
}
