'use client';

import {
  type ChatThreadDetail,
  type CustomerPlatformOrder,
  createChatMessage,
  createChatThread,
  createMarketplaceApiClient,
  fetchChatThread,
  fetchChatThreads,
  type ViewerSession,
} from '@marketplace/marketplace-core';
import type { ServicePlatformId } from '@marketplace/platform-config';
import {
  MarketplaceChatComposer,
  MarketplaceChatThread,
  MarketplaceEmptyCard,
  MarketplaceHeaderIconButton,
  MarketplaceMobileShell,
  MarketplacePageHeader,
  MarketplaceSectionHeader,
  MarketplaceSurfaceCard,
  MessageBanner,
  PrimaryButton,
  SecondaryButton,
  TextAreaField,
} from '@marketplace/ui';
import { BookHeart, ImageIcon, MoreVertical, Phone, Plus, Send, Smile } from 'lucide-react';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../../../lib/env';
import { formatCurrency, isEnglishLocale, orderStatusLabel, paymentStatusLabel } from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { CustomerAccessLock } from '../shared/parts/access-lock';
import { useCustomerMarketplaceController } from '../shared/use-customer-marketplace-controller';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);
const LOCAL_PAYMENT_PROVIDER_ID = 'manual_test';

function formatChatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function isOutgoingMessage(senderKind: string | undefined) {
  return senderKind === 'customer' || senderKind === 'viewer' || senderKind === 'user';
}

