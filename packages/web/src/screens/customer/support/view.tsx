'use client';

import type { SupportTicket, ViewerSession } from '@marketplace/marketplace-core';
import { createMarketplaceApiClient } from '@marketplace/marketplace-core';
import type { ServicePlatformId } from '@marketplace/platform-config';
import { getServicePlatformConfig } from '@marketplace/platform-config';
import {
  MarketplaceEmptyCard,
  MarketplaceFilterChip,
  MarketplaceListCard,
  MarketplaceMobileShell,
  MarketplaceSettingsCard,
  MarketplaceStatusFilters,
  MarketplaceSupportEntryCard,
  MessageBanner,
  PrimaryButton,
  StatusPill,
  TextAreaField,
  TextField,
} from '@marketplace/ui';
import { LifeBuoy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { getApiBaseUrl } from '../../../lib/env';
import { supportStatusLabel } from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { CustomerAccessLock } from '../shared/parts/access-lock';
import { MarketplaceStickyPageHeader } from '../shared/parts/page-header';
import { useCustomerMarketplaceController } from '../shared/use-customer-marketplace-controller';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

const quickSubjects = ['Kendala pembayaran', 'Jadwal layanan', 'Perlu refund', 'Masalah akun'];

function humanizeSupportEvent(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CustomerSupportPage({
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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({ details: '', subject: '' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    const sessionPayload = await customerController.viewerAuth.fetchSession(client);
    setSession(sessionPayload);
    if (!sessionPayload.isAuthenticated) {
      setTickets([]);
      return;
    }
    const payload = await customerController.support.fetchTickets(client, platformId);
    setTickets(payload.tickets);
  };

  useEffect(() => {
    void load().catch((error) => {
      setFeedback(error instanceof Error ? error.message : 'Gagal memuat support center.');
    });
  }, [customerController.support, customerController.viewerAuth, platformId]);

  const handleCreate = async () => {
    try {
      setBusy(true);
      const ticket = await customerController.support.createTicket(client, {
        details: form.details,
        platformId,
        priority: 'normal',
        subject: form.subject,
      });
      setFeedback(`Tiket ${ticket.id} berhasil dibuat.`);
      setForm({ details: '', subject: '' });
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal membuat tiket support.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MarketplaceMobileShell
      navItems={createPrimaryMarketplaceNav(getServicePlatformConfig(platformId), locale)}
      showNav={Boolean(session?.isAuthenticated)}
    >
      <div className="min-h-full bg-[#f9fafb] pb-24">
        <MarketplaceStickyPageHeader backHref={createLocalizedPath(locale, '/home')} title="Support" />

        <div className="space-y-5 px-5 py-5">
          {!session?.isAuthenticated ? (
            <CustomerAccessLock
              authHref={authHref}
              description="Masuk untuk mengirim tiket baru dan memantau tindak lanjut bantuan."
              icon={<LifeBuoy className="h-5 w-5" />}
              title="Support center belum tersedia"
            />
          ) : (
            <>
              <MarketplaceSupportEntryCard
                actionLabel="Tulis bantuan"
                badges={['Order', 'Pembayaran', 'Refund']}
                description="Kirim kendala baru atau pantau bantuan yang sedang berjalan dari satu layar."
                icon={<LifeBuoy className="h-5 w-5" />}
                responseBadge="Tim aktif"
                title="Support center"
              />

              {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

              <MarketplaceSettingsCard>
                <div className="px-5 pb-1 pt-5">
                  <h2 className="text-[15px] font-bold text-slate-900">Buat tiket baru</h2>
                  <p className="mt-1 text-[12.5px] leading-6 text-slate-500">
                    Tulis inti kendalanya dulu, lalu tambahkan detail yang perlu ditindaklanjuti.
                  </p>
                </div>

                <div className="space-y-4 px-5 pb-5 pt-3">
                  <MarketplaceStatusFilters>
                    {quickSubjects.map((subject) => (
                      <MarketplaceFilterChip
                        active={form.subject === subject}
                        key={subject}
                        onClick={() => setForm((current) => ({ ...current, subject }))}
                      >
                        {subject}
                      </MarketplaceFilterChip>
                    ))}
                  </MarketplaceStatusFilters>

                  <TextField
                    label="Subjek"
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  />
                  <TextAreaField
                    label="Detail"
                    value={form.details}
                    onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                  />
                  <PrimaryButton
                    className="w-full"
                    disabled={busy || !form.subject.trim() || !form.details.trim()}
                    onClick={handleCreate}
                    type="button"
                  >
                    {busy ? 'Mengirim...' : 'Buat tiket'}
                  </PrimaryButton>
                </div>
              </MarketplaceSettingsCard>

              <MarketplaceSettingsCard>
                <div className="px-5 pb-1 pt-5">
                  <h2 className="text-[15px] font-bold text-slate-900">Tiket saya</h2>
                  <p className="mt-1 text-[12.5px] leading-6 text-slate-500">
                    Lihat tiket yang sedang berjalan dan catatan tindak lanjut terbaru.
                  </p>
                </div>
                {tickets.length ? (
                  <div className="space-y-4 px-5 pb-5 pt-3">
                    {tickets.map((ticket) => (
                      <MarketplaceListCard
                        key={ticket.id}
                        badge={<StatusPill tone="accent">{supportStatusLabel(ticket.status, locale)}</StatusPill>}
                        description={ticket.details}
                        subtitle={ticket.priority}
                        title={ticket.subject}
                        meta={
                          (ticket.events ?? []).length ? (
                            <div className="space-y-2">
                              {(ticket.events ?? []).slice(0, 2).map((event) => (
                                <div
                                  className="rounded-[18px] border border-pink-100 bg-[#fff9fc] px-3 py-3 text-[12px] leading-5 text-gray-500"
                                  key={event.id}
                                >
                                  <div className="font-semibold text-gray-700">
                                    {humanizeSupportEvent(event.eventType)}
                                  </div>
                                  <div className="mt-1">
                                    {event.publicNote || 'Tim support sedang menindaklanjuti tiket ini.'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-5 pb-5 pt-3">
                    <MarketplaceEmptyCard
                      description="Tiket support yang Anda buat akan muncul di sini."
                      title="Belum ada tiket"
                    />
                  </div>
                )}
              </MarketplaceSettingsCard>
            </>
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
