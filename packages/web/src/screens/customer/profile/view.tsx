'use client';

import type { SupportTicket, ViewerSession } from '@marketplace/marketplace-core';
import { createMarketplaceApiClient } from '@marketplace/marketplace-core';
import { getServicePlatformConfig, type ServicePlatformId } from '@marketplace/platform-config';
import {
  MarketplaceDangerButton,
  MarketplaceFilterChip,
  MarketplaceIdentityCard,
  MarketplaceListCard,
  MarketplaceMobileShell,
  MarketplaceProfileSettingsSheet,
  MarketplaceQuickActionCard,
  MarketplaceSettingsCard,
  MarketplaceSettingsRow,
  MarketplaceStatusFilters,
  MarketplaceSupportEntryCard,
  MarketplaceSupportSheet,
} from '@marketplace/ui/marketplace-lite';
import {
  MessageBanner,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  TextAreaField,
  TextField,
} from '@marketplace/ui/primitives';
import { Bell, BookHeart, BriefcaseMedical, Compass, KeyRound, LifeBuoy, LogOut, MapPin, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPrimaryMarketplaceNav } from '../../../layout/navigation';
import { getApiBaseUrl } from '../../../lib/env';
import { supportStatusLabel } from '../../../lib/marketplace-copy';
import { createLocalizedPath, createPlatformSecurityPath, createPlatformSessionsPath } from '../../../lib/platform';
import { CustomerAccessLock } from '../shared/parts/access-lock';
import { MarketplaceStickyPageHeader } from '../shared/parts/page-header';
import { useCustomerMarketplaceController } from '../shared/use-customer-marketplace-controller';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);
const supportQuickSubjects = ['Perubahan jadwal', 'Kendala pembayaran', 'Butuh refund', 'Masalah akun'];

