import { type CSSProperties, type ReactNode, useId } from 'react';
import { cx } from './foundations';

export interface MarketplaceNavItem {
  href: string;
  icon: ReactNode;
  id: string;
  label: string;
}

const whiteTextStyle: CSSProperties = {
  color: '#ffffff',
};

export function MarketplaceMobileShell({
  activeNavId,
  children,
  navItems,
  showNav = true,
}: {
  activeNavId?: string;
  children: ReactNode;
  navItems?: MarketplaceNavItem[];
  showNav?: boolean;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ui-background)' }}>
      <div className="mx-auto flex min-h-screen justify-center">
        <div className="relative flex min-h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-[var(--ui-background)] shadow-[0_18px_50px_-26px_rgba(15,23,42,0.24)]">
          <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
      {showNav && navItems?.length ? <MarketplaceBottomNav activeId={activeNavId} items={navItems} /> : null}
    </div>
  );
}

export function MarketplaceBottomNav({ activeId, items }: { activeId?: string; items: MarketplaceNavItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 justify-center px-6">
      <div
        className="pointer-events-auto flex w-full items-center justify-between rounded-full p-2 shadow-2xl"
        style={{ backgroundColor: '#1E1E1E' }}
      >
        <div className="flex items-center justify-between">
          {items.map((item) => {
            const active = item.id === activeId;

            return (
              <a
                key={item.id}
                className={cx(
                  'relative flex items-center justify-center rounded-full transition-all duration-300',
                  active ? 'px-5 py-3 text-white' : 'h-12 w-12 text-gray-400 hover:text-white',
                )}
                href={item.href}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--ui-primary)',
                        color: '#ffffff',
                      }
                    : {
                        color: '#9ca3af',
                      }
                }
              >
                <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                {active ? <span className="ml-2.5 text-[13px] font-bold">{item.label}</span> : null}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MarketplaceTopPill({
  children,
  tone = 'glass',
}: {
  children: ReactNode;
  tone?: 'glass' | 'soft' | 'solid';
}) {
  const style =
    tone === 'solid'
      ? {
          backgroundColor: 'color-mix(in srgb, var(--ui-secondary) 84%, black)',
          color: '#ffffff',
        }
      : tone === 'soft'
        ? {
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderColor: 'rgba(255,255,255,0.45)',
            color: 'var(--ui-text-strong)',
          }
        : {
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderColor: 'rgba(255,255,255,0.16)',
            color: 'rgba(255,255,255,0.86)',
          };

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-md"
      style={style}
    >
      {children}
    </span>
  );
}

export function MarketplaceSurfaceCard({
  children,
  className,
  tone = 'white',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'blush' | 'dark' | 'ghost' | 'white';
}) {
  const toneStyle: CSSProperties =
    tone === 'blush'
      ? {
          background:
            'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 100%)',
          borderColor: 'var(--ui-border)',
          boxShadow: '0 18px 40px -28px rgba(17,24,39,0.18)',
        }
      : tone === 'dark'
        ? {
            backgroundColor: '#0f172a',
            borderColor: '#111827',
            boxShadow: '0 22px 40px -30px rgba(15,23,42,0.88)',
            color: '#ffffff',
          }
        : tone === 'ghost'
          ? {
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderColor: 'rgba(255,255,255,0.55)',
              boxShadow: '0 28px 60px -38px rgba(15,23,42,0.45)',
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: 'rgba(226,232,240,0.8)',
              boxShadow: '0 14px 40px -28px rgba(15,23,42,0.18)',
            };

  return (
    <section className={cx('rounded-[24px] border p-5', className)} style={toneStyle}>
      {children}
    </section>
  );
}

export function MarketplaceSectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
        {description ? <div className="mt-1 text-[12.5px] leading-6 text-slate-500">{description}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MarketplaceAccessHero({
  badgeLabel,
  benefits,
  description,
  statusLabel,
  title,
}: {
  badgeLabel: string;
  benefits?: Array<{ icon: ReactNode; label: string }>;
  description: string;
  statusLabel: string;
  title: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-[30px] p-6 text-white shadow-[0_24px_60px_-32px_rgba(190,24,93,0.55)]"
      style={{
        background: 'linear-gradient(145deg, var(--ui-primary) 0%, var(--ui-secondary) 100%)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
          {badgeLabel}
        </span>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
          {statusLabel}
        </span>
      </div>

      <h1 className="mt-5 text-[28px] font-bold leading-tight">{title}</h1>
      <p className="mt-3 max-w-[28rem] text-[14px] leading-relaxed text-white/85">{description}</p>

      {benefits?.length ? (
        <div className="mt-5 grid gap-3">
          {benefits.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-[11px] font-semibold text-white/90"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function MarketplaceAccessTabs({
  items,
  value,
}: {
  items: Array<{ href?: string; label: string; onClick?: () => void; value: string }>;
  value: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-full bg-gray-100 p-1">
      {items.map((item) => {
        const active = item.value === value;
        const className = cx(
          'rounded-full px-4 py-3 text-center text-[13px] font-bold transition-all',
          active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
        );

        if (item.href) {
          return (
            <a className={className} href={item.href} key={item.value}>
              {item.label}
            </a>
          );
        }

        return (
          <button className={className} key={item.value} onClick={item.onClick} type="button">
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function MarketplaceCategoryTile({
  caption,
  href,
  label,
}: {
  caption?: ReactNode;
  href: string;
  label: ReactNode;
}) {
  return (
    <a
      className="block min-w-[152px] rounded-[24px] border px-4 py-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.18)] transition-all hover:shadow-[0_22px_40px_-30px_rgba(15,23,42,0.24)] active:scale-[0.98]"
      href={href}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 58%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ui-primary)' }}>
        {label}
      </div>
      {caption ? <div className="mt-2 text-[12px] leading-5 text-slate-500">{caption}</div> : null}
    </a>
  );
}

export function MarketplaceHeaderIconButton({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    'flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:scale-95';

  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function MarketplaceSearchField({
  className,
  inputClassName,
  leading,
  onChange,
  placeholder,
  trailing,
  value,
}: {
  className?: string;
  inputClassName?: string;
  leading?: ReactNode;
  onChange?: (value: string) => void;
  placeholder: string;
  trailing?: ReactNode;
  value: string;
}) {
  return (
    <div
      className={cx('flex items-center rounded-full border px-4 py-3.5 shadow-sm', className)}
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#f1f5f9',
        boxShadow: '0 10px 26px -22px rgba(15,23,42,0.2)',
      }}
    >
      <div className="flex w-full items-center gap-3">
        {leading ? <div className="text-gray-400">{leading}</div> : null}
        <input
          className={cx(
            'w-full border-none bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400',
            inputClassName,
          )}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        {trailing ? <div className="text-gray-400">{trailing}</div> : null}
      </div>
    </div>
  );
}

export function MarketplaceFilterChip({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="rounded-full border px-4 py-2.5 text-[13px] font-bold transition-all"
      onClick={onClick}
      style={
        active
          ? {
              backgroundColor: 'var(--ui-surface-muted)',
              borderColor: 'var(--ui-border-strong)',
              color: 'var(--ui-primary)',
              boxShadow: '0 14px 30px -24px rgba(3,105,161,0.18)',
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              color: '#475569',
            }
      }
      type="button"
    >
      {children}
    </button>
  );
}

export function MarketplaceStatusFilters({ children }: { children: ReactNode }) {
  return <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{children}</div>;
}

export function MarketplaceListCard({
  accessory,
  badge,
  description,
  image,
  meta,
  onClick,
  subtitle,
  title,
}: {
  accessory?: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  image?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  const content = (
    <div className="flex gap-4">
      {image ? <div className="shrink-0">{image}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[16px] font-bold leading-tight break-words text-gray-900 [overflow-wrap:anywhere]">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 break-words text-[13px] font-medium text-gray-500 [overflow-wrap:anywhere]">
                {subtitle}
              </div>
            ) : null}
          </div>
          {accessory ? (
            <div className="shrink-0">{accessory}</div>
          ) : badge ? (
            <div className="shrink-0">{badge}</div>
          ) : null}
        </div>
        {description ? <div className="mt-2 text-[12px] leading-5 text-gray-500">{description}</div> : null}
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        className="w-full rounded-[24px] border bg-white p-4 text-left shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)]"
        onClick={onClick}
        style={{ borderColor: 'rgba(226,232,240,0.8)' }}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="w-full rounded-[24px] border bg-white p-4 text-left shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)]"
      style={{ borderColor: 'var(--ui-border)' }}
    >
      {content}
    </div>
  );
}

export function MarketplaceIdentityCard({
  action,
  actionLabel,
  avatar,
  chip,
  chipIcon,
  chipLabel,
  onAction,
  subtitle,
  title,
}: {
  action?: ReactNode;
  actionLabel?: ReactNode;
  avatar?: ReactNode;
  chip?: ReactNode;
  chipIcon?: ReactNode;
  chipLabel?: ReactNode;
  onAction?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  const resolvedChip =
    chip ||
    (chipLabel ? (
      <div
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
        style={{
          backgroundColor: 'var(--ui-surface-muted)',
          borderColor: 'var(--ui-border)',
          color: 'var(--ui-primary)',
        }}
      >
        {chipIcon}
        <span className="truncate">{chipLabel}</span>
      </div>
    ) : null);

  const resolvedAction =
    action ||
    (actionLabel && onAction ? (
      <button
        className="inline-flex items-center gap-1 rounded-full border bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-600 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.35)] transition-colors hover:bg-slate-50"
        onClick={onAction}
        style={{ borderColor: 'var(--ui-border)' }}
        type="button"
      >
        {actionLabel}
        <span aria-hidden="true">›</span>
      </button>
    ) : null);

  return (
    <section
      className="overflow-hidden rounded-[30px] border border-slate-200/80 p-5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.28)]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 48%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white text-[18px] font-bold shadow-[0_12px_24px_-18px_rgba(15,23,42,0.4)]"
          style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
        >
          {avatar || (typeof title === 'string' ? title.charAt(0).toUpperCase() || 'B' : 'B')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[17px] font-bold leading-tight break-words text-slate-900 [overflow-wrap:anywhere]">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 break-words text-[13px] font-medium text-slate-500 [overflow-wrap:anywhere]">
                  {subtitle}
                </div>
              ) : null}
            </div>
            {resolvedAction ? <div className="shrink-0">{resolvedAction}</div> : null}
          </div>
          {resolvedChip ? <div className="mt-3">{resolvedChip}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function MarketplaceEmptyCard({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}) {
  return (
    <div
      className="rounded-[28px] border border-dashed bg-white px-5 py-8 text-center shadow-sm"
      style={{ borderColor: '#e5e7eb' }}
    >
      <div className="text-[18px] font-bold text-gray-900">{title}</div>
      <div className="mt-2 text-[13px] leading-6 text-gray-500">{description}</div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MarketplaceHeroBanner({
  action,
  children,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[30px] p-5 shadow-[var(--ui-shadow-hero)]"
      style={{
        background: 'linear-gradient(145deg, var(--ui-primary) 0%, var(--ui-secondary) 100%)',
      }}
    >
      {eyebrow ? <div>{eyebrow}</div> : null}
      <div className="mt-4 text-[24px] font-bold leading-tight" style={whiteTextStyle}>
        {title}
      </div>
      <div className="mt-2 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {description}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function MarketplaceNotificationGroup({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gray-400">{title}</h2>
        <span className="text-[12px] font-medium text-gray-400">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function MarketplaceSettingsCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-[30px] border bg-white shadow-[0_22px_50px_-40px_rgba(15,23,42,0.18)]',
        className,
      )}
      style={{ borderColor: 'var(--ui-border)' }}
    >
      {children}
    </div>
  );
}

export function MarketplaceDangerButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-[28px] border p-4 font-bold shadow-[0_18px_40px_-34px_rgba(180,83,9,0.12)] transition-colors hover:bg-amber-50/80 active:bg-amber-100"
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg,#FFFDF7 0%,#FFF7E8 100%)',
        borderColor: 'rgba(253,230,138,0.72)',
        color: '#b45309',
      }}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

export function MarketplaceFeaturePill({ children, tone = 'glass' }: { children: ReactNode; tone?: 'glass' | 'soft' }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold"
      style={
        tone === 'soft'
          ? {
              backgroundColor: '#ffffff',
              borderColor: 'var(--ui-border)',
              color: '#475569',
            }
          : {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.9)',
            }
      }
    >
      {children}
    </div>
  );
}

export function MarketplaceStatTile({
  label,
  value,
  tone = 'soft',
}: {
  label: ReactNode;
  tone?: 'glass' | 'soft';
  value: ReactNode;
}) {
  return (
    <div
      className="rounded-[22px] border px-4 py-4 backdrop-blur-sm"
      style={
        tone === 'glass'
          ? {
              borderColor: 'rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
            }
          : {
              borderColor: 'var(--ui-border)',
              backgroundColor: '#fcfcfc',
              color: '#0f172a',
            }
      }
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={tone === 'glass' ? { color: 'rgba(255,255,255,0.72)' } : { color: '#94a3b8' }}
      >
        {label}
      </div>
      <div className="mt-2 text-[20px] font-bold">{value}</div>
    </div>
  );
}

export function MarketplaceQuickActionCard({
  description,
  icon,
  onClick,
  title,
}: {
  description: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
  title: ReactNode;
}) {
  const content = (
    <>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-[18px]"
        style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
      >
        {icon}
      </div>
      <div className="mt-5">
        <div className="text-[15px] font-bold text-slate-900">{title}</div>
        <div className="mt-2 text-[12.5px] leading-6 text-slate-500">{description}</div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        className="flex min-h-[172px] w-full flex-col rounded-[28px] border p-5 text-left shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)]"
        onClick={onClick}
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 42%, white) 100%)',
          borderColor: 'var(--ui-border)',
        }}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="flex min-h-[172px] w-full flex-col rounded-[28px] border p-5 text-left shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 42%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      {content}
    </div>
  );
}

export function MarketplaceSupportEntryCard({
  actionLabel = 'Buka bantuan',
  badges,
  description,
  icon,
  onClick,
  responseBadge,
  title,
  tone = 'amber',
}: {
  actionLabel?: ReactNode;
  badges?: string[];
  description: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
  responseBadge?: ReactNode;
  title: ReactNode;
  tone?: 'amber' | 'pink';
}) {
  const brandTone = tone === 'pink';

  return (
    <button
      className="w-full rounded-[30px] border p-5 text-left shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 active:scale-[0.99]"
      onClick={onClick}
      style={
        brandTone
          ? {
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 100%)',
              borderColor: 'var(--ui-border)',
            }
          : {
              background: 'linear-gradient(135deg,#FFF8E8 0%,#FFFFFF 48%,#F3FBFF 100%)',
              borderColor: 'rgba(251,191,36,0.35)',
            }
      }
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] border border-white/80 bg-white shadow-[0_12px_28px_-22px_rgba(15,23,42,0.28)]"
            style={{ color: brandTone ? 'var(--ui-primary)' : '#b45309' }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-bold leading-tight text-slate-900">{title}</div>
            <div className="mt-2 text-[13px] leading-7 text-slate-600">{description}</div>
          </div>
        </div>
        {responseBadge ? (
          <div
            className="flex-shrink-0 rounded-[20px] border border-white/80 bg-white px-3 py-2 text-center text-[11px] font-bold leading-5 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.2)]"
            style={{ color: brandTone ? 'var(--ui-primary)' : '#b45309' }}
          >
            {responseBadge}
          </div>
        ) : null}
      </div>
      {badges?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_20px_-20px_rgba(15,23,42,0.25)]"
              key={badge}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
      <div
        className="mt-5 flex items-center justify-between border-t pt-4 text-[14px] font-semibold"
        style={{
          borderColor: brandTone ? 'var(--ui-border)' : 'rgba(251,191,36,0.28)',
          color: brandTone ? 'var(--ui-primary)' : '#b45309',
        }}
      >
        <span>{actionLabel}</span>
        <span aria-hidden="true">›</span>
      </div>
    </button>
  );
}

export function MarketplaceSettingsRow({
  description,
  icon,
  iconClassName,
  isLast = false,
  onClick,
  title,
  trailing,
}: {
  description: ReactNode;
  icon: ReactNode;
  iconClassName?: string;
  isLast?: boolean;
  onClick?: () => void;
  title: ReactNode;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-4 text-slate-700">
        <div
          className={cx('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full', iconClassName)}
          style={iconClassName ? undefined : { backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-[12.5px] leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {trailing ? (
        <div className="shrink-0">{trailing}</div>
      ) : onClick ? (
        <div aria-hidden="true" className="shrink-0 text-slate-300">
          ›
        </div>
      ) : null}
    </>
  );

  const className = cx(
    'flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors',
    isLast ? '' : 'border-b',
    onClick ? 'hover:bg-slate-50/80' : '',
  );

  if (onClick) {
    return (
      <button className={className} onClick={onClick} style={{ borderColor: 'var(--ui-border)' }} type="button">
        {content}
      </button>
    );
  }

  return (
    <div className={className} style={{ borderColor: 'var(--ui-border)' }}>
      {content}
    </div>
  );
}

function MarketplaceModalSheet({
  children,
  description,
  isOpen,
  onClose,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/35 px-4 pb-0 pt-10 backdrop-blur-[1px]">
      <button aria-label="Tutup modal" className="absolute inset-0" onClick={onClose} type="button" />
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative w-full max-w-[480px] overflow-hidden rounded-t-[32px] border bg-white shadow-[0_-28px_60px_-34px_rgba(15,23,42,0.42)]"
        style={{ borderColor: 'var(--ui-border)' }}
        role="dialog"
      >
        <div
          className="sticky top-0 z-10 border-b bg-white/96 px-5 pb-4 pt-4 backdrop-blur"
          style={{ borderColor: 'var(--ui-border)' }}
        >
          <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200" />
          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[18px] font-bold text-slate-900" id={titleId}>
                {title}
              </div>
              {description ? (
                <div className="mt-1 text-[13px] leading-6 text-slate-500" id={descriptionId}>
                  {description}
                </div>
              ) : null}
            </div>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 pb-8 pt-5">{children}</div>
      </div>
    </div>
  );
}

export function MarketplaceProfileSettingsSheet({
  children,
  description,
  isOpen,
  onClose,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
}) {
  return (
    <MarketplaceModalSheet description={description} isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </MarketplaceModalSheet>
  );
}

export function MarketplaceSupportSheet({
  children,
  description,
  isOpen,
  onClose,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
}) {
  return (
    <MarketplaceModalSheet description={description} isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </MarketplaceModalSheet>
  );
}

export function MarketplaceStickyActionBar({
  actions,
  eyebrow,
  subtitle,
  title,
}: {
  actions: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-5">
      <div className="pointer-events-auto w-full max-w-[480px] rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_56px_-34px_rgba(15,23,42,0.32)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</p>
            ) : null}
            <div className="truncate text-[16px] font-bold text-slate-900">{title}</div>
            {subtitle ? <p className="mt-1 text-[12px] leading-5 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">{actions}</div>
      </div>
    </div>
  );
}
