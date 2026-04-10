'use client';

import { PrimaryButton, TextField } from '@marketplace/ui/primitives';
import type { FormEvent } from 'react';

export function MarketplaceLoginForm({
  busy,
  forgotPasswordHref,
  onSubmit,
  password,
  phone,
  platformLabel,
  setPassword,
  setPhone,
  submitLabel,
}: {
  busy: boolean;
  forgotPasswordHref: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  phone: string;
  platformLabel: string;
  setPassword: (value: string) => void;
  setPhone: (value: string) => void;
  submitLabel: string;
}) {
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <TextField
        accent="pink"
        autoComplete="tel"
        inputMode="tel"
        label="Nomor ponsel"
        placeholder="628111111001"
        surface="muted"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <TextField
        accent="pink"
        autoComplete="current-password"
        label="Password"
        placeholder="Masukkan password"
        surface="muted"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <a href={forgotPasswordHref} className="text-[12px] font-semibold" style={{ color: 'var(--ui-primary)' }}>
          Lupa password?
        </a>
        <span className="text-[12px] font-medium text-gray-400">{platformLabel}</span>
      </div>
      <PrimaryButton className="w-full" disabled={busy} type="submit">
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
