'use client';

import { SecondaryButton } from '@marketplace/ui';
import { Building2 } from 'lucide-react';
import type { AdminConsoleSection } from '../../../screen-config/sections';
import { AdminEyebrow } from './eyebrow';
import { AdminNavLink } from './nav-link';
import { AdminSidebarStat } from './sidebar-stat';

export function AdminSidebar({
  busy,
  currentSection,
  navItems,
  onLogout,
  operatorEmail,
  ordersCount,
  pendingCount,
  platformName,
  revenueLabel,
  supportCount,
}: {
  busy: boolean;
  currentSection: Exclude<AdminConsoleSection, 'login'>;
  navItems: Array<{ href: string; id: Exclude<AdminConsoleSection, 'login'>; label: string; metricLabel: string }>;
  onLogout: () => void;
  operatorEmail: string;
  ordersCount: number;
  pendingCount: number;
  platformName: string;
  revenueLabel: string;
  supportCount: number;
}) {
  return (
    <aside className="hidden w-[320px] flex-shrink-0 xl:block">
      <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,#0f172a_0%,#13253f_100%)] text-white shadow-[0_35px_90px_-46px_rgba(15,23,42,0.75)]">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <AdminEyebrow label="Admin Dashboard" tone="light" />
              <p className="mt-1 text-lg font-bold text-white">{platformName} Admin</p>
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.07] p-4">
            <AdminEyebrow label="Operator aktif" tone="light" />
            <p className="mt-2 text-[18px] font-bold text-white">{operatorEmail}</p>
            <p className="mt-1 text-sm text-slate-300">{platformName} console</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AdminSidebarStat label="Support" value={`${supportCount} aktif`} />
            <AdminSidebarStat label="Review" value={`${pendingCount} review`} />
            <AdminSidebarStat label="Orders" value={`${ordersCount} order`} />
            <AdminSidebarStat label="Revenue" value={revenueLabel} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AdminEyebrow label="Navigasi modul" tone="light" />
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Review, support, finance, dan order dipusatkan dalam satu shell operasional.
          </p>
          <nav className="mt-4 space-y-2">
            {navItems.map((item) => (
              <AdminNavLink
                key={item.id}
                href={item.href}
                isActive={currentSection === item.id}
                label={item.label}
                metricLabel={item.metricLabel}
                section={item.id}
              />
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-5">
          <SecondaryButton disabled={busy} onClick={onLogout} type="button">
            {busy ? 'Memproses...' : 'Logout admin'}
          </SecondaryButton>
        </div>
      </div>
    </aside>
  );
}