function readFulfillmentValue(source: Record<string, unknown> | null | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

export function CustomerOrderDetailPage({
  authHref,
  initialSession,
  locale,
  orderId,
  platformId,
}: {
  authHref: string;
  initialSession?: ViewerSession | null;
  locale: string;
  orderId: string;
  platformId: ServicePlatformId;
}) {
  const customerController = useCustomerMarketplaceController();
  const en = isEnglishLocale(locale);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [order, setOrder] = useState<CustomerPlatformOrder | null>(null);
  const [thread, setThread] = useState<ChatThreadDetail | null>(null);
  const [message, setMessage] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useEffectEvent(async (currentPlatformId: ServicePlatformId, currentOrderId: string) => {
    try {
      setLoading(true);
      const sessionPayload = await customerController.viewerAuth.fetchSession(client);
      setSession(sessionPayload);
      if (!sessionPayload.isAuthenticated) {
        setOrder(null);
        setThread(null);
        return;
      }

      const [orderPayload, threadsPayload] = await Promise.all([
        customerController.orders.fetchOrder(client, currentPlatformId, currentOrderId),
        fetchChatThreads(client, { orderId: currentOrderId, platformId: currentPlatformId }),
      ]);
      setOrder(orderPayload);
      if (threadsPayload.threads[0]) {
        const detail = await fetchChatThread(client, threadsPayload.threads[0].id);
        setThread(detail);
      } else {
        setThread(null);
      }
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : en ? 'Failed to load order detail.' : 'Gagal memuat detail order.',
      );
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void load(platformId, orderId);
  }, [orderId, platformId]);

  const handleCreateOrSimulatePayment = async () => {
    if (!order) {
      return;
    }
    try {
      setBusy(true);
      setFeedback('');
      const paymentSession = await customerController.orders.createPaymentSession(client, order.id, {
        provider: LOCAL_PAYMENT_PROVIDER_ID,
        returnUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
      await customerController.orders.settlePayment(client, LOCAL_PAYMENT_PROVIDER_ID, {
        paymentId: paymentSession.paymentId,
        status: 'paid',
      });
      await load(platformId, orderId);
      setFeedback(en ? 'Payment completed for this order.' : 'Pembayaran untuk order ini sudah selesai.');
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : en ? 'Failed to process payment.' : 'Gagal memproses pembayaran.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitChat = async () => {
    if (!order || !message.trim()) {
      return;
    }

    try {
      setBusy(true);
      setFeedback('');

      if (!thread) {
        const detail = await createChatThread(client, {
          initialMessage: message,
          orderId: order.id,
          platformId,
          threadType: 'order',
          title: `Order ${order.id}`,
        });
        setThread(detail);
      } else {
        const detail = await createChatMessage(client, thread.thread.id, {
          body: message,
        });
        setThread(detail);
      }

      setMessage('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : en ? 'Failed to send chat.' : 'Gagal mengirim chat.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSupport = async () => {
    if (!order || !supportMessage.trim()) {
      return;
    }
    try {
      setBusy(true);
      const ticket = await customerController.support.createTicket(client, {
        details: supportMessage,
        orderId: order.id,
        platformId,
        priority: 'normal',
        subject: `Support for ${order.offeringTitle}`,
      });
      setFeedback(en ? `Support ticket ${ticket.id} created.` : `Tiket support ${ticket.id} berhasil dibuat.`);
      setSupportMessage('');
      await load(platformId, orderId);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : en
            ? 'Failed to create support ticket.'
            : 'Gagal membuat tiket support.',
      );
    } finally {
      setBusy(false);
    }
  };

  const counterpartyName = useMemo(() => {
    const firstProfessionalMessage = (thread?.messages ?? []).find((item) => !isOutgoingMessage(item.senderKind));
    return firstProfessionalMessage?.senderName || (en ? 'Professional' : 'Profesional');
  }, [en, thread?.messages]);

  const orderSchedule = readFulfillmentValue(
    order?.fulfillmentDetails,
    'preferredSchedule',
    'schedule',
    'visitSchedule',
  );
  const orderNotes = readFulfillmentValue(order?.fulfillmentDetails, 'notes', 'note', 'message');
  const threadMessages =
    (thread?.messages ?? []).map((item) => ({
      body: item.body,
      id: item.id,
      outgoing: isOutgoingMessage(item.senderKind),
      read: true,
      senderLabel: item.senderName,
      timestamp: formatChatTime(item.sentAt, locale),
    })) ?? [];

  const statusStrip = order ? (
    <div
      className="mx-auto w-full rounded-[22px] border bg-white px-4 py-4 shadow-sm"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 34%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--ui-primary)' }}>
            {en ? 'Order update' : 'Update order'}
          </p>
          <p className="mt-1 text-[14px] font-bold break-words text-slate-900 [overflow-wrap:anywhere]">
            {order.offeringTitle}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
        >
          {orderStatusLabel(order.status, locale)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white">
          {paymentStatusLabel(order.paymentStatus, locale)}
        </span>
        {orderSchedule ? (
          <span
            className="rounded-full px-3 py-1.5 text-[10px] font-semibold"
            style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
          >
            {orderSchedule}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
        {orderNotes ||
          (en
            ? 'Use this thread to confirm the visit details, timing, and follow-up.'
            : 'Gunakan thread ini untuk memastikan detail layanan, jadwal, dan tindak lanjut.')}
      </p>
    </div>
  ) : null;

  return (
    <MarketplaceMobileShell showNav={false}>
      <div className="min-h-full pb-32" style={{ backgroundColor: 'var(--ui-background)' }}>
        <MarketplacePageHeader
          backHref={createLocalizedPath(locale, '/orders')}
          title={en ? 'Order detail' : 'Detail order'}
          trailing={
            <MarketplaceHeaderIconButton>
              <MoreVertical className="h-5 w-5" />
            </MarketplaceHeaderIconButton>
          }
        />

        <div className="space-y-4 px-5 py-5">
          {!session?.isAuthenticated ? (
            <CustomerAccessLock
              actionLabel={en ? 'Sign in' : 'Masuk'}
              authHref={authHref}
              description={en ? 'Sign in first to view this order.' : 'Masuk dulu untuk melihat detail order ini.'}
              icon={<BookHeart className="h-5 w-5" />}
              title={en ? 'Order detail is locked' : 'Detail order belum bisa dibuka'}
            />
          ) : loading ? (
            <MarketplaceSurfaceCard tone="white">
              <div className="text-sm text-gray-500">{en ? 'Loading order detail...' : 'Memuat detail order...'}</div>
            </MarketplaceSurfaceCard>
          ) : !order ? (
            <MarketplaceEmptyCard
              description={
                en
                  ? 'This order is not available for the current account.'
                  : 'Order ini tidak tersedia untuk akun yang aktif.'
              }
              title={en ? 'Order not found' : 'Order tidak ditemukan'}
            />
          ) : (
            <>
              {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

              <MarketplaceSurfaceCard className="p-5" tone="white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border text-[16px] font-bold"
                      style={{
                        backgroundColor: 'var(--ui-surface-muted)',
                        borderColor: 'var(--ui-border)',
                        color: 'var(--ui-primary)',
                      }}
                    >
                      {counterpartyName.charAt(0).toUpperCase()}
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-[2px] border-white bg-green-500" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-bold break-words text-gray-900 [overflow-wrap:anywhere]">
                        {counterpartyName}
                      </h2>
                      <p className="mt-0.5 text-[12px] font-bold text-green-500">
                        {en ? 'Available in this order thread' : 'Siap dihubungi dari thread ini'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <MarketplaceHeaderIconButton>
                      <Phone className="h-5 w-5" />
                    </MarketplaceHeaderIconButton>
                    <MarketplaceHeaderIconButton>
                      <MoreVertical className="h-5 w-5" />
                    </MarketplaceHeaderIconButton>
                  </div>
                </div>
              </MarketplaceSurfaceCard>

              <MarketplaceSurfaceCard tone="white">
                <MarketplaceSectionHeader title={en ? 'Order summary' : 'Ringkasan order'} />
                <div className="space-y-3">
                  <div
                    className="rounded-[20px] border px-4 py-4"
                    style={{
                      background:
                        'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 52%, white) 100%)',
                      borderColor: 'var(--ui-border)',
                    }}
                  >
                    <div
                      className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: 'var(--ui-primary)' }}
                    >
                      {en ? 'Service' : 'Layanan'}
                    </div>
                    <div className="mt-2 text-[17px] font-bold leading-snug break-words text-slate-900 [overflow-wrap:anywhere]">
                      {order.offeringTitle}
                    </div>
                    <div className="mt-2 text-[12.5px] leading-6 text-slate-500">{counterpartyName}</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {en ? 'Status' : 'Status'}
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-slate-900">
                        {orderStatusLabel(order.status, locale)}
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {en ? 'Payment' : 'Pembayaran'}
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-slate-900">
                        {paymentStatusLabel(order.paymentStatus, locale)}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {en ? 'Schedule' : 'Jadwal'}
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-slate-900">
                        {orderSchedule || (en ? 'Confirm in chat' : 'Konfirmasi di chat')}
                      </div>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {en ? 'Total' : 'Total'}
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-slate-900">
                        {formatCurrency(order.totalAmount, locale, order.currency)}
                      </div>
                    </div>
                  </div>

                  {orderNotes ? (
                    <div className="rounded-[18px] px-4 py-3" style={{ backgroundColor: 'var(--ui-surface-muted)' }}>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: 'var(--ui-primary)' }}
                      >
                        {en ? 'Request note' : 'Catatan order'}
                      </div>
                      <div className="mt-1 break-words text-[13px] leading-6 text-slate-600 [overflow-wrap:anywhere]">
                        {orderNotes}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {order.paymentStatus !== 'paid' ? (
                      <PrimaryButton disabled={busy} onClick={handleCreateOrSimulatePayment} type="button">
                        {busy ? (en ? 'Saving...' : 'Proses...') : en ? 'Paid' : 'Bayar'}
                      </PrimaryButton>
                    ) : null}
                    <SecondaryButton
                      onClick={() => {
                        window.location.href = createLocalizedPath(locale, '/support');
                      }}
                      type="button"
                    >
                      {en ? 'Support' : 'Support'}
                    </SecondaryButton>
                  </div>
                </div>
              </MarketplaceSurfaceCard>

              <MarketplaceSurfaceCard className="p-4" tone="ghost">
                <MarketplaceSectionHeader title={en ? 'Order chat' : 'Chat order'} />
                <MarketplaceChatThread
                  dayLabel={en ? 'Today' : 'Hari ini'}
                  emptyState={
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                      <div className="text-[16px] font-bold text-slate-900">
                        {en ? 'Start the order chat' : 'Mulai chat order'}
                      </div>
                      <div className="mt-2 text-[13px] leading-6 text-slate-500">
                        {en
                          ? 'Open the thread to confirm timing, preparation, and follow-up for this visit.'
                          : 'Buka thread untuk mengonfirmasi jadwal, persiapan, dan tindak lanjut layanan ini.'}
                      </div>
                    </div>
                  }
                  messages={threadMessages}
                  statusCard={statusStrip}
                />
              </MarketplaceSurfaceCard>

              <MarketplaceSurfaceCard tone="white">
                <MarketplaceSectionHeader title={en ? 'Need help?' : 'Butuh bantuan?'} />
                <div className="space-y-4">
                  <TextAreaField
                    label={en ? 'Tell us the issue' : 'Ceritakan kendalanya'}
                    placeholder={
                      en
                        ? 'Tell us what is blocking the visit or what follow-up you need.'
                        : 'Tulis kendala yang menghambat layanan atau tindak lanjut yang Anda butuhkan.'
                    }
                    value={supportMessage}
                    onChange={(event) => setSupportMessage(event.target.value)}
                  />
                  <PrimaryButton disabled={busy || !supportMessage.trim()} onClick={handleCreateSupport} type="button">
                    {busy ? 'Memproses...' : en ? 'Create support ticket' : 'Buat tiket support'}
                  </PrimaryButton>
                </div>
              </MarketplaceSurfaceCard>
            </>
          )}
        </div>

        {session?.isAuthenticated && order ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
            <div className="pointer-events-auto w-full max-w-[480px] border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              <MarketplaceChatComposer
                disabled={busy}
                inputLeadingAccessory={
                  <button className="p-2 text-gray-400 transition-colors hover:text-gray-600" type="button">
                    <Smile className="h-5 w-5" />
                  </button>
                }
                inputTrailingAccessory={
                  <button className="p-2 text-gray-400 transition-colors hover:text-gray-600" type="button">
                    <ImageIcon className="h-5 w-5" />
                  </button>
                }
                leadingAccessory={
                  <button
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100"
                    type="button"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                }
                onChange={setMessage}
                onSubmit={() => void handleSubmitChat()}
                placeholder={en ? 'Write a message for this order' : 'Tulis pesan untuk order ini'}
                submitAccessory={<Send className="ml-0.5 h-4 w-4" />}
                submitDisabled={busy || !message.trim()}
                value={message}
              />
            </div>
          </div>
        ) : null}
      </div>
    </MarketplaceMobileShell>
  );
}
