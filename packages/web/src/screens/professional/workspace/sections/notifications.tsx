'use client';

import { CheckboxField, PrimaryButton } from '@marketplace/ui/primitives';
import type { Dispatch, SetStateAction } from 'react';
import { WorkspaceSurfaceCard } from '../parts/surface-card';

export function NotificationSection({
  busy,
  form,
  onChange,
  onSave,
}: {
  busy: boolean;
  form: {
    emailEnabled: boolean;
    webEnabled: boolean;
    whatsappEnabled: boolean;
  };
  onChange: Dispatch<
    SetStateAction<{
      emailEnabled: boolean;
      webEnabled: boolean;
      whatsappEnabled: boolean;
    }>
  >;
  onSave: () => Promise<void>;
}) {
  return (
    <WorkspaceSurfaceCard
      title="Preferensi notifikasi"
      description="Pilih kanal notifikasi yang paling nyaman untuk Anda pakai sehari-hari."
    >
      <div className="space-y-4">
        <CheckboxField
          checked={form.webEnabled}
          label="Notifikasi web"
          onChange={(checked) => onChange((current) => ({ ...current, webEnabled: checked }))}
        />
        <CheckboxField
          checked={form.emailEnabled}
          label="Notifikasi email"
          onChange={(checked) => onChange((current) => ({ ...current, emailEnabled: checked }))}
        />
        <CheckboxField
          checked={form.whatsappEnabled}
          label="Notifikasi WhatsApp"
          onChange={(checked) => onChange((current) => ({ ...current, whatsappEnabled: checked }))}
        />
      </div>
      <div className="mt-6">
        <PrimaryButton disabled={busy} onClick={() => void onSave()} type="button">
          {busy ? 'Menyimpan...' : 'Simpan preferensi'}
        </PrimaryButton>
      </div>
    </WorkspaceSurfaceCard>
  );
}
