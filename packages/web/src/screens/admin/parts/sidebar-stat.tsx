'use client';

export function AdminSidebarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
