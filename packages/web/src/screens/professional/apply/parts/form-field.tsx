'use client';

import type { ReactNode } from 'react';

export const applyFieldClassName =
  'w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[var(--ui-primary)] focus:ring-2 focus:bg-white';

export function FormField({
  children,
  helperText,
  label,
}: {
  children: ReactNode;
  helperText?: string;
  label: string;
}) {
  return (
    <div>
      <span className="mb-2 block text-[12px] font-semibold text-slate-500">{label}</span>
      {children}
      {helperText ? <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{helperText}</p> : null}
    </div>
  );
}
