'use client';

export function WorkspaceInfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/92 px-3.5 py-2 text-[12px] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.22)]">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
