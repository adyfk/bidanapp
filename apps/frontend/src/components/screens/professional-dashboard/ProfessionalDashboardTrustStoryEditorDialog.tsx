'use client';

import { Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { dashboardInputClass, dashboardTextareaClass } from './editorStyles';
import { DashboardDialog, LabeledField } from './ProfessionalDashboardShared';
import type { ActivityStoryDraft } from './types';

interface ProfessionalDashboardTrustStoryEditorDialogProps {
  onChangeDraft: (draft: ActivityStoryDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
  storyDraft: ActivityStoryDraft;
}

export const ProfessionalDashboardTrustStoryEditorDialog = ({
  onChangeDraft,
  onClose,
  onDelete,
  onSave,
  storyDraft,
}: ProfessionalDashboardTrustStoryEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const updateDraft = (changes: Partial<ActivityStoryDraft>) => onChangeDraft({ ...storyDraft, ...changes });

  return (
    <DashboardDialog
      closeLabel={t('trust.closeButton')}
      description={storyDraft.note || t('trust.storiesDescription')}
      eyebrow={t('trust.stories')}
      onClose={onClose}
      title={storyDraft.title || t('trust.storyEditor.title')}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-[14px] font-bold text-white"
          >
            <Save className="h-4 w-4" />
            {t('trust.saveButton')}
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-[14px] font-bold text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              {t('trust.deleteButton')}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4">
        <LabeledField label={t('trust.storyEditor.fields.title')}>
          <input
            type="text"
            value={storyDraft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            className={dashboardInputClass}
          />
        </LabeledField>
        <div className="grid grid-cols-2 gap-3">
          <LabeledField label={t('trust.storyEditor.fields.capturedAt')}>
            <input
              type="text"
              value={storyDraft.capturedAt}
              onChange={(event) => updateDraft({ capturedAt: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('trust.storyEditor.fields.location')}>
            <input
              type="text"
              value={storyDraft.location}
              onChange={(event) => updateDraft({ location: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
        </div>
        <LabeledField label={t('trust.storyEditor.fields.image')}>
          <input
            type="text"
            value={storyDraft.image}
            onChange={(event) => updateDraft({ image: event.target.value })}
            className={dashboardInputClass}
          />
        </LabeledField>
        <LabeledField label={t('trust.storyEditor.fields.note')}>
          <textarea
            value={storyDraft.note}
            onChange={(event) => updateDraft({ note: event.target.value })}
            className={dashboardTextareaClass}
          />
        </LabeledField>
      </div>
    </DashboardDialog>
  );
};
