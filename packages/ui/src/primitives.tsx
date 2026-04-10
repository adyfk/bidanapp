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
        'inline-flex min-h-12 items-center justify-center rounded-full border border-transparent px-5 py-3 text-[13px] font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-primary) 66%, var(--ui-secondary)) 100%)',
        boxShadow: '0 20px 32px -22px rgba(18,59,74,0.34)',
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
        'inline-flex min-h-12 items-center justify-center rounded-full border px-5 py-3 text-[13px] font-bold transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{
        backgroundColor: '#ffffff',
        borderColor: 'var(--ui-border)',
        boxShadow: '0 10px 26px -22px rgba(15,23,42,0.24)',
        color: 'var(--ui-text-muted)',
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
        'inline-flex min-h-11 items-center justify-center rounded-[var(--ui-radius-pill)] border border-transparent px-4 py-2.5 text-sm font-semibold transition duration-200 hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
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
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold',
        tone === 'accent' ? 'uppercase tracking-[0.12em]' : '',
      )}
      style={toneStyle(tone)}
    >
      {children}
    </span>
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
        backgroundColor: 'var(--ui-surface-muted)',
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
        backgroundColor: '#ffffff',
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
        boxShadow: '0 8px 24px -20px rgba(15,23,42,0.18)',
      }}
    >
      {children}
    </div>
  );
}
