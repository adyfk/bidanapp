'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarRange,
  ChevronRight,
  Database,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { AdminConsoleSection } from '../../../screen-config/sections';

export type AdminNavVisual = {
  badgeClassName: string;
  description: string;
  icon: LucideIcon;
  kicker: string;
  pulseClassName: string;
};

export const adminNavVisuals: Record<Exclude<AdminConsoleSection, 'login'>, AdminNavVisual> = {
  customers: {
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    description: 'Lihat customer aktif dan konteks dasar akun mereka.',
    icon: UsersRound,
    kicker: 'Customer desk',
    pulseClassName: 'bg-cyan-400',
  },
  orders: {
    badgeClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    description: 'Pantau transaksi, pembayaran, dan tindak lanjut order.',
    icon: CalendarRange,
    kicker: 'Order desk',
    pulseClassName: 'bg-indigo-400',
  },
  overview: {
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
    description: 'Ringkasan KPI, finance snapshot, dan antrean inti.',
    icon: LayoutDashboard,
    kicker: 'Ikhtisar',
    pulseClassName: 'bg-sky-400',
  },
  payouts: {
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    description: 'Pantau payout profesional dan status pencairannya.',
    icon: Wallet,
    kicker: 'Payout desk',
    pulseClassName: 'bg-emerald-400',
  },
  professionals: {
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    description: 'Review aplikasi, dokumen, dan kesiapan halaman profesional.',
    icon: ShieldCheck,
    kicker: 'Antrean review',
    pulseClassName: 'bg-amber-400',
  },
  refunds: {
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    description: 'Kelola refund request dan tindak lanjut pembayarannya.',
    icon: Wallet,
    kicker: 'Refund desk',
    pulseClassName: 'bg-rose-400',
  },
  studio: {
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    description: 'Lihat snapshot revenue, payout, refund, dan support.',
    icon: Database,
    kicker: 'Data studio',
    pulseClassName: 'bg-slate-400',
  },
  support: {
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    description: 'Kelola ticket support, triage, dan eskalasi.',
    icon: LifeBuoy,
    kicker: 'Helpdesk',
    pulseClassName: 'bg-rose-400',
  },
};

export function AdminNavLink({
  href,
  isActive,
  label,
  metricLabel,
  section,
}: {
  href: string;
  isActive: boolean;
  label: string;
  metricLabel: string;
  section: Exclude<AdminConsoleSection, 'login'>;
}) {
  const navVisual = adminNavVisuals[section];
  const Icon = navVisual.icon;

  return (
    <a
      className={`group relative block overflow-hidden rounded-[24px] border px-4 py-4 transition ${
        isActive
          ? 'border-white/18 bg-white/[0.13] shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.08]'
      }`}
      href={href}
    >
      <span
        className={`absolute inset-y-4 left-0 w-1 rounded-full transition ${isActive ? navVisual.pulseClassName : 'bg-transparent group-hover:bg-white/18'}`}
      />
      <div className="flex items-start gap-3 pl-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${isActive ? 'border-white/14 bg-white/12 text-white' : 'border-white/10 bg-slate-950/18 text-slate-100'}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">{navVisual.kicker}</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-white">{label}</p>
              <p className="mt-1 text-[12px] leading-5 text-slate-300">{navVisual.description}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isActive ? navVisual.badgeClassName : 'border-white/10 bg-white/8 text-slate-100'}`}
              >
                {metricLabel}
              </span>
              <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export function AdminQuickActionCard({
  description,
  href,
  label,
  metric,
  tone,
}: {
  description: string;
  href: string;
  label: string;
  metric: string;
  tone: 'amber' | 'rose' | 'sky';
}) {
  const toneClassNames = {
    amber: 'border-amber-200 bg-[linear-gradient(180deg,#fff9eb_0%,#fff4d6_100%)] text-amber-950',
    rose: 'border-rose-200 bg-[linear-gradient(180deg,#fff5f6_0%,#ffe5ea_100%)] text-rose-950',
    sky: 'border-sky-200 bg-[linear-gradient(180deg,#f4f9ff_0%,#e4f1ff_100%)] text-sky-950',
  } as const;

  return (
    <a
      className={`group flex h-full flex-col justify-between rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-28px_rgba(15,23,42,0.3)] ${toneClassNames[tone]}`}
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
          <p className="mt-3 text-[28px] font-black tracking-[-0.04em]">{metric}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 rotate-[-45deg] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <p className="mt-4 text-sm leading-6 opacity-80">{description}</p>
    </a>
  );
}
