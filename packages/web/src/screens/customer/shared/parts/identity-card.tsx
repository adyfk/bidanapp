'use client';

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function MarketplaceIdentityCard({
  title,
  subtitle,
  chipLabel,
  chipIcon,
  actionLabel,
  onAction,
}: {
  actionLabel: string;
  chipIcon?: ReactNode;
  chipLabel?: string;
  onAction: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.28)]">
      <div className="flex items-start gap-4">
        <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[18px] font-bold text-pink-600 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.4)]">
          {title.charAt(0).toUpperCase() || 'B'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold leading-tight text-slate-900">{title}</h2>
              <p className="mt-1 text-[13px] font-medium text-slate-500">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-600 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.35)] transition-colors hover:bg-slate-50"
            >
              {actionLabel}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {chipLabel ? (
            <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-pink-100 bg-pink-50/80 px-3 py-1.5 text-[11px] font-semibold text-pink-600">
              {chipIcon}
              <span className="truncate">{chipLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
