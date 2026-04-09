'use client';

export function AdminLoginInfoTile({
  body,
  highlighted = false,
  title,
}: {
  body: string;
  highlighted?: boolean;
  title: string;
}) {
  return (
    <div
      className={`rounded-[26px] border p-4 ${
        highlighted
          ? 'border-sky-300/35 bg-sky-400/[0.14] shadow-[0_18px_36px_-28px_rgba(56,189,248,0.35)]'
          : 'border-white/10 bg-white/[0.05]'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{body}</p>
    </div>
  );
}
