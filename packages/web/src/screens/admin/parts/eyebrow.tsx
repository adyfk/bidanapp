'use client';

export function AdminEyebrow({ label, tone = 'dark' }: { label: string; tone?: 'dark' | 'light' }) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === 'light' ? 'text-slate-300' : 'text-slate-400'}`}
    >
      {label}
    </p>
  );
}
