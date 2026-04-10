'use client';

import { EditableItemCard } from '@marketplace/ui/patterns';
import { CheckboxField, PrimaryButton, SecondaryButton, TextAreaField, TextField } from '@marketplace/ui/primitives';
import type { Dispatch, SetStateAction } from 'react';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import type { CredentialForm, StoryForm } from '../types';
import { updateAtIndex } from '../utils';

export function TrustSection({
  busy,
  credentials,
  onSave,
  setCredentials,
  setStories,
  stories,
}: {
  busy: boolean;
  credentials: CredentialForm[];
  onSave: () => Promise<void>;
  setCredentials: Dispatch<SetStateAction<CredentialForm[]>>;
  setStories: Dispatch<SetStateAction<StoryForm[]>>;
  stories: StoryForm[];
}) {
  return (
    <div className="space-y-6">
      <WorkspaceSurfaceCard
        title="Kredensial"
        description="Tampilkan lisensi, sertifikat, dan bukti profesional lain yang paling penting."
      >
        <div className="space-y-4">
          {credentials.map((credential, index) => (
            <EditableItemCard
              key={credential.id || `credential-${index}`}
              onRemove={() => setCredentials((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              title={`Kredensial ${index + 1}`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nama kredensial"
                  value={credential.label}
                  onChange={(event) =>
                    setCredentials((current) =>
                      updateAtIndex(current, index, { ...credential, label: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Penerbit"
                  value={credential.issuer}
                  onChange={(event) =>
                    setCredentials((current) =>
                      updateAtIndex(current, index, { ...credential, issuer: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Nomor / kode"
                  value={credential.credentialCode}
                  onChange={(event) =>
                    setCredentials((current) =>
                      updateAtIndex(current, index, { ...credential, credentialCode: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Diterbitkan"
                  type="date"
                  value={credential.issuedAt}
                  onChange={(event) =>
                    setCredentials((current) =>
                      updateAtIndex(current, index, { ...credential, issuedAt: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Berlaku sampai"
                  type="date"
                  value={credential.expiresAt}
                  onChange={(event) =>
                    setCredentials((current) =>
                      updateAtIndex(current, index, { ...credential, expiresAt: event.target.value }),
                    )
                  }
                />
              </div>
            </EditableItemCard>
          ))}
        </div>
        <div className="mt-5">
          <SecondaryButton
            onClick={() =>
              setCredentials((current) => [
                ...current,
                { credentialCode: '', expiresAt: '', issuedAt: '', issuer: '', label: '' },
              ])
            }
            type="button"
          >
            Tambah kredensial
          </SecondaryButton>
        </div>
      </WorkspaceSurfaceCard>

      <WorkspaceSurfaceCard
        title="Cerita profesional"
        description="Cerita singkat ini akan membantu customer memahami gaya layanan Anda."
      >
        <div className="space-y-4">
          {stories.map((story, index) => (
            <EditableItemCard
              key={story.id || `story-${index}`}
              onRemove={() => setStories((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              title={`Cerita ${index + 1}`}
            >
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Judul"
                    value={story.title}
                    onChange={(event) =>
                      setStories((current) => updateAtIndex(current, index, { ...story, title: event.target.value }))
                    }
                  />
                  <TextField
                    label="Urutan tampil"
                    value={story.sortOrder}
                    onChange={(event) =>
                      setStories((current) =>
                        updateAtIndex(current, index, { ...story, sortOrder: event.target.value }),
                      )
                    }
                  />
                </div>
                <TextAreaField
                  label="Isi cerita"
                  value={story.body}
                  onChange={(event) =>
                    setStories((current) => updateAtIndex(current, index, { ...story, body: event.target.value }))
                  }
                />
                <CheckboxField
                  checked={story.isPublished}
                  label="Tampilkan ke publik"
                  onChange={(checked) =>
                    setStories((current) => updateAtIndex(current, index, { ...story, isPublished: checked }))
                  }
                />
              </div>
            </EditableItemCard>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <SecondaryButton
            onClick={() =>
              setStories((current) => [
                ...current,
                { body: '', isPublished: true, sortOrder: String(current.length), title: '' },
              ])
            }
            type="button"
          >
            Tambah cerita
          </SecondaryButton>
          <PrimaryButton disabled={busy} onClick={() => void onSave()} type="button">
            {busy ? 'Menyimpan...' : 'Simpan trust'}
          </PrimaryButton>
        </div>
      </WorkspaceSurfaceCard>
    </div>
  );
}
