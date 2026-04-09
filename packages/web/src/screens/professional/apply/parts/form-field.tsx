'use client';

import type { ReactNode } from 'react';

export const applyFieldClassName =
  'w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100';

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
      <label className="mb-2 block text-[12px] font-semibold text-slate-500">{label}</label>
      {children}
      {helperText ? <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{helperText}</p> : null}
    </div>
  );
}
