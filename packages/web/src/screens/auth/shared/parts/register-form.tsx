'use client';

import { PrimaryButton, TextField } from '@marketplace/ui';
import type { FormEvent } from 'react';

export function MarketplaceRegisterForm({
  busy,
  city,
  displayName,
  onSubmit,
  password,
  phone,
  setCity,
  setDisplayName,
  setPassword,
  setPhone,
  submitLabel,
}: {
  busy: boolean;
  city: string;
  displayName: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  phone: string;
  setCity: (value: string) => void;
  setDisplayName: (value: string) => void;
  setPassword: (value: string) => void;
  setPhone: (value: string) => void;
  submitLabel: string;
}) {
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <TextField
        accent="pink"
        autoComplete="name"
        label="Nama lengkap"
        placeholder="Nama lengkap Anda"
        surface="muted"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
      />
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
        autoComplete="address-level2"
        label="Kota"
        placeholder="Kota domisili"
        surface="muted"
        value={city}
        onChange={(event) => setCity(event.target.value)}
      />
      <TextField
        accent="pink"
        autoComplete="new-password"
        helperText="Minimal 8 karakter, dengan huruf besar dan angka."
        label="Password"
        placeholder="Buat password"
        surface="muted"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PrimaryButton className="w-full" disabled={busy} type="submit">
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
