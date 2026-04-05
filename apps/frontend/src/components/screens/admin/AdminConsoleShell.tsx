'use client';

import {
  ArrowUpRight,
  Building2,
  CalendarRange,
  ChevronRight,
  Command,
  Database,
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
import { useAdminConsoleData } from '@/features/admin/hooks/useAdminConsoleData';
import { useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { useSupportDesk } from '@/features/admin/hooks/useSupportDesk';
import { ADMIN_NAV_ITEMS, ADMIN_ROUTES, getAdminNavItem } from '@/features/admin/lib/routes';

interface AdminConsoleShellProps {
  children: ReactNode;
}

const surfacePanelClass =
  'rounded-[32px] border border-slate-200/80 bg-white/92 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)] backdrop-blur-xl';
const railPanelClass =
  'rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] shadow-[0_24px_70px_-46px_rgba(15,23,42,0.7)] backdrop-blur-xl';
const focusAreaLabels = {
  catalog: 'Kontrol katalog',
  ops: 'Desk operasional',
  reviews: 'Antrean review',
  support: 'Desk support',
} as const;

const focusAreaDescriptions = {
  catalog: 'Fokus pada struktur katalog, readiness provider, dan konsistensi mode layanan lintas area.',
  ops: 'Pantau flow customer, appointment, dan runtime agar jalur booking tetap rapi dan bisa dioperasikan cepat.',
  reviews: 'Dorong approval FIFO profesional, verifikasi publish, dan tindak lanjut revisi supaya backlog terkendali.',
  support: 'Prioritaskan ticket aktif, assignment PIC, refund context, dan SLA response dari satu command desk.',
} as const;

const presenceToneClassNames = {
  away: 'border-slate-300/30 bg-slate-100/10 text-slate-200',
  busy: 'border-amber-300/35 bg-amber-400/10 text-amber-100',
  online: 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100',
} as const;

const quickActionToneClassNames = {
  amber: 'border-amber-200 bg-amber-50/80 text-amber-900',
  rose: 'border-rose-200 bg-rose-50/80 text-rose-900',
  sky: 'border-sky-200 bg-sky-50/80 text-sky-900',
} as const;

const navVisuals: Record<
  string,
  {
    badgeClassName: string;
    icon: LucideIcon;
    kicker: string;
  }
> = {
  [ADMIN_ROUTES.overview]: {
    badgeClassName: 'border-sky-300/30 bg-sky-400/12 text-sky-100',
    icon: LayoutDashboard,
    kicker: 'Ikhtisar lintas modul',
  },
  [ADMIN_ROUTES.customers]: {
    badgeClassName: 'border-cyan-300/30 bg-cyan-400/12 text-cyan-100',
    icon: UsersRound,
    kicker: 'Konteks customer',
  },
  [ADMIN_ROUTES.professionals]: {
    badgeClassName: 'border-amber-300/30 bg-amber-400/12 text-amber-100',
    icon: ShieldCheck,
    kicker: 'Workflow verifikasi',
  },
  [ADMIN_ROUTES.services]: {
    badgeClassName: 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100',
    icon: Building2,
    kicker: 'Peta katalog',
  },
  [ADMIN_ROUTES.appointments]: {
    badgeClassName: 'border-indigo-300/30 bg-indigo-400/12 text-indigo-100',
    icon: CalendarRange,
    kicker: 'Operasional layanan',
  },
  [ADMIN_ROUTES.support]: {
    badgeClassName: 'border-rose-300/30 bg-rose-400/12 text-rose-100',
    icon: LifeBuoy,
    kicker: 'Desk triage',
  },
  [ADMIN_ROUTES.studio]: {
    badgeClassName: 'border-slate-300/30 bg-slate-100/10 text-slate-100',
    icon: Database,
    kicker: 'Kontrol data',
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

const SectionEyebrow = ({ label }: { label: string }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
);

const SidebarStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[22px] border border-white/10 bg-slate-950/20 px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-semibold leading-5 text-white">{value}</p>
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

const AdminRailLink = ({
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
      className={`group relative block overflow-hidden rounded-[24px] border px-4 py-4 transition-all ${
        isActive
          ? 'border-white/20 bg-white/[0.11] shadow-[0_20px_40px_-32px_rgba(15,23,42,0.6)]'
          : 'border-white/8 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.08]'
      }`}
    >
      <div
        className={`absolute inset-y-4 left-0 w-1 rounded-full transition ${
          isActive ? 'bg-sky-300' : 'bg-transparent group-hover:bg-white/18'
        }`}
      />
      <div className="flex items-start gap-3 pl-2">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${
            isActive ? 'border-white/14 bg-white/12 text-white' : 'border-white/10 bg-slate-950/20 text-slate-200'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{navVisual.kicker}</p>
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

const AdminCompactNavLink = ({
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
      className={`rounded-[22px] border px-4 py-3 transition ${
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
          ? isStudioEnabled
            ? 'Ada perubahan lokal yang belum di-reset. Audit tabel operasional sebelum berganti skenario.'
            : 'Ada perubahan lokal yang belum di-reset. Tinjau modul operasional sebelum berganti skenario.'
          : isStudioEnabled
            ? 'Baseline data masih selaras. Gunakan studio untuk import, export, atau reset data admin bila diperlukan.'
            : 'Baseline data masih selaras. Lanjutkan review operasional dari modul appointment dan support.',
      href: modifiedTableCount > 0 && isStudioEnabled ? ADMIN_ROUTES.studio : ADMIN_ROUTES.appointments,
      label: modifiedTableCount > 0 && isStudioEnabled ? 'Perubahan Data' : 'Operasional Booking',
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

    if (href === ADMIN_ROUTES.studio) {
      return modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Data sinkron';
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#BFDBFE_0%,transparent_24%),radial-gradient(circle_at_top_right,#FDE68A_0%,transparent_18%),linear-gradient(180deg,#E2E8F0_0%,#F8FAFC_18%,#F8FAFC_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 px-4 py-4 lg:px-6">
        <aside className="hidden w-[340px] flex-shrink-0 lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100vh-2rem)] lg:flex-col">
          <div
            className={`${railPanelClass} bg-[linear-gradient(180deg,#0F172A_0%,#111827_42%,#172554_100%)] p-5 text-white`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Admin Console</p>
                <p className="mt-1 text-lg font-bold text-white">BidanApp Ops</p>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.07] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SectionEyebrow label="Persona aktif" />
                  <p className="mt-2 text-[18px] font-bold text-white">{activeAdmin?.name || 'Admin'}</p>
                  <p className="mt-1 text-sm text-slate-300">{activeAdmin?.title || 'Operator console'}</p>
                </div>
                {activeAdmin ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${presenceToneClassNames[activeAdmin.presence]}`}
                  >
                    {activeAdmin.presence}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-[12px] leading-6 text-slate-300">
                Shift {activeAdmin?.shiftLabel || 'internal'} · Fokus {focusAreaLabel.toLowerCase()}
              </p>
            </div>

            <div className="mt-4 rounded-[26px] border border-white/10 bg-slate-950/20 p-4">
              <SectionEyebrow label="Modul aktif" />
              <p className="mt-2 text-lg font-bold text-white">{currentNavItem.label}</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-300">{currentNavItem.description}</p>
              <p className="mt-3 text-[12px] leading-5 text-slate-400">{focusAreaDescription}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SidebarStat label="Support aktif" value={`${openTickets} ticket aktif`} />
              <SidebarStat
                label="Status data"
                value={modifiedTableCount > 0 ? `${modifiedTableCount} tabel berubah` : 'Data sinkron'}
              />
              <SidebarStat label="Ringkasan" value={lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'} />
              <SidebarStat label="Login terakhir" value={formatRelativeDateLabel(session.lastLoginAt)} />
            </div>
          </div>

          <div
            className={`${railPanelClass} mt-5 flex min-h-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#0F172A_0%,#111827_44%,#0F172A_100%)] text-white`}
          >
            <div className="border-b border-white/10 px-4 py-4">
              <SectionEyebrow label="Console map" />
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Setiap modul sekarang dibaca sebagai jalur operasi, bukan kumpulan kartu terpisah.
              </p>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {ADMIN_NAV_ITEMS.map((item) => (
                <AdminRailLink
                  key={item.href}
                  description={item.description}
                  href={item.href}
                  isActive={pathname === item.href}
                  label={item.label}
                  metricLabel={getNavMetricLabel(item.href)}
                />
              ))}
            </nav>

            <div className="border-t border-white/10 p-4">
              <SectionEyebrow label="Focus radar" />
              <div className="mt-3 flex flex-wrap gap-2">
                {focusRoutes.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.1]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className={`${railPanelClass} mt-5 bg-[linear-gradient(180deg,#0F172A_0%,#111827_100%)] p-4 text-white`}>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4" />
              Backend-authenticated admin access
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-300">
              Session admin, sync support desk, dan mutasi operasional tetap dibatasi oleh akses backend aktif.
            </p>
            <div className="mt-4 grid gap-3">
              <SidebarStat label="Support sync" value={formatDateLabel(supportSavedAt)} />
              <SidebarStat label="Data console" value={formatDateLabel(snapshotSavedAt)} />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div
            className={`${railPanelClass} bg-[linear-gradient(180deg,#0F172A_0%,#111827_100%)] p-4 text-white lg:hidden`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionEyebrow label="Admin Console" />
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
                  <SectionEyebrow label="Persona aktif" />
                  <p className="mt-2 text-base font-bold text-white">{activeAdmin?.name || 'Admin'}</p>
                  <p className="mt-1 text-sm text-slate-300">{activeAdmin?.title || 'Operator console'}</p>
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

            <div className="mt-4 grid grid-cols-2 gap-2">
              <SidebarStat label="Support" value={`${openTickets} aktif`} />
              <SidebarStat label="Data" value={modifiedTableCount > 0 ? `${modifiedTableCount} berubah` : 'Bersih'} />
              <SidebarStat label="Ringkasan" value={lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'} />
              <SidebarStat label="Login" value={formatRelativeDateLabel(session.lastLoginAt)} />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {ADMIN_NAV_ITEMS.map((item) => (
                <AdminCompactNavLink
                  key={item.href}
                  href={item.href}
                  isActive={pathname === item.href}
                  label={item.label}
                  metricLabel={getNavMetricLabel(item.href)}
                />
              ))}
            </div>
          </div>

          <header className={`${surfacePanelClass} px-5 py-4`}>
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
                          placeholder="Cari module, support, approval, data..."
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

                  <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Authenticated session
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {activeAdmin?.name || session.email || 'Admin session'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.expiresAt ? `Berlaku sampai ${formatDateLabel(session.expiresAt)}` : 'Session aktif'}
                    </p>
                  </div>

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
                  <SectionEyebrow label="Session pulse" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusChip label="Persona" value={activeAdmin?.name || 'Admin'} />
                    <StatusChip
                      label="Presence"
                      tone={activeAdmin?.presence === 'online' ? 'emerald' : 'slate'}
                      value={activeAdmin?.presence || 'unknown'}
                    />
                    <StatusChip label="Support" value={`${openTickets} aktif`} />
                    <StatusChip
                      label="Data"
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

              <nav className="hidden overflow-x-auto pb-1 lg:block">
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
