'use client';

export function ProfessionalTabGrid({
  items,
  value,
}: {
  items: Array<{ href: string; id: string; label: string }>;
  value: string;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1">
      <div
        className="inline-flex min-w-full gap-2 rounded-[24px] border border-white/80 p-2 shadow-[0_20px_42px_-34px_rgba(88,49,66,0.18)]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, color-mix(in srgb, var(--ui-surface-muted) 48%, white) 100%)',
          borderColor: 'var(--ui-border)',
        }}
      >
        {items.map((tab) => {
          const active = tab.id === value;
          return (
            <a
              key={tab.id}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] min-w-fit items-center justify-center rounded-[18px] px-4 py-3 text-center text-[12.5px] font-semibold leading-[1.15rem] transition-all ${
                active
                  ? 'bg-white shadow-[0_18px_28px_-24px_rgba(88,49,66,0.18)] ring-1'
                  : 'text-slate-600 hover:bg-white/78 hover:text-slate-800'
              }`}
              href={tab.href}
              style={
                active
                  ? {
                      background:
                        'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 32%, white) 100%)',
                      color: 'var(--ui-primary)',
                      borderColor: 'var(--ui-border)',
                    }
                  : undefined
              }
            >
              <span className="whitespace-nowrap">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
