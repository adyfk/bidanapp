'use client';

export function ProfessionalTabGrid({
  items,
  value,
}: {
  items: Array<{ href: string; id: string; label: string }>;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-2 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)]">
      <div className="grid grid-cols-2 gap-1.5 rounded-[22px] bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.92)_100%)] p-1.5">
        {items.map((tab) => {
          const active = tab.id === value;
          return (
            <a
              key={tab.id}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[54px] items-center justify-center rounded-[16px] px-3.5 py-3 text-center text-[12.5px] font-semibold leading-[1.15rem] transition-all ${
                active
                  ? 'bg-white shadow-[0_18px_28px_-24px_rgba(18,59,74,0.18)] ring-1'
                  : 'text-slate-600 hover:bg-white/78 hover:text-slate-800'
              }`}
              href={tab.href}
              style={
                active
                  ? {
                      color: 'var(--ui-primary)',
                      borderColor: 'var(--ui-border)',
                    }
                  : undefined
              }
            >
              <span className="whitespace-normal text-balance">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
