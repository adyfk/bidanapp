'use client';

import { MessageBanner, PrimaryButton, SecondaryButton, TextField } from '@marketplace/ui';
import type { FormEvent } from 'react';

export function MarketplaceRecoveryForm({
  busy,
  challengeId,
  code,
  maskedDestination,
  newPassword,
  onResend,
  onSubmit,
  phone,
  setChallengeId,
  setCode,
  setNewPassword,
  setPhone,
  submitLabel,
}: {
  busy: boolean;
  challengeId: string;
  code: string;
  maskedDestination: string;
  newPassword: string;
  onResend: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  phone: string;
  setChallengeId: (value: string) => void;
  setCode: (value: string) => void;
  setNewPassword: (value: string) => void;
  setPhone: (value: string) => void;
  submitLabel: string;
}) {
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <TextField
        accent="pink"
        autoComplete="tel"
        inputMode="tel"
        label="Nomor ponsel terdaftar"
        placeholder="628111111001"
        surface="muted"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      {challengeId ? (
        <>
          <TextField
            accent="pink"
            label="Challenge ID"
            surface="muted"
            value={challengeId}
            onChange={(event) => setChallengeId(event.target.value)}
          />
          <TextField
            accent="pink"
            autoComplete="one-time-code"
            inputMode="numeric"
            label="OTP"
            placeholder="123456"
            surface="muted"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <TextField
            accent="pink"
            autoComplete="new-password"
            helperText="Minimal 8 karakter, dengan huruf besar dan angka."
            label="Password baru"
            placeholder="Buat password baru"
            surface="muted"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </>
      ) : null}

      {maskedDestination ? (
        <MessageBanner tone="info">{`OTP sedang dikirim ke ${maskedDestination}.`}</MessageBanner>
      ) : null}

      <div className="space-y-3">
        <PrimaryButton className="w-full" disabled={busy} type="submit">
          {submitLabel}
        </PrimaryButton>
        {challengeId ? (
          <SecondaryButton className="w-full" disabled={busy} onClick={onResend} type="button">
            {busy ? 'Memproses...' : 'Kirim ulang OTP'}
          </SecondaryButton>
        ) : null}
      </div>
    </form>
  );
}
