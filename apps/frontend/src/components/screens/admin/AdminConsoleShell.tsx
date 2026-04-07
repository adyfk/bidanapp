'use client';

import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarRange,
  ChevronRight,
  Command,
  Database,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  type LucideIcon,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  adminBadgeClass,
  adminDarkSurfaceClass,
  adminInsetSurfaceClass,
  adminMonoClass,
  adminSecondaryButtonClass,
  adminSurfaceClass,
} from '@/components/screens/admin/admin-theme';
import { useAdminConsoleData } from '@/features/admin/hooks/useAdminConsoleData';
import { useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { useSupportDesk } from '@/features/admin/hooks/useSupportDesk';
import { ADMIN_NAV_ITEMS, ADMIN_ROUTES, getAdminNavItem } from '@/features/admin/lib/routes';

interface AdminConsoleShellProps {
  children: ReactNode;
}

const focusAreaLabels = {
  catalog: 'Katalog',
  ops: 'Operasional',
  reviews: 'Review',
  support: 'Support',
} as const;

const focusAreaDescriptions = {
  catalog: 'Struktur layanan, cakupan provider, dan mode delivery diringkas dari satu alur kerja.',
  ops: 'Customer, appointment, dan runtime aktif ditampilkan seperti desk operasional yang mudah dipindai.',
  reviews: 'Approval profesional, publish status, dan tindak lanjut revisi dipusatkan di antrean review.',
  support: 'Ticket aktif, refund, dan eskalasi diprioritaskan dalam pola helpdesk yang lebih familiar.',
} as const;

const presenceToneClassNames = {
  away: 'border-slate-300/25 bg-slate-300/10 text-slate-100',
  busy: 'border-amber-300/35 bg-amber-400/15 text-amber-100',
  online: 'border-emerald-300/35 bg-emerald-400/15 text-emerald-100',
} as const;

const navVisuals: Record<
  string,
  {
    badgeClassName: string;
    icon: LucideIcon;
    kicker: string;
    pulseClassName: string;
  }
> = {
  [ADMIN_ROUTES.overview]: {
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: LayoutDashboard,
    kicker: 'Ikhtisar',
    pulseClassName: 'bg-sky-400',
  },
  [ADMIN_ROUTES.customers]: {
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: UsersRound,
    kicker: 'Customer desk',
    pulseClassName: 'bg-cyan-400',
  },
  [ADMIN_ROUTES.professionals]: {
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: ShieldCheck,
    kicker: 'Approval queue',
    pulseClassName: 'bg-amber-400',
  },
  [ADMIN_ROUTES.services]: {
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: Building2,
    kicker: 'Catalog',
    pulseClassName: 'bg-emerald-400',
  },
  [ADMIN_ROUTES.appointments]: {
    badgeClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    icon: CalendarRange,
    kicker: 'Booking desk',
    pulseClassName: 'bg-indigo-400',
  },
  [ADMIN_ROUTES.support]: {
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: LifeBuoy,
    kicker: 'Helpdesk',
    pulseClassName: 'bg-rose-400',
  },
  [ADMIN_ROUTES.studio]: {
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: Database,
    kicker: 'Data',
    pulseClassName: 'bg-slate-400',
  },
};

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

const SectionEyebrow = ({ label, tone = 'dark' }: { label: string; tone?: 'dark' | 'light' }) => (
  <p
    className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
      tone === 'light' ? 'text-slate-300' : 'text-slate-400'
    }`}
  >
    {label}
  </p>
);

const SidebarStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
    <p className={`mt-2 text-sm font-semibold text-white ${adminMonoClass}`}>{value}</p>
  </div>
);

const StatusChip = ({
  label,
  tone = 'neutral',
  value,
}: {
  label: string;
  tone?: 'emerald' | 'neutral';
  value: string;
}) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
      tone === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-slate-200 bg-white text-slate-600'
    }`}
  >
    <span className="uppercase tracking-[0.14em] text-slate-400">{label}</span>
    <span className={adminMonoClass}>{value}</span>
  </span>
);

