'use client';

import { Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StandardNumberInput } from '@/components/ui/form-controls';
import { dashboardInputClass, dashboardTextareaClass } from './editorStyles';
import { DashboardDialog, LabeledField } from './ProfessionalDashboardShared';
import type { CredentialDraft } from './types';

interface ProfessionalDashboardTrustCredentialEditorDialogProps {
  credentialDraft: CredentialDraft;
  onChangeDraft: (draft: CredentialDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
}

export const ProfessionalDashboardTrustCredentialEditorDialog = ({
  credentialDraft,
  onChangeDraft,
  onClose,
  onDelete,
  onSave,
}: ProfessionalDashboardTrustCredentialEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const updateDraft = (changes: Partial<CredentialDraft>) => onChangeDraft({ ...credentialDraft, ...changes });

  return (
    <DashboardDialog
      closeLabel={t('trust.closeButton')}
      description={credentialDraft.note || t('trust.credentialsDescription')}
      eyebrow={t('trust.credentials')}
      onClose={onClose}
      title={credentialDraft.title || t('trust.credentialEditor.title')}
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
        <LabeledField label={t('trust.credentialEditor.fields.title')}>
          <input
            type="text"
            value={credentialDraft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            className={dashboardInputClass}
          />
        </LabeledField>
        <div className="grid grid-cols-2 gap-3">
          <LabeledField label={t('trust.credentialEditor.fields.issuer')}>
            <input
              type="text"
              value={credentialDraft.issuer}
              onChange={(event) => updateDraft({ issuer: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('trust.credentialEditor.fields.year')}>
            <StandardNumberInput
              maxLength={4}
              value={credentialDraft.year}
              onValueChange={(nextValue) => updateDraft({ year: nextValue })}
              accent="blue"
              surface="muted"
              className={dashboardInputClass}
            />
          </LabeledField>
        </div>
        <LabeledField label={t('trust.credentialEditor.fields.note')}>
          <textarea
            value={credentialDraft.note}
            onChange={(event) => updateDraft({ note: event.target.value })}
            className={dashboardTextareaClass}
          />
        </LabeledField>
      </div>
    </DashboardDialog>
  );
};
