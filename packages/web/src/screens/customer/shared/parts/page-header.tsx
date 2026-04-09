'use client';

import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function MarketplaceStickyPageHeader({
  title,
  backHref,
  rightSlot,
}: {
  backHref: string;
  rightSlot?: ReactNode;
  title: string;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFE_100%)] px-4 pb-4 pt-14 shadow-[0_18px_42px_-38px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between">
        <a
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
          href={backHref}
        >
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </a>
        <h1 className="text-[17px] font-bold tracking-[0.01em] text-slate-900">{title}</h1>
        {rightSlot || <div className="w-10" />}
      </div>
    </div>
  );
}
