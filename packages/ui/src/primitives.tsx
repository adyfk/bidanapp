import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { cx, type StatusTone, toneStyle } from './foundations';

const focusRingStyle: CSSProperties & Record<'--tw-ring-color', string> = {
  '--tw-ring-color': 'var(--ui-focus-ring)',
};

export function PrimaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center rounded-[18px] border border-transparent px-4 py-3 text-center text-[13px] font-bold leading-tight transition-colors duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-primary) 66%, var(--ui-secondary)) 100%)',
        boxShadow: '0 20px 32px -22px rgba(145,64,96,0.28)',
        color: '#ffffff',
        ...focusRingStyle,
      }}
    />
  );
}

export function SecondaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center rounded-[18px] border px-4 py-3 text-center text-[13px] font-bold leading-tight transition-colors duration-200 hover:bg-rose-50/70 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
        borderColor: 'var(--ui-border)',
        boxShadow: '0 14px 30px -24px rgba(88,49,66,0.16)',
        color: 'var(--ui-text-strong)',
        ...focusRingStyle,
      }}
    />
  );
}

export function GhostButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex min-h-10 items-center justify-center rounded-[16px] border border-transparent px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{
        color: 'var(--ui-text-muted)',
        ...focusRingStyle,
      }}
    />
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-[17px] font-bold tracking-[0.01em]" style={{ color: 'var(--ui-text-strong)' }}>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[12.5px] leading-6" style={{ color: 'var(--ui-text-muted)' }}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return <StatusChip label={children} strong={tone === 'accent'} tone={tone} />;
}

export function StatusChip({
  ariaLabel,
  className,
  compact = false,
  icon,
  label,
  strong = false,
  tone = 'neutral',
}: {
  ariaLabel?: string;
  className?: string;
  compact?: boolean;
  icon?: ReactNode;
  label: ReactNode;
  strong?: boolean;
  tone?: StatusTone;
}) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[12px] border font-semibold leading-tight',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[10.5px]',
        strong ? 'uppercase tracking-[0.12em]' : '',
        className,
      )}
      data-ui="status-chip"
      style={toneStyle(tone)}
      title={ariaLabel}
    >
      {icon ? <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">{icon}</span> : null}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

export function StatusChipGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex min-w-0 flex-wrap items-center gap-2', className)} data-ui="status-chip-group">
      {children}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <StatusPill tone="accent">{children}</StatusPill>;
}

export function TextField({
  accent = 'blue',
  surface = 'muted',
  label,
  helperText,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  accent?: 'blue' | 'pink' | 'slate';
  helperText?: string;
  label: string;
  surface?: 'muted' | 'soft';
}) {
  const accentClass =
    accent === 'slate'
      ? 'focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white'
      : 'focus:border-[var(--ui-primary)] focus:ring-2 focus:bg-white';
  const surfaceClass = surface === 'soft' ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50';

  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold" style={{ color: 'var(--ui-text-muted)' }}>
        {label}
      </span>
      <input
        {...props}
        className={cx(
          'w-full rounded-[18px] border px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-400',
          accentClass,
          surfaceClass,
          className,
        )}
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
          ...focusRingStyle,
        }}
      />
      {helperText ? (
        <span className="mt-2 block text-xs leading-5" style={{ color: 'var(--ui-text-muted)' }}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}

export function TextAreaField({
  accent = 'blue',
  surface = 'muted',
  label,
  helperText,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  accent?: 'blue' | 'pink' | 'slate';
  helperText?: string;
  label: string;
  surface?: 'muted' | 'soft';
}) {
  const accentClass =
    accent === 'slate'
      ? 'focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white'
      : 'focus:border-[var(--ui-primary)] focus:ring-2 focus:bg-white';
  const surfaceClass = surface === 'soft' ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50';

  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold" style={{ color: 'var(--ui-text-muted)' }}>
        {label}
      </span>
      <textarea
        {...props}
        className={cx(
          'min-h-28 w-full rounded-[18px] border px-4 py-3 text-sm text-slate-700 outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-400',
          accentClass,
          surfaceClass,
          className,
        )}
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
          ...focusRingStyle,
        }}
      />
      {helperText ? (
        <span className="mt-2 block text-xs leading-5" style={{ color: 'var(--ui-text-muted)' }}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}

export function CheckboxField({
  checked,
  helperText,
  label,
  onChange,
}: {
  checked: boolean;
  helperText?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex items-start gap-3 rounded-[var(--ui-radius-input)] border px-4 py-3"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded"
        style={{ accentColor: 'var(--ui-primary)' }}
      />
      <span>
        <span className="block text-sm font-medium" style={{ color: 'var(--ui-text)' }}>
          {label}
        </span>
        {helperText ? (
          <span className="mt-1 block text-xs leading-5" style={{ color: 'var(--ui-text-muted)' }}>
            {helperText}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function EmptyState({ title, description, action }: { action?: ReactNode; description: string; title: string }) {
  return (
    <div
      className="rounded-[28px] border border-dashed px-5 py-8 text-center shadow-sm"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 44%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <h3 className="text-[18px] font-bold tracking-[-0.02em]" style={{ color: 'var(--ui-text-strong)' }}>
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6" style={{ color: 'var(--ui-text-muted)' }}>
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MessageBanner({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return (
    <div
      className="rounded-[20px] border px-4 py-3 text-[13px] font-medium leading-6"
      style={{
        ...toneStyle(tone),
        boxShadow: '0 10px 24px -20px rgba(88,49,66,0.14)',
      }}
    >
      {children}
    </div>
  );
}
