'use client';

import { EditableItemCard, PrimaryButton, SecondaryButton, TextAreaField, TextField } from '@marketplace/ui';
import type { Dispatch, SetStateAction } from 'react';
import { WorkspaceSurfaceCard } from '../parts/surface-card';
import type { GalleryAssetForm, PortfolioEntryForm } from '../types';
import { updateAtIndex } from '../utils';

export function PortfolioSection({
  busy,
  galleryAssets,
  onSave,
  portfolioEntries,
  setGalleryAssets,
  setPortfolioEntries,
}: {
  busy: boolean;
  galleryAssets: GalleryAssetForm[];
  onSave: () => Promise<void>;
  portfolioEntries: PortfolioEntryForm[];
  setGalleryAssets: Dispatch<SetStateAction<GalleryAssetForm[]>>;
  setPortfolioEntries: Dispatch<SetStateAction<PortfolioEntryForm[]>>;
}) {
  return (
    <div className="space-y-6">
      <WorkspaceSurfaceCard
        title="Portofolio"
        description="Tampilkan studi kasus, hasil pendampingan, atau materi edukasi yang ingin dilihat customer."
      >
        <div className="space-y-4">
          {portfolioEntries.map((entry, index) => (
            <EditableItemCard
              key={entry.id || `entry-${index}`}
              onRemove={() => setPortfolioEntries((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              title={`Portofolio ${index + 1}`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Judul"
                  value={entry.title}
                  onChange={(event) =>
                    setPortfolioEntries((current) =>
                      updateAtIndex(current, index, { ...entry, title: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Link aset"
                  value={entry.assetUrl}
                  onChange={(event) =>
                    setPortfolioEntries((current) =>
                      updateAtIndex(current, index, { ...entry, assetUrl: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Urutan tampil"
                  value={entry.sortOrder}
                  onChange={(event) =>
                    setPortfolioEntries((current) =>
                      updateAtIndex(current, index, { ...entry, sortOrder: event.target.value }),
                    )
                  }
                />
                <TextAreaField
                  className="md:col-span-2"
                  label="Cerita singkat"
                  value={entry.description}
                  onChange={(event) =>
                    setPortfolioEntries((current) =>
                      updateAtIndex(current, index, { ...entry, description: event.target.value }),
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
              setPortfolioEntries((current) => [
                ...current,
                { assetUrl: '', description: '', sortOrder: String(current.length), title: '' },
              ])
            }
            type="button"
          >
            Tambah portofolio
          </SecondaryButton>
        </div>
      </WorkspaceSurfaceCard>

      <WorkspaceSurfaceCard
        title="Galeri"
        description="Tambahkan visual pendukung untuk memperkaya halaman profesional Anda."
      >
        <div className="space-y-4">
          {galleryAssets.map((asset, index) => (
            <EditableItemCard
              key={asset.id || `gallery-${index}`}
              onRemove={() => setGalleryAssets((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              title={`Gambar ${index + 1}`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nama file"
                  value={asset.fileName}
                  onChange={(event) =>
                    setGalleryAssets((current) =>
                      updateAtIndex(current, index, { ...asset, fileName: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Link aset"
                  value={asset.assetUrl}
                  onChange={(event) =>
                    setGalleryAssets((current) =>
                      updateAtIndex(current, index, { ...asset, assetUrl: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Keterangan"
                  value={asset.caption}
                  onChange={(event) =>
                    setGalleryAssets((current) =>
                      updateAtIndex(current, index, { ...asset, caption: event.target.value }),
                    )
                  }
                />
                <TextField
                  label="Urutan tampil"
                  value={asset.sortOrder}
                  onChange={(event) =>
                    setGalleryAssets((current) =>
                      updateAtIndex(current, index, { ...asset, sortOrder: event.target.value }),
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
              setGalleryAssets((current) => [
                ...current,
                { assetUrl: '', caption: '', fileName: '', sortOrder: String(current.length) },
              ])
            }
            type="button"
          >
            Tambah gambar
          </SecondaryButton>
          <PrimaryButton disabled={busy} onClick={() => void onSave()} type="button">
            {busy ? 'Menyimpan...' : 'Simpan portfolio'}
          </PrimaryButton>
        </div>
      </WorkspaceSurfaceCard>
    </div>
  );
}