export function CustomerProfilePage({
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
  const platform = getServicePlatformConfig(platformId);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({ city: '', displayName: '' });
  const [supportForm, setSupportForm] = useState({ details: '', subject: '' });
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'account' | 'security' | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await customerController.viewerAuth.fetchSession(client);
      setSession(payload);
      setForm({
        city: payload.customerProfile?.city || '',
        displayName: payload.customerProfile?.displayName || '',
      });

      if (payload.isAuthenticated) {
        const ticketPayload = await customerController.support.fetchTickets(client, platformId);
        setTickets(ticketPayload.tickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memuat profil.');
    }
  }, [customerController, platformId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    try {
      setBusy(true);
      const payload = await customerController.viewerAuth.updateCustomerProfile(client, form);
      setSession(payload);
      setFeedback('Profil berhasil diperbarui.');
      setActiveSheet(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal memperbarui profil.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSupport = async () => {
    if (!supportForm.subject.trim() || !supportForm.details.trim()) {
      return;
    }

    try {
      setBusy(true);
      const ticket = await customerController.support.createTicket(client, {
        details: supportForm.details,
        platformId,
        priority: 'normal',
        subject: supportForm.subject,
      });
      setFeedback(`Tiket ${ticket.id} berhasil dibuat.`);
      setSupportForm({ details: '', subject: '' });
      setSupportOpen(false);
      await load();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Gagal membuat tiket support.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MarketplaceMobileShell
      navItems={createPrimaryMarketplaceNav(platform, locale)}
      showNav={Boolean(session?.isAuthenticated)}
    >
      <div className="min-h-full bg-[var(--ui-background)] pb-24">
        <MarketplaceStickyPageHeader backHref={createLocalizedPath(locale)} title="Profil" />

        <div className="space-y-6 px-5 py-6">
          {!session?.isAuthenticated ? (
            <CustomerAccessLock
              authHref={authHref}
              description="Masuk dulu untuk membuka profil, keamanan akun, dan riwayat bantuan."
              icon={<User className="h-5 w-5" />}
              title="Profil belum tersedia"
            />
          ) : (
            <>
              <MarketplaceIdentityCard
                actionLabel="Edit profil"
                chipIcon={<MapPin className="h-3.5 w-3.5" />}
                chipLabel={form.city || 'Lokasi belum diatur'}
                onAction={() => setActiveSheet('account')}
                subtitle={session.phone || session.customerProfile?.primaryPhone || '-'}
                title={session.customerProfile?.displayName || 'Akun customer'}
              />

              {feedback ? <MessageBanner tone="info">{feedback}</MessageBanner> : null}

              <div className="grid grid-cols-2 gap-3">
                <MarketplaceQuickActionCard
                  description="Lihat order aktif, riwayat, dan tindak lanjut terbaru."
                  icon={<BookHeart className="h-5 w-5" />}
                  onClick={() => {
                    window.location.href = createLocalizedPath(locale, '/orders');
                  }}
                  title="Aktivitas"
                />
                <MarketplaceQuickActionCard
                  description="Pantau pesan penting, update pembayaran, dan support."
                  icon={<Bell className="h-5 w-5" />}
                  onClick={() => {
                    window.location.href = createLocalizedPath(locale, '/notifications');
                  }}
                  title="Notifikasi"
                />
              </div>

              <MarketplaceQuickActionCard
                description="Jelajahi profesional dan layanan yang paling cocok untuk kebutuhan Anda."
                icon={<Compass className="h-5 w-5" />}
                onClick={() => {
                  window.location.href = createLocalizedPath(locale, '/explore');
                }}
                title="Explore"
              />

              <MarketplaceSettingsCard>
                <MarketplaceSettingsRow
                  description="Perbarui nama tampil dan kota agar profil tetap rapi."
                  icon={<User className="h-4 w-4" />}
                  iconClassName="bg-rose-50 text-rose-600"
                  onClick={() => setActiveSheet('account')}
                  title="Akun"
                />
                <MarketplaceSettingsRow
                  description="Kelola password dan perangkat yang sedang aktif."
                  icon={<KeyRound className="h-4 w-4" />}
                  iconClassName="bg-pink-50 text-pink-700"
                  onClick={() => setActiveSheet('security')}
                  title="Keamanan"
                />
                <MarketplaceSettingsRow
                  description="Buat tiket baru atau cek tindak lanjut yang masih aktif."
                  icon={<LifeBuoy className="h-4 w-4" />}
                  iconClassName="bg-rose-100 text-rose-700"
                  onClick={() => setSupportOpen(true)}
                  title="Support"
                />
                <MarketplaceSettingsRow
                  description="Lanjutkan jalur profesional untuk mengelola layanan dan dashboard kerja."
                  icon={<BriefcaseMedical className="h-4 w-4" />}
                  iconClassName="bg-fuchsia-50 text-fuchsia-700"
                  isLast
                  onClick={() => {
                    window.location.href = createLocalizedPath(locale, '/professionals/apply');
                  }}
                  title="Mode profesional"
                />
              </MarketplaceSettingsCard>

              <MarketplaceSupportEntryCard
                actionLabel="Buka composer support"
                badges={['Order', 'Pembayaran', 'Akun']}
                description="Kalau ada kendala, cukup buka composer support dari profil ini dan lanjutkan tanpa pindah jalur."
                icon={<LifeBuoy className="h-5 w-5" />}
                onClick={() => setSupportOpen(true)}
                responseBadge={`${tickets.filter((ticket) => ticket.status !== 'resolved').length} aktif`}
                title="Butuh bantuan cepat?"
                tone="pink"
              />

              <MarketplaceSettingsCard>
                <div className="px-5 pb-1 pt-5">
                  <h2 className="text-[15px] font-bold text-slate-900">Bantuan terbaru</h2>
                  <p className="mt-1 text-[12.5px] leading-6 text-slate-500">
                    Ringkasan tiket terakhir dan jalur cepat menuju support center penuh.
                  </p>
                </div>
                <div className="space-y-3 px-5 pb-5 pt-3">
                  {tickets.slice(0, 2).length ? (
                    tickets
                      .slice(0, 2)
                      .map((ticket) => (
                        <MarketplaceListCard
                          key={ticket.id}
                          badge={<StatusPill tone="accent">{supportStatusLabel(ticket.status, locale)}</StatusPill>}
                          description={ticket.details}
                          subtitle={`${ticket.priority} • ${ticket.id}`}
                          title={ticket.subject}
                        />
                      ))
                  ) : (
                    <MarketplaceListCard
                      description="Tiket bantuan yang Anda buat akan muncul di sini."
                      title="Belum ada tiket aktif"
                    />
                  )}
                  <SecondaryButton
                    className="w-full"
                    onClick={() => {
                      window.location.href = createLocalizedPath(locale, '/support');
                    }}
                    type="button"
                  >
                    Support
                  </SecondaryButton>
                </div>
              </MarketplaceSettingsCard>

              <MarketplaceDangerButton
                icon={<LogOut className="h-5 w-5" />}
                label="Keluar"
                onClick={() => {
                  void customerController.viewerAuth.deleteSession(client).finally(() => {
                    window.location.href = createLocalizedPath(locale);
                  });
                }}
              />
            </>
          )}
        </div>
      </div>

      <MarketplaceProfileSettingsSheet
        description="Perbarui identitas customer agar aktivitas dan bantuan tetap tersambung ke akun yang sama."
        isOpen={activeSheet === 'account'}
        onClose={() => setActiveSheet(null)}
        title="Edit profil"
      >
        <div className="space-y-4">
          <TextField
            label="Nama tampil"
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          />
          <TextField
            label="Kota"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
          <PrimaryButton className="w-full" disabled={busy} onClick={handleSave} type="button">
            {busy ? 'Menyimpan...' : 'Simpan profil'}
          </PrimaryButton>
        </div>
      </MarketplaceProfileSettingsSheet>

      <MarketplaceProfileSettingsSheet
        description="Buka pengaturan keamanan saat Anda ingin mengganti password atau meninjau perangkat aktif."
        isOpen={activeSheet === 'security'}
        onClose={() => setActiveSheet(null)}
        title="Keamanan akun"
      >
        <div className="space-y-3">
          <MarketplaceListCard
            description="Ganti password akun customer Anda."
            title="Password"
            accessory={
              <SecondaryButton
                onClick={() => {
                  window.location.href = createPlatformSecurityPath(locale);
                }}
                type="button"
              >
                Buka
              </SecondaryButton>
            }
          />
          <MarketplaceListCard
            description="Tinjau dan keluar dari perangkat yang tidak lagi dipakai."
            title="Perangkat aktif"
            accessory={
              <SecondaryButton
                onClick={() => {
                  window.location.href = createPlatformSessionsPath(locale);
                }}
                type="button"
              >
                Buka
              </SecondaryButton>
            }
          />
          <div
            className="rounded-[22px] px-4 py-3 text-[12.5px] leading-6 text-slate-500"
            style={{ backgroundColor: 'var(--ui-surface-muted)' }}
          >
            Gunakan halaman keamanan saat Anda ingin memperbarui password, lalu buka sesi aktif untuk meninjau perangkat
            yang masih tersambung.
          </div>
        </div>
      </MarketplaceProfileSettingsSheet>

      <MarketplaceSupportSheet
        description="Buat tiket baru atau tinjau bantuan yang sedang berjalan tanpa meninggalkan alur profil."
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Support center"
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <MarketplaceStatusFilters>
              {supportQuickSubjects.map((subject) => (
                <MarketplaceFilterChip
                  active={supportForm.subject === subject}
                  key={subject}
                  onClick={() => setSupportForm((current) => ({ ...current, subject }))}
                >
                  {subject}
                </MarketplaceFilterChip>
              ))}
            </MarketplaceStatusFilters>
            <TextField
              label="Subjek"
              value={supportForm.subject}
              onChange={(event) => setSupportForm((current) => ({ ...current, subject: event.target.value }))}
            />
            <TextAreaField
              label="Detail"
              value={supportForm.details}
              onChange={(event) => setSupportForm((current) => ({ ...current, details: event.target.value }))}
            />
            <PrimaryButton
              className="w-full"
              disabled={busy || !supportForm.subject.trim() || !supportForm.details.trim()}
              onClick={handleCreateSupport}
              type="button"
            >
              {busy ? 'Mengirim...' : 'Buat tiket'}
            </PrimaryButton>
          </div>

          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Tiket terbaru
            </div>
            <div className="space-y-3">
              {tickets.slice(0, 3).length ? (
                tickets
                  .slice(0, 3)
                  .map((ticket) => (
                    <MarketplaceListCard
                      key={ticket.id}
                      badge={<StatusPill tone="accent">{supportStatusLabel(ticket.status, locale)}</StatusPill>}
                      description={ticket.details}
                      subtitle={ticket.priority}
                      title={ticket.subject}
                    />
                  ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-5 text-[13px] leading-6 text-slate-500">
                  Belum ada tiket yang berjalan dari akun ini.
                </div>
              )}
            </div>
          </div>

          <SecondaryButton
            className="w-full"
            onClick={() => {
              window.location.href = createLocalizedPath(locale, '/support');
            }}
            type="button"
          >
            Support penuh
          </SecondaryButton>
        </div>
      </MarketplaceSupportSheet>
    </MarketplaceMobileShell>
  );
}
