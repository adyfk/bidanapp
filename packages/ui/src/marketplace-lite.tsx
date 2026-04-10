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
    <div
      className="min-h-screen md:px-6 md:py-6"
      style={{
        background:
          'radial-gradient(circle at top, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 0%, var(--ui-background) 42%, color-mix(in srgb, var(--ui-surface-muted) 44%, white) 100%)',
      }}
    >
      <div className="mx-auto flex min-h-screen justify-center md:min-h-0">
        <div
          className="relative flex min-h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-[var(--ui-background)] shadow-[0_26px_56px_-34px_rgba(88,49,66,0.22)] md:min-h-[calc(100vh-3rem)] md:rounded-[38px] md:border"
          style={{ borderColor: 'color-mix(in srgb, var(--ui-border) 82%, white)' }}
        >
          <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
      {showNav && navItems?.length ? <MarketplaceBottomNav activeId={activeNavId} items={navItems} /> : null}
    </div>
  );
}

export function MarketplaceBottomNav({ activeId, items }: { activeId?: string; items: MarketplaceNavItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 justify-center px-5 md:bottom-10">
      <div
        className="pointer-events-auto w-full rounded-[26px] border p-1.5 shadow-[0_24px_44px_-30px_rgba(74,46,58,0.24)] backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.96)',
          borderColor: 'color-mix(in srgb, var(--ui-border) 88%, white)',
        }}
      >
        <div
          className="grid items-stretch gap-1"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = item.id === activeId;

            return (
              <a
                aria-current={active ? 'page' : undefined}
                key={item.id}
                className={cx(
                  'relative flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2 text-center transition-colors duration-200',
                  active ? 'text-white' : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]',
                )}
                href={item.href}
                style={
                  active
                    ? {
                        background:
                          'linear-gradient(180deg, var(--ui-nav-active-background) 0%, color-mix(in srgb, var(--ui-nav-active-background) 82%, #7B2A47) 100%)',
                        color: '#ffffff',
                        boxShadow: '0 16px 28px -22px rgba(117,48,76,0.28)',
                      }
                    : {
                        color: 'var(--ui-text-muted)',
                      }
                }
              >
                <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                <span className="max-w-full truncate text-[10.5px] font-bold leading-none">{item.label}</span>
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
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 100%)',
            borderColor: 'var(--ui-border)',
            color: 'var(--ui-text-strong)',
          }
        : {
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderColor: 'rgba(255,255,255,0.16)',
            color: 'rgba(255,255,255,0.86)',
          };

  return (
    <span
      className="inline-flex max-w-full items-center overflow-hidden truncate whitespace-nowrap rounded-[13px] border px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md"
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
          boxShadow: '0 18px 40px -28px rgba(88,49,66,0.14)',
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
              boxShadow: '0 28px 60px -38px rgba(88,49,66,0.26)',
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: 'rgba(226,232,240,0.8)',
              boxShadow: '0 14px 40px -28px rgba(88,49,66,0.14)',
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
      className="overflow-hidden rounded-[30px] border p-6 text-white shadow-[var(--ui-shadow-hero)]"
      style={{
        background: 'linear-gradient(145deg, var(--ui-primary) 0%, var(--ui-secondary) 100%)',
        borderColor: 'color-mix(in srgb, var(--ui-border-strong) 42%, white)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[13px] bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/92">
          {badgeLabel}
        </span>
        <span className="rounded-[13px] border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/92">
          {statusLabel}
        </span>
      </div>

      <h1 className="mt-5 text-[28px] font-bold leading-tight">{title}</h1>
      <p className="mt-3 max-w-[28rem] text-[14px] leading-relaxed text-white/92">{description}</p>

      {benefits?.length ? (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {benefits.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 rounded-[13px] border border-white/18 bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white/92"
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
    <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-gray-100 p-1">
      {items.map((item) => {
        const active = item.value === value;
        const className = cx(
          'rounded-[14px] px-4 py-3 text-center text-[13px] font-bold transition-colors',
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
    'flex h-10 w-10 items-center justify-center rounded-full border text-gray-600 transition-colors hover:bg-rose-50/70 active:scale-95';

  if (href) {
    return (
      <a
        className={className}
        href={href}
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
          borderColor: 'var(--ui-border)',
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={className}
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
      type="button"
    >
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
      className={cx('flex items-center rounded-[20px] border px-4 py-3.5 shadow-sm', className)}
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
        borderColor: 'var(--ui-border)',
        boxShadow: '0 14px 26px -22px rgba(88,49,66,0.14)',
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
      className="rounded-[14px] border px-3 py-2 text-[12px] font-bold transition-colors"
      onClick={onClick}
      style={
        active
          ? {
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 78%, white) 100%)',
              borderColor: 'var(--ui-border-strong)',
              color: 'var(--ui-primary)',
              boxShadow: '0 14px 30px -24px rgba(145,64,96,0.18)',
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: 'var(--ui-border)',
              color: 'var(--ui-text-muted)',
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
        className="w-full rounded-[24px] border p-4 text-left shadow-[0_14px_40px_-28px_rgba(88,49,66,0.14)]"
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
      className="w-full rounded-[24px] border p-4 text-left shadow-[0_14px_40px_-28px_rgba(88,49,66,0.14)]"
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
        className="inline-flex max-w-full items-center gap-1.5 rounded-[12px] border px-2.5 py-1.5 text-[10.5px] font-semibold"
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
        className="inline-flex max-w-full items-center gap-1 rounded-[14px] border px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-[0_10px_26px_-22px_rgba(88,49,66,0.14)] transition-colors hover:bg-rose-50/60"
        onClick={onAction}
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 52%, white) 100%)',
          borderColor: 'var(--ui-border)',
        }}
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
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 44%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
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
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h2>
        <span className="text-[12px] font-medium text-slate-400">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function MarketplaceSettingsCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx('overflow-hidden rounded-[30px] border shadow-[0_22px_50px_-40px_rgba(88,49,66,0.14)]', className)}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 34%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
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
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-[28px] border p-4 font-bold shadow-[0_18px_40px_-34px_rgba(88,49,66,0.08)] transition-colors hover:bg-rose-50/50 active:bg-rose-50"
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg,#FFFFFF 0%,#FFF7FA 100%)',
        borderColor: 'var(--ui-border)',
        color: 'var(--ui-text-muted)',
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
      className="inline-flex max-w-full items-center gap-1.5 overflow-hidden truncate whitespace-nowrap rounded-[13px] border px-3 py-1.5 text-[10.5px] font-semibold leading-tight"
      style={
        tone === 'soft'
          ? {
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 66%, white) 100%)',
              borderColor: 'var(--ui-border)',
              color: 'var(--ui-text-muted)',
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
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 52%, white) 100%)',
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
        className="flex min-h-[148px] w-full flex-col rounded-[28px] border p-5 text-left shadow-[0_14px_40px_-28px_rgba(88,49,66,0.14)]"
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
      className="flex min-h-[148px] w-full flex-col rounded-[28px] border p-5 text-left shadow-[0_14px_40px_-28px_rgba(88,49,66,0.14)]"
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
  actionLabel = 'Bantuan',
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
      className="w-full rounded-[30px] border p-5 text-left shadow-[0_18px_40px_-28px_rgba(88,49,66,0.14)] transition-all hover:-translate-y-0.5 active:scale-[0.99]"
      onClick={onClick}
      style={
        brandTone
          ? {
              background:
                'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 100%)',
              borderColor: 'var(--ui-border)',
            }
          : {
              background: 'linear-gradient(135deg,#FFF8EC 0%,#FFFFFF 48%,#FFF7FB 100%)',
              borderColor: 'rgba(233,179,106,0.28)',
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
    onClick ? 'hover:bg-rose-50/45' : '',
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/30 px-4 pb-0 pt-10 backdrop-blur-[1px]">
      <button aria-label="Tutup modal" className="absolute inset-0" onClick={onClose} type="button" />
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative w-full max-w-[480px] overflow-hidden rounded-t-[32px] border bg-white shadow-[0_-28px_60px_-34px_rgba(88,49,66,0.24)]"
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
      <div
        className="pointer-events-auto w-full max-w-[480px] rounded-[28px] border border-white/70 p-4 shadow-[0_24px_56px_-34px_rgba(88,49,66,0.22)] backdrop-blur-xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
          borderColor: 'color-mix(in srgb, var(--ui-border) 88%, white)',
        }}
      >
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
