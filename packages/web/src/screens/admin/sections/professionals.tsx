'use client';

import type { ProfessionalApplicationReviewItem } from '@marketplace/marketplace-core';
import {
  DocumentList,
  EmptyState,
  EntityCard,
  JsonPreviewBlock,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  SurfaceCard,
  TextAreaField,
} from '@marketplace/ui';
import type { Dispatch, SetStateAction } from 'react';
import { getApiOrigin } from '../../../lib/env';

export function ProfessionalsSection({
  applications,
  busy,
  onReview,
  reviewNotes,
  setReviewNotes,
}: {
  applications: ProfessionalApplicationReviewItem[];
  busy: boolean;
  onReview: (applicationId: string, decision: 'approved' | 'changes_requested' | 'rejected') => Promise<void>;
  reviewNotes: Record<string, string>;
  setReviewNotes: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <SurfaceCard
      title="Antrean review profesional"
      description="Tinjau profil, dokumen, dan status pengajuan profesional dari satu tempat."
    >
      {applications.length ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <EntityCard
              key={application.applicationId}
              badge={<StatusPill tone="accent">{application.applicationStatus}</StatusPill>}
              subtitle={`Review: ${application.reviewStatus || 'draft'} • Slug: ${application.slug || '-'}`}
              title={application.displayName || application.userId}
              actions={
                <>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() => void onReview(application.applicationId, 'changes_requested')}
                    type="button"
                  >
                    Revise
                  </SecondaryButton>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() => void onReview(application.applicationId, 'rejected')}
                    type="button"
                  >
                    Reject
                  </SecondaryButton>
                  <PrimaryButton
                    disabled={busy}
                    onClick={() => void onReview(application.applicationId, 'approved')}
                    type="button"
                  >
                    Approve
                  </PrimaryButton>
                </>
              }
            >
              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
                <JsonPreviewBlock label="Detail pengajuan" value={application.attributes ?? {}} />

                <div className="space-y-4">
                  <DocumentList
                    emptyLabel="Belum ada dokumen yang dilampirkan."
                    items={(application.documents ?? []).map((document) => ({
                      href: new URL(document.documentUrl, getApiOrigin()).toString(),
                      id: document.id,
                      label: `${document.documentKey}: ${document.fileName || document.documentUrl}`,
                      meta: document.fileName || document.documentUrl,
                    }))}
                  />

                  <TextAreaField
                    label="Catatan review"
                    value={reviewNotes[application.applicationId] || application.reviewNotes || ''}
                    onChange={(event) =>
                      setReviewNotes((current) => ({
                        ...current,
                        [application.applicationId]: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </EntityCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada aplikasi profesional"
          description="Pengajuan profesional akan masuk ke antrean ini setelah dikirim."
        />
      )}
    </SurfaceCard>
  );
}
