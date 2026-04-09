'use client';

import { type AdminNavVisual, AdminQuickActionCard } from './nav-link';

export function AdminDashboardHeader({
  currentSectionLabel,
  navVisual,
  platformName,
  quickActions,
}: {
  currentSectionLabel: string;
  navVisual: AdminNavVisual;
  platformName: string;
  quickActions: Array<{
    description: string;
    href: string;
    label: string;
    metric: string;
    tone: 'amber' | 'rose' | 'sky';
  }>;
}) {
  return (
    <header className="rounded-[32px] border border-white/70 bg-white/92 px-5 py-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.22)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${navVisual.badgeClassName}`}
              >
                {navVisual.kicker}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {platformName}
              </span>
            </div>
            <h1 className="mt-3 text-[32px] font-black tracking-[-0.04em] text-slate-950">{currentSectionLabel}</h1>
            <p className="mt-2 max-w-[58ch] text-sm leading-7 text-slate-600">{navVisual.description}</p>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {quickActions.map((action) => (
              <AdminQuickActionCard
                key={action.href}
                description={action.description}
                href={action.href}
                label={action.label}
                metric={action.metric}
                tone={action.tone}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
