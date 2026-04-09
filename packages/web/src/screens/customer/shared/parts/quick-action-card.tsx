'use client';

import type { ReactNode } from 'react';

export function MarketplaceQuickActionCard({
  description,
  icon,
  onClick,
  title,
}: {
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[172px] flex-col rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-5 text-left shadow-[0_18px_42px_-36px_rgba(15,23,42,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-pink-50 text-pink-500">{icon}</div>
      <div className="mt-5">
        <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-[12.5px] leading-6 text-slate-500">{description}</p>
      </div>
    </button>
  );
}
