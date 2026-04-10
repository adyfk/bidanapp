'use client';

import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function WorkspaceActionButton({
  icon,
  title,
  href,
  variant,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  variant: 'primary' | 'secondary';
}) {
  return (
    <a
      className={`flex min-h-[78px] items-start justify-between gap-3 rounded-[24px] border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
        variant === 'primary'
          ? 'text-white shadow-[0_22px_34px_-22px_rgba(18,59,74,0.38)]'
          : 'border-slate-200 bg-white text-slate-900 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.22)] hover:bg-slate-50'
      }`}
      href={href}
      style={
        variant === 'primary'
          ? {
              background:
                'linear-gradient(180deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-primary) 66%, var(--ui-secondary)) 100%)',
              borderColor: 'color-mix(in srgb, var(--ui-primary) 22%, white)',
            }
          : undefined
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
            variant === 'primary' ? 'bg-white/18 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {icon}
        </div>
        <span
          className={`whitespace-normal text-[13.5px] font-bold leading-5 ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}
        >
          {title}
        </span>
      </div>
      <ArrowRight className={`mt-1 h-4 w-4 flex-shrink-0 ${variant === 'primary' ? 'text-white' : 'text-slate-400'}`} />
    </a>
  );
}
