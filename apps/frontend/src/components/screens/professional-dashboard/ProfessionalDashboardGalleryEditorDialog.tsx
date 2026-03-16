'use client';

import { Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { dashboardInputClass } from './editorStyles';
import { DashboardDialog, LabeledField } from './ProfessionalDashboardShared';
import type { GalleryDraft } from './types';

interface ProfessionalDashboardGalleryEditorDialogProps {
  galleryDraft: GalleryDraft;
  onChangeDraft: (draft: GalleryDraft) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export const ProfessionalDashboardGalleryEditorDialog = ({
  galleryDraft,
  onChangeDraft,
  onClose,
  onDelete,
  onSave,
}: ProfessionalDashboardGalleryEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const updateDraft = (changes: Partial<GalleryDraft>) => onChangeDraft({ ...galleryDraft, ...changes });

  return (
    <DashboardDialog
      badges={
        galleryDraft.isFeatured ? (
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
            {t('portfolio.featuredAsset')}
          </span>
        ) : null
      }
      closeLabel={t('portfolio.closeButton')}
      description={galleryDraft.alt}
      eyebrow={t('portfolio.galleryTitle')}
      onClose={onClose}
      title={galleryDraft.label || t('portfolio.galleryTitle')}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-[14px] font-bold text-white"
          >
            <Save className="h-4 w-4" />
            {t('portfolio.gallerySaveButton')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-[14px] font-bold text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            {t('portfolio.galleryDeleteButton')}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <LabeledField label={t('portfolio.galleryFields.label')}>
          <input
            type="text"
            value={galleryDraft.label}
            onChange={(event) => updateDraft({ label: event.target.value })}
            className={dashboardInputClass}
          />
        </LabeledField>
        <LabeledField label={t('portfolio.galleryFields.alt')}>
          <input
            type="text"
            value={galleryDraft.alt}
            onChange={(event) => updateDraft({ alt: event.target.value })}
            className={dashboardInputClass}
          />
        </LabeledField>
        <LabeledField label={t('portfolio.galleryFields.image')}>
          <input
            type="text"
            value={galleryDraft.image}
            onChange={(event) => updateDraft({ image: event.target.value })}
            className={dashboardInputClass}
          />
        </LabeledField>
        <label className="flex items-start justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[14px] font-bold text-slate-900">{t('portfolio.galleryFields.featured')}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('portfolio.galleryFeaturedHint')}</p>
          </div>
          <input
            type="checkbox"
            checked={galleryDraft.isFeatured}
            onChange={(event) => updateDraft({ isFeatured: event.target.checked })}
            className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>
    </DashboardDialog>
  );
};
