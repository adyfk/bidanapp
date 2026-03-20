'use client';

import { ArrowUpRight, Building2, ChevronRight, Command, LogOut, Search, ShieldCheck } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useAdminConsoleData } from '@/features/admin/hooks/useAdminConsoleData';
import { useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { useSupportDesk } from '@/features/admin/hooks/useSupportDesk';
import { ADMIN_NAV_ITEMS, ADMIN_ROUTES, getAdminNavItem } from '@/features/admin/lib/routes';

interface AdminConsoleShellProps {
  children: ReactNode;
}

const activeLinkClass = 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.8)]';
const idleLinkClass = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';

const focusAreaLabels = {
  catalog: 'Catalog control',
  ops: 'Operational desk',
  reviews: 'Review queue',
  support: 'Support command',
} as const;

const focusAreaDescriptions = {
  catalog: 'Fokus pada struktur katalog, readiness provider, dan konsistensi mode layanan lintas area.',
  ops: 'Pantau flow customer, appointment, dan runtime agar jalur booking tetap rapi dan bisa dioperasikan cepat.',
  reviews: 'Dorong approval FIFO profesional, verifikasi publish, dan tindak lanjut revisi supaya backlog terkendali.',
  support: 'Prioritaskan ticket aktif, assignment PIC, refund context, dan SLA response dari satu command desk.',
} as const;

const presenceToneClassNames = {
  away: 'border-slate-300 bg-slate-100 text-slate-600',
  busy: 'border-amber-300 bg-amber-50 text-amber-700',
  online: 'border-emerald-300 bg-emerald-50 text-emerald-700',
} as const;

const quickActionToneClassNames = {
  amber: 'border-amber-200 bg-amber-50/80 text-amber-900',
  rose: 'border-rose-200 bg-rose-50/80 text-rose-900',
  sky: 'border-sky-200 bg-sky-50/80 text-sky-900',
} as const;

