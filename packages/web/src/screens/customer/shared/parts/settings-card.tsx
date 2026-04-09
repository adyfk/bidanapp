'use client';

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function MarketplaceSettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_22px_50px_-40px_rgba(15,23,42,0.25)]">
      {children}
    </div>
  );
}

export function MarketplaceSettingsRow({
  description,
  icon,
  iconClassName,
  isLast = false,
  title,
  trailing,
}: {
  description: string;
  icon: ReactNode;
  iconClassName: string;
  isLast?: boolean;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-4 ${isLast ? '' : 'border-b border-slate-100'}`}>
      <div className="flex min-w-0 items-center gap-4 text-slate-700">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-[12.5px] leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {trailing || <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-300" />}
    </div>
  );
}

export function MarketplaceDangerButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-[28px] border border-red-100 bg-[linear-gradient(180deg,#FFF4F4_0%,#FFECEC_100%)] p-4 font-bold text-red-500 shadow-[0_18px_40px_-34px_rgba(239,68,68,0.28)] transition-colors active:bg-red-100"
    >
      {icon}
      {label}
    </button>
  );
}
