'use client';

import { EditableItemCard } from '@marketplace/ui/patterns';
import { CheckboxField, PrimaryButton, SecondaryButton, TextField } from '@marketplace/ui/primitives';
import type { Dispatch, SetStateAction } from 'react';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import type { AvailabilityRuleForm } from '../types';
import { updateAtIndex } from '../utils';

export function AvailabilitySection({
  availabilityRules,
  busy,
  onSave,
  setAvailabilityRules,
}: {
  availabilityRules: AvailabilityRuleForm[];
  busy: boolean;
  onSave: () => Promise<void>;
  setAvailabilityRules: Dispatch<SetStateAction<AvailabilityRuleForm[]>>;
}) {
  return (
    <WorkspaceSurfaceCard
      title="Jam ketersediaan"
      description="Atur hari dan jam aktif agar customer tahu kapan Anda biasanya tersedia."
    >
      <div className="space-y-4">
        {availabilityRules.map((rule, index) => (
          <EditableItemCard
            key={rule.id || `availability-${index}`}
            onRemove={() => setAvailabilityRules((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            title={`Jadwal ${index + 1}`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Hari"
                value={rule.weekday}
                onChange={(event) =>
                  setAvailabilityRules((current) =>
                    updateAtIndex(current, index, { ...rule, weekday: event.target.value }),
                  )
                }
              />
              <CheckboxField
                checked={rule.isUnavailable}
                label="Tandai tidak tersedia"
                onChange={(checked) =>
                  setAvailabilityRules((current) => updateAtIndex(current, index, { ...rule, isUnavailable: checked }))
                }
              />
              <TextField
                label="Jam mulai"
                type="time"
                value={rule.startTime}
                onChange={(event) =>
                  setAvailabilityRules((current) =>
                    updateAtIndex(current, index, { ...rule, startTime: event.target.value }),
                  )
                }
              />
              <TextField
                label="Jam selesai"
                type="time"
                value={rule.endTime}
                onChange={(event) =>
                  setAvailabilityRules((current) =>
                    updateAtIndex(current, index, { ...rule, endTime: event.target.value }),
                  )
                }
              />
            </div>
          </EditableItemCard>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <SecondaryButton
          onClick={() =>
            setAvailabilityRules((current) => [
              ...current,
              { endTime: '17:00', isUnavailable: false, startTime: '09:00', weekday: '1' },
            ])
          }
          type="button"
        >
          Tambah jadwal
        </SecondaryButton>
        <PrimaryButton disabled={busy} onClick={() => void onSave()} type="button">
          {busy ? 'Menyimpan...' : 'Simpan jadwal'}
        </PrimaryButton>
      </div>
    </WorkspaceSurfaceCard>
  );
}