const formatDateLabel = (value?: string) => {
  if (!value) {
    return 'Belum tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatRelativeDateLabel = (value?: string) => {
  if (!value) {
    return 'Belum ada aktivitas';
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) {
    return 'Baru saja';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  return `${Math.floor(diffHours / 24)} hari lalu`;
};

const SidebarStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
    <p className="mt-2 text-sm font-semibold text-white">{value}</p>
  </div>
);

const StatusChip = ({ label, tone = 'slate', value }: { label: string; tone?: 'emerald' | 'slate'; value: string }) => (
  <div
    className={`rounded-full border px-3 py-2 text-xs font-semibold ${
      tone === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-slate-200 bg-slate-100 text-slate-700'
    }`}
  >
    <span className="mr-2 uppercase tracking-[0.12em] text-slate-400">{label}</span>
    {value}
  </div>
);

const QuickActionCard = ({
  description,
  href,
  label,
  tone,
  value,
}: {
  description: string;
  href: Route;
  label: string;
  tone: keyof typeof quickActionToneClassNames;
  value: string;
}) => (
  <Link
    href={href}
    className={`group rounded-[28px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.45)] ${quickActionToneClassNames[tone]}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
        <p className="mt-2 text-[22px] font-black tracking-[-0.03em]">{value}</p>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </div>
    <p className="mt-3 text-sm leading-6 opacity-80">{description}</p>
  </Link>
);

export const AdminConsoleShell = ({ children }: AdminConsoleShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const commandInputRef = useRef<HTMLInputElement>(null);
  const [commandQuery, setCommandQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { activeAdmin, adminStaff, logout, session, switchAdminPersona } = useAdminSession();
  const { appointments, consumers, modifiedTableNames, professionals, services, snapshotSavedAt } =
    useAdminConsoleData();
  const { savedAt: supportSavedAt, tickets } = useSupportDesk();

  const currentNavItem = getAdminNavItem(pathname) || ADMIN_NAV_ITEMS[0];
  const lastVisitedNavItem = getAdminNavItem(session.lastVisitedRoute);
  const activeFocusArea = activeAdmin?.focusArea || session.focusArea;
  const focusAreaLabel = focusAreaLabels[activeFocusArea];
  const focusAreaDescription = focusAreaDescriptions[activeFocusArea];
  const focusRoutes = ADMIN_NAV_ITEMS.filter((item) => item.focusArea === activeFocusArea || item.focusArea === 'all');
  const openTickets = tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'refunded').length;
  const urgentTickets = tickets.filter(
    (ticket) => ticket.urgency === 'urgent' && ticket.status !== 'resolved' && ticket.status !== 'refunded',
  ).length;
  const modifiedTableCount = modifiedTableNames.length;
  const normalizedQuery = commandQuery.trim().toLowerCase();
  const filteredCommandItems = (normalizedQuery ? ADMIN_NAV_ITEMS : focusRoutes).filter((item) =>
    [item.label, item.description, item.focusArea, ...item.keywords].join(' ').toLowerCase().includes(normalizedQuery),
  );
  const primaryCommandItem = filteredCommandItems[0] || null;
  const quickActions = [
    {
      description:
        urgentTickets > 0
          ? 'Kasus urgent masih terbuka dan perlu triage cepat dari support desk.'
          : 'Masuk ke desk untuk review assignment, refund, dan SLA ticket aktif.',
      href: ADMIN_ROUTES.support,
      label: 'Support Queue',
      tone: 'rose' as const,
      value: urgentTickets > 0 ? `${urgentTickets} urgent` : `${openTickets} aktif`,
    },
    {
      description: 'Buka antrean review FIFO, verifikasi publish, dan tindak lanjut perubahan profil profesional.',
      href: ADMIN_ROUTES.professionals,
      label: 'Professional Flow',
      tone: 'sky' as const,
      value: `${professionals.length} roster`,
    },
    {
      description:
        modifiedTableCount > 0
          ? 'Ada perubahan lokal yang belum di-reset. Audit table mock sebelum berganti skenario.'
          : 'Seed masih bersih. Gunakan studio untuk import, export, atau reset dataset mock admin.',
      href: modifiedTableCount > 0 ? ADMIN_ROUTES.mock : ADMIN_ROUTES.appointments,
      label: modifiedTableCount > 0 ? 'Mock Changes' : 'Appointment Ops',
      tone: 'amber' as const,
      value: modifiedTableCount > 0 ? `${modifiedTableCount} tabel` : `${appointments.length} booking`,
    },
  ];

  useEffect(() => {
    if (!pathname) {
      return;
    }

    setCommandQuery('');
    setIsCommandOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        commandInputRef.current?.focus();
        setIsCommandOpen(true);
      }

      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        commandInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  const getNavMetricLabel = (href: string) => {
    if (href === ADMIN_ROUTES.customers) {
      return `${consumers.length} customer`;
    }

    if (href === ADMIN_ROUTES.professionals) {
      return `${professionals.length} profesional`;
    }

    if (href === ADMIN_ROUTES.services) {
      return `${services.length} layanan`;
    }

    if (href === ADMIN_ROUTES.appointments) {
      return `${appointments.length} booking`;
    }

    if (href === ADMIN_ROUTES.support) {
      return `${openTickets} aktif`;
    }

    if (href === ADMIN_ROUTES.mock) {
      return modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Seed bersih';
    }

    return `${openTickets + modifiedTableCount} sinyal`;
  };

  const handleQuickJump = () => {
    if (!primaryCommandItem) {
      return;
    }

    router.push(primaryCommandItem.href);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#E2E8F0_0%,#F8FAFC_18%,#F8FAFC_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-[316px] flex-shrink-0 flex-col rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#0F172A_0%,#111827_42%,#172554_100%)] p-5 text-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.7)] lg:flex">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Admin Console</p>
                <p className="mt-1 text-lg font-bold">BidanApp Ops</p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/7 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Persona aktif</p>
                  <p className="mt-2 text-[16px] font-bold">{activeAdmin?.name || 'Admin demo'}</p>
                  <p className="mt-1 text-sm text-slate-300">{activeAdmin?.title || 'Console operator'}</p>
                </div>
                {activeAdmin ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${presenceToneClassNames[activeAdmin.presence]}`}
                  >
                    {activeAdmin.presence}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[12px] leading-5 text-slate-300">
                Shift {activeAdmin?.shiftLabel || 'internal'} · Fokus {focusAreaLabel.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/7 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Module context</p>
            <p className="mt-3 text-lg font-bold text-white">{currentNavItem.label}</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-300">{currentNavItem.description}</p>
            <p className="mt-3 text-[12px] leading-5 text-slate-400">{focusAreaDescription}</p>
          </div>

          <nav className="mt-6 space-y-2">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[24px] border px-4 py-4 transition-all ${isActive ? activeLinkClass : idleLinkClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold">{item.label}</p>
                      <p className={`mt-1 text-[12px] leading-5 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                        {item.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getNavMetricLabel(item.href)}
                      </span>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/7 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Radar fokus</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {focusRoutes.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-white/7 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4" />
              Demo auth client-side
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-300">
              Console ini disiapkan untuk operasional mock, review flow, dan kontrol QA lokal sebelum backend admin
              terintegrasi.
            </p>

            <div className="mt-4 grid gap-3">
              <SidebarStat label="Support sync" value={formatDateLabel(supportSavedAt)} />
              <SidebarStat label="Mock snapshot" value={formatDateLabel(snapshotSavedAt)} />
              <SidebarStat
                label="Resume terakhir"
                value={lastVisitedNavItem ? lastVisitedNavItem.label : 'Mulai dari overview'}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="rounded-[32px] border border-slate-200 bg-white/92 px-5 py-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)] backdrop-blur-xl">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {focusAreaLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {currentNavItem.shortLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Login {formatRelativeDateLabel(session.lastLoginAt)}
                    </span>
                  </div>
                  <h1 className="mt-3 text-[30px] font-black tracking-[-0.04em] text-slate-950">
                    {currentNavItem.label}
                  </h1>
                  <p className="mt-2 max-w-[72ch] text-sm leading-7 text-slate-500">{currentNavItem.description}</p>
                  <p className="mt-2 max-w-[74ch] text-sm leading-7 text-slate-600">{focusAreaDescription}</p>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(300px,360px)_minmax(220px,260px)_auto]">
                  <form
                    className="relative"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleQuickJump();
                    }}
                  >
                    <label className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Quick jump
                      </span>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={commandInputRef}
                          type="search"
                          value={commandQuery}
                          onChange={(event) => setCommandQuery(event.target.value)}
                          onFocus={() => setIsCommandOpen(true)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-20 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                          placeholder="Cari module, support, approval, mock..."
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          <Command className="h-3 w-3" />K
                        </span>
                      </div>
                    </label>

                    {isCommandOpen ? (
                      <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_50px_-35px_rgba(15,23,42,0.35)]">
                        {filteredCommandItems.length ? (
                          filteredCommandItems.slice(0, 6).map((item) => (
                            <button
                              key={item.href}
                              type="button"
                              onClick={() => {
                                router.push(item.href);
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-[18px] px-3 py-3 text-left transition hover:bg-slate-50"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                              </div>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                {item.shortLabel}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-[18px] px-3 py-4 text-sm text-slate-500">
                            Tidak ada module yang cocok dengan kata kunci itu.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </form>

                  <label className="flex min-w-[220px] flex-col gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Switch persona
                    </span>
                    <select
                      value={session.adminId}
                      onChange={(event) => switchAdminPersona(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                    >
                      {adminStaff.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name} · {admin.focusArea}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.95fr)]">
                <div className="grid gap-3 md:grid-cols-3">
                  {quickActions.map((item) => (
                    <QuickActionCard
                      key={item.label}
                      description={item.description}
                      href={item.href}
                      label={item.label}
                      tone={item.tone}
                      value={item.value}
                    />
                  ))}
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Session pulse</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusChip label="Persona" value={activeAdmin?.name || 'Admin demo'} />
                    <StatusChip
                      label="Presence"
                      tone={activeAdmin?.presence === 'online' ? 'emerald' : 'slate'}
                      value={activeAdmin?.presence || 'unknown'}
                    />
                    <StatusChip label="Support" value={`${openTickets} aktif`} />
                    <StatusChip
                      label="Mock"
                      value={modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Bersih'}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Gunakan <span className="font-semibold text-slate-900">Ctrl/Cmd + K</span> untuk lompat modul dengan
                    cepat. Resume terakhir:{' '}
                    <span className="font-semibold text-slate-900">
                      {lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'}
                    </span>
                    .
                  </p>
                </div>
              </div>

              <nav className="overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`ml-2 text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                          {getNavMetricLabel(item.href)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </header>

          <main className="min-h-[calc(100vh-10rem)]">{children}</main>
        </div>
      </div>
    </div>
  );
};
