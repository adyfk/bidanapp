'use client';

import { EditableItemCard } from '@marketplace/ui/patterns';
import { PrimaryButton, SecondaryButton, TextField } from '@marketplace/ui/primitives';
import type { Dispatch, SetStateAction } from 'react';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import type { CoverageAreaForm } from '../types';
import { updateAtIndex } from '../utils';

export function CoverageSection({
  busy,
  coverageAreas,
  onSave,
  setCoverageAreas,
}: {
  busy: boolean;
  coverageAreas: CoverageAreaForm[];
  onSave: () => Promise<void>;
  setCoverageAreas: Dispatch<SetStateAction<CoverageAreaForm[]>>;
}) {
  return (
    <WorkspaceSurfaceCard
      title="Jangkauan layanan"
      description="Daftar area ini akan muncul di halaman profesional dan membantu customer memahami cakupan Anda."
    >
      <div className="space-y-4">
        {coverageAreas.map((area, index) => (
          <EditableItemCard
            key={area.id || `coverage-${index}`}
            onRemove={() => setCoverageAreas((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            title={`Area ${index + 1}`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Label area"
                value={area.areaLabel}
                onChange={(event) =>
                  setCoverageAreas((current) =>
                    updateAtIndex(current, index, { ...area, areaLabel: event.target.value }),
                  )
                }
              />
              <TextField
                label="Kota"
                value={area.city}
                onChange={(event) =>
                  setCoverageAreas((current) => updateAtIndex(current, index, { ...area, city: event.target.value }))
                }
              />
            </div>
          </EditableItemCard>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <SecondaryButton
          onClick={() => setCoverageAreas((current) => [...current, { areaLabel: '', city: '' }])}
          type="button"
        >
          Tambah area
        </SecondaryButton>
        <PrimaryButton disabled={busy} onClick={() => void onSave()} type="button">
          {busy ? 'Menyimpan...' : 'Simpan jangkauan'}
        </PrimaryButton>
      </div>
    </WorkspaceSurfaceCard>
  );
}
