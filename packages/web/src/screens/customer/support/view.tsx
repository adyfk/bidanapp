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
import { useEffect, useEffectEvent, useState } from 'react';
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

  const load = useEffectEvent(async (currentPlatformId: ServicePlatformId) => {
    const sessionPayload = await customerController.viewerAuth.fetchSession(client);
    setSession(sessionPayload);
    if (!sessionPayload.isAuthenticated) {
      setTickets([]);
      return;
    }
    const payload = await customerController.support.fetchTickets(client, currentPlatformId);
    setTickets(payload.tickets);
  });

  useEffect(() => {
    void load(platformId).catch((error) => {
      setFeedback(error instanceof Error ? error.message : 'Gagal memuat support center.');
    });
  }, [platformId]);

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
      await load(platformId);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal membuat tiket support.');
    } finally {
      setBusy(false);
    }
  };

  const counts = {
    new: tickets.filter((ticket) => ticket.status === 'new').length,
    resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
    triaged: tickets.filter((ticket) => ticket.status === 'triaged').length,
  };

  return (
    <MarketplaceMobileShell
      navItems={createPrimaryMarketplaceNav(getServicePlatformConfig(platformId), locale)}
      showNav={Boolean(session?.isAuthenticated)}
    >
      <div className="min-h-full pb-24" style={{ backgroundColor: 'var(--ui-background)' }}>
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
                tone="pink"
              />

              <section
                className="grid grid-cols-3 gap-3 rounded-[28px] border p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.14)]"
                style={{
                  background:
                    'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 48%, white) 100%)',
                  borderColor: 'var(--ui-border)',
                }}
              >
                <div className="rounded-[20px] border border-white/80 bg-white/86 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Baru</p>
                  <p className="mt-2 text-[20px] font-bold text-slate-900">{counts.new}</p>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/86 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Triaged</p>
                  <p className="mt-2 text-[20px] font-bold text-slate-900">{counts.triaged}</p>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/86 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Resolved</p>
                  <p className="mt-2 text-[20px] font-bold text-slate-900">{counts.resolved}</p>
                </div>
              </section>

              {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

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
                        description={<span className="break-words [overflow-wrap:anywhere]">{ticket.details}</span>}
                        subtitle={ticket.priority}
                        title={<span className="break-words [overflow-wrap:anywhere]">{ticket.subject}</span>}
                        meta={
                          (ticket.events ?? []).length ? (
                            <div className="space-y-2">
                              {(ticket.events ?? []).slice(0, 2).map((event) => (
                                <div
                                  className="rounded-[18px] border px-3 py-3 text-[12px] leading-5 text-gray-500"
                                  style={{
                                    background:
                                      'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 36%, white) 100%)',
                                    borderColor: 'var(--ui-border)',
                                  }}
                                  key={event.id}
                                >
                                  <div className="font-semibold text-gray-700">
                                    {humanizeSupportEvent(event.eventType)}
                                  </div>
                                  <div className="mt-1 break-words [overflow-wrap:anywhere]">
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
            </>
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
