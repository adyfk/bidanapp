'use client';

import { ArrowRight, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getProfessionalRequestTransitionMeta } from '@/features/professional-portal/lib/request-status';
import type { ProfessionalManagedRequest, ProfessionalRequestStatus } from '@/lib/use-professional-portal';
import { dashboardInputClass, dashboardTextareaClass } from './editorStyles';
import { DashboardDialog, LabeledField, ServiceMetaChip } from './ProfessionalDashboardShared';
import type { RequestStatusDraft } from './types';

interface ProfessionalDashboardRequestStatusDialogProps {
  draft: RequestStatusDraft;
  getAreaLabel: (areaId: string) => string;
  getServiceLabel: (serviceId: string) => string;
  onChangeDraft: (draft: RequestStatusDraft) => void;
  onClose: () => void;
  onSave: () => void;
  request: ProfessionalManagedRequest;
  saveDisabled?: boolean;
  statusLabel: (status: ProfessionalRequestStatus) => string;
  validationMessage?: string | null;
}

export const ProfessionalDashboardRequestStatusDialog = ({
  draft,
  getAreaLabel,
  getServiceLabel,
  onChangeDraft,
  onClose,
  onSave,
  request,
  saveDisabled = false,
  statusLabel,
  validationMessage,
}: ProfessionalDashboardRequestStatusDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const updateDraft = (changes: Partial<RequestStatusDraft>) => onChangeDraft({ ...draft, ...changes });
  const transition = getProfessionalRequestTransitionMeta(request.status, draft.nextStatus);

  return (
    <DashboardDialog
      closeLabel={t('requests.closeButton')}
      description={t('requests.evidence.description')}
      eyebrow={t('requests.statusUpdateTitle')}
      onClose={onClose}
      title={request.clientName}
      footer={
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Save className="h-4 w-4" />
          {t('requests.saveButton')}
        </button>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-slate-500">
            <span>{statusLabel(request.status)}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900">{statusLabel(draft.nextStatus)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ServiceMetaChip label={t('requests.fields.service')} value={getServiceLabel(request.serviceId)} />
            <ServiceMetaChip label={t('requests.fields.area')} value={getAreaLabel(request.areaId)} />
            <ServiceMetaChip label={t('requests.fields.budget')} value={request.budgetLabel} />
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {t('requests.evidence.title')}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{t('requests.evidence.helper')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {transition.customerSummaryRequired ? (
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                {t('requests.requirements.customerSummary')}
              </span>
            ) : null}
            {transition.evidenceRequired ? (
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-[11px] font-semibold text-blue-700">
                {t('requests.requirements.evidence')}
              </span>
            ) : null}
            {transition.evidenceNoteRequired ? (
              <span className="rounded-full bg-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                {t('requests.requirements.internalNote')}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4">
            <LabeledField label={t('requests.evidence.customerSummaryLabel')}>
              <textarea
                value={draft.customerSummary}
                onChange={(event) => updateDraft({ customerSummary: event.target.value })}
                className={dashboardTextareaClass}
              />
            </LabeledField>
            <LabeledField label={t('requests.evidence.noteLabel')}>
              <textarea
                value={draft.evidenceNote}
                onChange={(event) => updateDraft({ evidenceNote: event.target.value })}
                className={dashboardTextareaClass}
              />
            </LabeledField>
            <LabeledField label={t('requests.evidence.urlLabel')}>
              <input
                type="url"
                value={draft.evidenceUrl}
                onChange={(event) => updateDraft({ evidenceUrl: event.target.value })}
                className={dashboardInputClass}
                placeholder="https://"
              />
            </LabeledField>
          </div>

          {validationMessage ? (
            <p className="mt-4 rounded-[16px] border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
              {validationMessage}
            </p>
          ) : null}
        </div>
      </div>
    </DashboardDialog>
  );
};
