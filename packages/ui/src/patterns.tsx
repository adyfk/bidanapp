import type { CSSProperties, ReactNode } from 'react';
import { cx, type StatusTone } from './foundations';
import { MessageBanner, SectionHeading } from './primitives';

export function HeroPanel({
  eyebrow,
  title,
  description,
  actions,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-[var(--ui-radius-hero)] border px-5 py-6 shadow-[var(--ui-shadow-hero)]"
      style={{
        background: 'var(--ui-hero-gradient)',
        borderColor: 'color-mix(in srgb, var(--ui-border-strong) 42%, white)',
      }}
    >
      <div className="rounded-[calc(var(--ui-radius-hero)-10px)] px-1" style={{ background: 'var(--ui-hero-overlay)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: 'var(--ui-text-muted)' }}
            >
              {eyebrow}
            </p>
            <h1
              className="mt-3 text-[28px] font-bold tracking-[-0.04em] md:text-[40px]"
              style={{ color: 'var(--ui-text-strong)' }}
            >
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7" style={{ color: 'var(--ui-text-muted)' }}>
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function AppShell({
  children,
  eyebrow,
  title,
  description,
  actions,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-[var(--ui-background)] px-4 py-6 text-[var(--ui-text)] md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeroPanel actions={actions} description={description} eyebrow={eyebrow} title={title} />
        {children}
      </div>
    </main>
  );
}

export function SectionPanel({
  children,
  className,
  title,
  description,
  action,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section
      className={cx('rounded-[30px] border p-5 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.25)]', className)}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 52%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      {title ? <SectionHeading action={action} description={description} title={title} /> : null}
      <div className={cx(title ? 'mt-5' : '')}>{children}</div>
    </section>
  );
}

export function MetricTile({ label, value, tone = 'neutral' }: { label: string; tone?: StatusTone; value: string }) {
  const tileStyle: CSSProperties =
    tone === 'accent'
      ? {
          background:
            'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 76%, white) 100%)',
          borderColor: 'var(--ui-border-strong)',
        }
      : {
          backgroundColor: 'var(--ui-surface-elevated)',
          borderColor: 'var(--ui-border)',
        };

  return (
    <div className="rounded-[22px] border px-4 py-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]" style={tileStyle}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ui-text-subtle)' }}>
        {label}
      </p>
      <p className="mt-3 text-[22px] font-black tracking-[-0.03em]" style={{ color: 'var(--ui-text-strong)' }}>
        {value}
      </p>
    </div>
  );
}

export function EntityCard({
  title,
  subtitle,
  description,
  badge,
  meta,
  actions,
  children,
}: {
  actions?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  return (
    <article
      className="rounded-[28px] border p-4 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.24)]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 44%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="break-words text-[16px] font-bold tracking-[-0.03em] [overflow-wrap:anywhere]"
            style={{ color: 'var(--ui-text-strong)' }}
          >
            {title}
          </p>
          {subtitle ? (
            <div className="mt-1 text-[12px] leading-5" style={{ color: 'var(--ui-text-muted)' }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {description ? (
        <div className="mt-3 text-[13px] leading-6" style={{ color: 'var(--ui-text-muted)' }}>
          {description}
        </div>
      ) : null}
      {meta ? <div className="mt-4">{meta}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </article>
  );
}

export function InlineNotice({
  description,
  tone = 'info',
  title,
}: {
  description: string;
  title: string;
  tone?: StatusTone;
}) {
  return (
    <MessageBanner tone={tone}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{description}</p>
    </MessageBanner>
  );
}

export function JsonPreviewBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div
      className="rounded-[24px] border p-4 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.24)]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ui-text-subtle)' }}>
        {label}
      </p>
      <pre
        className="mt-3 overflow-x-auto text-[12px] leading-6 whitespace-pre-wrap break-words"
        style={{ color: 'var(--ui-text-muted)' }}
      >
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}

export interface SidebarNavItem {
  description?: string;
  href?: string;
  id: string;
  label: string;
  onSelect?: () => void;
}

export function SidebarNav({ items, activeId }: { activeId: string; items: SidebarNavItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const active = item.id === activeId;
        const sharedProps = {
          className: 'block rounded-[20px] border px-4 py-4 transition duration-200',
          style: active
            ? {
                backgroundColor: 'var(--ui-nav-active-background)',
                borderColor: 'var(--ui-nav-active-background)',
                color: 'var(--ui-nav-active-text)',
              }
            : {
                backgroundColor: 'var(--ui-surface-muted)',
                borderColor: 'var(--ui-border)',
                color: 'var(--ui-text-strong)',
              },
        } satisfies { className: string; style: CSSProperties };

        const body = (
          <>
            <p className="text-sm font-semibold">{item.label}</p>
            {item.description ? (
              <p className="mt-2 text-xs leading-5" style={{ opacity: active ? 0.8 : 1 }}>
                {item.description}
              </p>
            ) : null}
          </>
        );

        return item.href ? (
          <a key={item.id} href={item.href} {...sharedProps}>
            {body}
          </a>
        ) : item.onSelect ? (
          <button key={item.id} onClick={item.onSelect} type="button" {...sharedProps}>
            {body}
          </button>
        ) : (
          <div key={item.id} {...sharedProps}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export interface TimelineItem {
  body?: ReactNode;
  id: string;
  meta?: ReactNode;
  title: ReactNode;
}

export function TimelineBlock({ items, title = 'Timeline' }: { items: TimelineItem[]; title?: string }) {
  return (
    <div
      className="rounded-[28px] border p-4 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.25)]"
      style={{
        background: 'linear-gradient(180deg,#FFFFFF 0%,#FFFAFC 100%)',
        borderColor: 'rgba(226,232,240,0.8)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ui-text-subtle)' }}>
        {title}
      </p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[22px] border px-4 py-3"
            style={{
              backgroundColor: '#ffffff',
              borderColor: 'rgba(226,232,240,0.8)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--ui-text-strong)' }}>
              {item.title}
            </p>
            {item.meta ? (
              <div className="mt-1 text-xs" style={{ color: 'var(--ui-text-subtle)' }}>
                {item.meta}
              </div>
            ) : null}
            {item.body ? (
              <div className="mt-2 text-sm leading-6" style={{ color: 'var(--ui-text-muted)' }}>
                {item.body}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DocumentListItem {
  href: string;
  id: string;
  label: string;
  meta?: ReactNode;
}

export function DocumentList({
  items,
  emptyLabel = 'Belum ada dokumen.',
}: {
  emptyLabel?: string;
  items: DocumentListItem[];
}) {
  if (items.length === 0) {
    return <InlineNotice description={emptyLabel} title="Dokumen" tone="neutral" />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <a
          key={item.id}
          className="block rounded-[18px] border px-4 py-3 text-sm font-medium transition duration-200 hover:translate-y-[-1px]"
          href={item.href}
          style={{
            backgroundColor: 'var(--ui-surface-elevated)',
            borderColor: 'var(--ui-border)',
            color: 'var(--ui-text)',
          }}
        >
          <span className="block break-words [overflow-wrap:anywhere]">{item.label}</span>
          {item.meta ? (
            <span
              className="mt-1 block break-words text-xs [overflow-wrap:anywhere]"
              style={{ color: 'var(--ui-text-muted)' }}
            >
              {item.meta}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

export interface ConversationMessage {
  body: ReactNode;
  id: string;
  meta?: ReactNode;
  title: ReactNode;
}

export function ConversationPanel({ items }: { items: ConversationMessage[] }) {
  return (
    <div
      className="space-y-3 rounded-[var(--ui-radius-card)] border p-4"
      style={{
        backgroundColor: 'var(--ui-surface-muted)',
        borderColor: 'var(--ui-border)',
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-[18px] px-4 py-3"
          style={{
            backgroundColor: 'var(--ui-surface-elevated)',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--ui-text-strong)' }}>
            {item.title}
          </p>
          {item.meta ? (
            <div className="mt-1 text-xs" style={{ color: 'var(--ui-text-subtle)' }}>
              {item.meta}
            </div>
          ) : null}
          <div className="mt-2 text-sm leading-6" style={{ color: 'var(--ui-text-muted)' }}>
            {item.body}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-wrap gap-3', className)}>{children}</div>;
}

export function SelectableCard({
  active = false,
  children,
  className,
  description,
  onClick,
  title,
}: {
  active?: boolean;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  onClick?: () => void;
  title?: ReactNode;
}) {
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      className={cx(
        'w-full rounded-[20px] border px-4 py-4 text-left transition duration-200 hover:translate-y-[-1px]',
        className,
      )}
      onClick={onClick}
      style={
        active
          ? {
              backgroundColor: 'var(--ui-nav-active-background)',
              borderColor: 'var(--ui-nav-active-background)',
              color: 'var(--ui-nav-active-text)',
            }
          : {
              backgroundColor: 'var(--ui-surface-muted)',
              borderColor: 'var(--ui-border)',
              color: 'var(--ui-text-strong)',
            }
      }
      type={onClick ? 'button' : undefined}
    >
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {description ? (
        <div
          className="mt-2 text-xs leading-5"
          style={{
            color: active ? 'color-mix(in srgb, var(--ui-nav-active-text) 80%, transparent)' : 'var(--ui-text-muted)',
          }}
        >
          {description}
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </Element>
  );
}

export function EditableItemCard({
  children,
  onRemove,
  title,
}: {
  children: ReactNode;
  onRemove?: () => void;
  title: string;
}) {
  return (
    <div
      className="rounded-[24px] border p-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]"
      style={{
        backgroundColor: '#ffffff',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--ui-text-strong)' }}>
          {title}
        </p>
        {onRemove ? (
          <button
            className="text-sm font-semibold transition duration-200 hover:opacity-80"
            onClick={onRemove}
            style={{ color: 'var(--ui-danger)' }}
            type="button"
          >
            Hapus
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FormSection({
  children,
  title,
  description,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <SectionHeading title={title} description={description} />
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export const PageShell = AppShell;
export const SurfaceCard = SectionPanel;
export const StatCard = MetricTile;
export const InfoTile = MetricTile;