const QuickActionCard = ({
  description,
  href,
  label,
  metric,
  tone,
}: {
  description: string;
  href: Route;
  label: string;
  metric: string;
  tone: 'amber' | 'rose' | 'sky';
}) => {
  const toneClassNames = {
    amber: 'border-amber-200 bg-[linear-gradient(180deg,#fff9eb_0%,#fff4d6_100%)] text-amber-950',
    rose: 'border-rose-200 bg-[linear-gradient(180deg,#fff5f6_0%,#ffe5ea_100%)] text-rose-950',
    sky: 'border-sky-200 bg-[linear-gradient(180deg,#f4f9ff_0%,#e4f1ff_100%)] text-sky-950',
  } as const;

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col justify-between rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-28px_rgba(15,23,42,0.3)] ${toneClassNames[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
          <p className={`mt-3 text-[28px] font-black tracking-[-0.04em] ${adminMonoClass}`}>{metric}</p>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <p className="mt-4 text-sm leading-6 opacity-80">{description}</p>
    </Link>
  );
};

const SidebarNavLink = ({
  description,
  href,
  isActive,
  label,
  metricLabel,
}: {
  description: string;
  href: Route;
  isActive: boolean;
  label: string;
  metricLabel: string;
}) => {
  const navVisual = navVisuals[href] || navVisuals[ADMIN_ROUTES.overview];
  const Icon = navVisual.icon;

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[24px] border px-4 py-4 transition ${
        isActive
          ? 'border-white/18 bg-white/[0.13] shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.08]'
      }`}
    >
      <span
        className={`absolute inset-y-4 left-0 w-1 rounded-full transition ${
          isActive ? navVisual.pulseClassName : 'bg-transparent group-hover:bg-white/18'
        }`}
      />
      <div className="flex items-start gap-3 pl-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${
            isActive ? 'border-white/14 bg-white/12 text-white' : 'border-white/10 bg-slate-950/18 text-slate-100'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">{navVisual.kicker}</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-white">{label}</p>
              <p className="mt-1 text-[12px] leading-5 text-slate-300">{description}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  isActive ? navVisual.badgeClassName : 'border-white/10 bg-white/8 text-slate-100'
                }`}
              >
                {metricLabel}
              </span>
              <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const MobileNavLink = ({
  href,
  isActive,
  label,
  metricLabel,
}: {
  href: Route;
  isActive: boolean;
  label: string;
  metricLabel: string;
}) => {
  const navVisual = navVisuals[href] || navVisuals[ADMIN_ROUTES.overview];
  const Icon = navVisual.icon;

  return (
    <Link
      href={href}
      className={`rounded-[20px] border px-4 py-3 transition ${
        isActive ? 'border-white/18 bg-white/[0.12]' : 'border-white/10 bg-white/[0.05] hover:bg-white/[0.09]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/20 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-300">{metricLabel}</p>
        </div>
      </div>
    </Link>
  );
};

export const AdminConsoleShell = ({ children }: AdminConsoleShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const commandInputRef = useRef<HTMLInputElement>(null);
  const [commandQuery, setCommandQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { activeAdmin, logout, session } = useAdminSession();
  const { appointments, consumers, modifiedTableNames, professionals, services, snapshotSavedAt } =
    useAdminConsoleData();
  const { savedAt: supportSavedAt, tickets } = useSupportDesk();

  const isStudioEnabled = ADMIN_NAV_ITEMS.some((item) => item.href === ADMIN_ROUTES.studio);
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

    if (href === ADMIN_ROUTES.studio) {
      return modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Sinkron';
    }

    return `${openTickets + modifiedTableCount} sinyal`;
  };

  const handleQuickJump = () => {
    if (!primaryCommandItem) {
      return;
    }

    router.push(primaryCommandItem.href);
  };

  const quickActions = [
    {
      description:
        urgentTickets > 0
          ? 'Ticket urgent masih perlu triage cepat dari tim support.'
          : 'Buka helpdesk untuk review assignment, refund, dan SLA ticket yang masih aktif.',
      href: ADMIN_ROUTES.support,
      label: 'Support Queue',
      metric: urgentTickets > 0 ? `${urgentTickets} urgent` : `${openTickets} aktif`,
      tone: 'rose' as const,
    },
    {
      description: 'Masuk ke approval queue untuk follow up profesional yang menunggu verifikasi atau publish.',
      href: ADMIN_ROUTES.professionals,
      label: 'Approval Queue',
      metric: `${professionals.length} roster`,
      tone: 'sky' as const,
    },
    {
      description:
        modifiedTableCount > 0
          ? isStudioEnabled
            ? 'Ada perubahan data lokal. Audit tabel sebelum pindah skenario operasional.'
            : 'Ada perubahan lokal yang perlu dicek ulang sebelum melanjutkan operasi.'
          : 'Pantau alur booking aktif dan status data dari desk operasional yang sama.',
      href: modifiedTableCount > 0 && isStudioEnabled ? ADMIN_ROUTES.studio : ADMIN_ROUTES.appointments,
      label: modifiedTableCount > 0 && isStudioEnabled ? 'Perubahan Data' : 'Booking Desk',
      metric: modifiedTableCount > 0 ? `${modifiedTableCount} tabel` : `${appointments.length} booking`,
      tone: 'amber' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22)_0%,transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12)_0%,transparent_24%),linear-gradient(180deg,#edf3f9_0%,#f7fafc_24%,#f6f8fb_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1720px] gap-5 px-4 py-5 xl:px-6">
        <aside className="hidden w-[320px] flex-shrink-0 xl:block">
          <div
            className={`${adminDarkSurfaceClass} sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col overflow-hidden text-white`}
          >
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <SectionEyebrow label="Admin Dashboard" tone="light" />
                  <p className="mt-1 text-lg font-bold text-white">BidanApp Ops</p>
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.07] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SectionEyebrow label="Operator aktif" tone="light" />
                    <p className="mt-2 text-[18px] font-bold text-white">{activeAdmin?.name || 'Admin'}</p>
                    <p className="mt-1 text-sm text-slate-300">{activeAdmin?.title || 'Operator internal'}</p>
                  </div>
                  {activeAdmin ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${presenceToneClassNames[activeAdmin.presence]}`}
                    >
                      {activeAdmin.presence}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-[13px] leading-6 text-slate-300">
                  Shift {activeAdmin?.shiftLabel || 'internal'}.
                  <span className="text-slate-200"> Fokus utama: {focusAreaLabel}.</span>
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SidebarStat label="Support" value={`${openTickets} aktif`} />
                <SidebarStat
                  label="Data"
                  value={modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Sinkron'}
                />
                <SidebarStat label="Resume" value={lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'} />
                <SidebarStat label="Login" value={formatRelativeDateLabel(session.lastLoginAt)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <SectionEyebrow label="Navigasi modul" tone="light" />
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Setiap modul sekarang dirapikan seperti dashboard admin standar: ringkasan, antrean, dan panel kerja.
              </p>

              <nav className="mt-4 space-y-2">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    description={item.description}
                    href={item.href}
                    isActive={pathname === item.href}
                    label={item.label}
                    metricLabel={getNavMetricLabel(item.href)}
                  />
                ))}
              </nav>

              <div className="mt-5 rounded-[26px] border border-white/10 bg-slate-950/22 p-4">
                <SectionEyebrow label="Area fokus" tone="light" />
                <p className="mt-2 text-base font-bold text-white">{focusAreaLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{focusAreaDescription}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {focusRoutes.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.1]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <FolderKanban className="h-4 w-4" />
                  Sinkronisasi workspace
                </div>
                <div className="mt-4 grid gap-3">
                  <SidebarStat label="Support sync" value={formatDateLabel(supportSavedAt)} />
                  <SidebarStat label="Data console" value={formatDateLabel(snapshotSavedAt)} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className={`${adminDarkSurfaceClass} p-4 text-white xl:hidden`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionEyebrow label="Admin Dashboard" tone="light" />
                <h1 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-white">{currentNavItem.label}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">{currentNavItem.description}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100">
                {currentNavItem.shortLabel}
              </span>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SectionEyebrow label="Operator aktif" tone="light" />
                  <p className="mt-2 text-base font-bold text-white">{activeAdmin?.name || 'Admin'}</p>
                  <p className="mt-1 text-sm text-slate-300">{activeAdmin?.title || 'Operator internal'}</p>
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
                Shift {activeAdmin?.shiftLabel || 'internal'}.
                <span className="text-slate-200"> Fokus {focusAreaLabel.toLowerCase()}.</span>
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SidebarStat label="Support" value={`${openTickets} aktif`} />
              <SidebarStat label="Data" value={modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Sinkron'} />
              <SidebarStat label="Resume" value={lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'} />
              <SidebarStat label="Login" value={formatRelativeDateLabel(session.lastLoginAt)} />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ADMIN_NAV_ITEMS.map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={item.href}
                  isActive={pathname === item.href}
                  label={item.label}
                  metricLabel={getNavMetricLabel(item.href)}
                />
              ))}
            </div>
          </div>

          <header className={`${adminSurfaceClass} px-5 py-5`}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={adminBadgeClass}>{focusAreaLabel}</span>
                    <span className={adminBadgeClass}>{currentNavItem.shortLabel}</span>
                    <span className={adminBadgeClass}>Login {formatRelativeDateLabel(session.lastLoginAt)}</span>
                  </div>
                  <h1 className="mt-3 text-[32px] font-black tracking-[-0.04em] text-slate-950">
                    {currentNavItem.label}
                  </h1>
                  <p className="mt-2 max-w-[70ch] text-sm leading-7 text-slate-600">{currentNavItem.description}</p>
                  <p className="mt-2 max-w-[74ch] text-sm leading-7 text-slate-500">{focusAreaDescription}</p>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(300px,380px)_minmax(220px,260px)_auto]">
                  <form
                    className="relative"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleQuickJump();
                    }}
                  >
                    <label className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Cari modul
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
                          placeholder="Cari support, approval, data, booking..."
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
                            Tidak ada modul yang cocok dengan kata kunci tersebut.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </form>

                  <div className={`${adminInsetSurfaceClass} px-4 py-3`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Sesi admin</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {activeAdmin?.name || session.email || 'Admin session'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.expiresAt ? `Berlaku sampai ${formatDateLabel(session.expiresAt)}` : 'Session aktif'}
                    </p>
                  </div>

                  <button type="button" onClick={logout} className={adminSecondaryButtonClass}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>

              <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
                <div className="grid gap-4 md:grid-cols-3">
                  {quickActions.map((item) => (
                    <QuickActionCard
                      key={item.label}
                      description={item.description}
                      href={item.href}
                      label={item.label}
                      metric={item.metric}
                      tone={item.tone}
                    />
                  ))}
                </div>

                <div className={`${adminInsetSurfaceClass} p-4`}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Activity className="h-4 w-4 text-[#0f4fa8]" />
                    Kondisi workspace
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusChip label="Operator" value={activeAdmin?.name || 'Admin'} />
                    <StatusChip
                      label="Presence"
                      tone={activeAdmin?.presence === 'online' ? 'emerald' : 'neutral'}
                      value={activeAdmin?.presence || 'unknown'}
                    />
                    <StatusChip label="Support" value={`${openTickets} aktif`} />
                    <StatusChip
                      label="Data"
                      value={modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Sinkron'}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Gunakan <span className="font-semibold text-slate-900">Ctrl/Cmd + K</span> untuk pindah modul lebih
                    cepat. Resume terakhir:
                    <span className="font-semibold text-slate-900">
                      {' '}
                      {lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'}
                    </span>
                    .
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={ADMIN_ROUTES.overview} className={adminSecondaryButtonClass}>
                      Dashboard utama
                    </Link>
                    <Link href={ADMIN_ROUTES.support} className={adminSecondaryButtonClass}>
                      Buka helpdesk
                    </Link>
                  </div>
                </div>
              </div>

              <nav className="overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const navVisual = navVisuals[item.href] || navVisuals[ADMIN_ROUTES.overview];

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? 'border-[#0f4fa8] bg-[#0f4fa8] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${
                            isActive ? 'bg-white/14 text-slate-100' : navVisual.badgeClassName
                          }`}
                        >
                          {getNavMetricLabel(item.href)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </header>

          <main className="min-h-[calc(100vh-12rem)]">{children}</main>
        </div>
      </div>
    </div>
  );
};
