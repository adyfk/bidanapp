'use client';

import { Ban, CircleSlash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AppointmentClosePreview } from '@/features/appointments/lib/cancellation';
import type { ProfessionalManagedRequest } from '@/lib/use-professional-portal';
import { dashboardTextareaClass } from './editorStyles';
import { DashboardDialog, LabeledField, ServiceMetaChip } from './ProfessionalDashboardShared';
import type { RequestCloseDraft } from './types';

interface ProfessionalDashboardRequestCloseDialogProps {
  draft: RequestCloseDraft;
  getAreaLabel: (areaId: string) => string;
  getServiceLabel: (serviceId: string) => string;
  onChangeDraft: (draft: RequestCloseDraft) => void;
  onClose: () => void;
  onSave: () => void;
  preview: AppointmentClosePreview;
  request: ProfessionalManagedRequest;
  validationMessage?: string | null;
}

export const ProfessionalDashboardRequestCloseDialog = ({
  draft,
  getAreaLabel,
  getServiceLabel,
  onChangeDraft,
  onClose,
  onSave,
  preview,
  request,
  validationMessage,
}: ProfessionalDashboardRequestCloseDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const nextStatus = preview.nextStatus === 'rejected' ? 'rejected' : 'cancelled';
  const outcome = preview.financialOutcome || 'none';
  const previewStatusKey =
    request.customerStatus === 'requested' ||
    request.customerStatus === 'approved_waiting_payment' ||
    request.customerStatus === 'paid' ||
    request.customerStatus === 'confirmed'
      ? request.customerStatus
      : 'confirmed';

  return (
    <DashboardDialog
      closeLabel={t('requests.closeButton')}
      description={t('requests.closeDialogDescription')}
      eyebrow={t('requests.closeDialogEyebrow')}
      onClose={onClose}
      title={request.clientName}
      footer={
        <button
          type="button"
          onClick={onSave}
          disabled={!draft.reason.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {nextStatus === 'rejected' ? <Ban className="h-4 w-4" /> : <CircleSlash className="h-4 w-4" />}
          {t(`requests.closeSave.${nextStatus}`)}
        </button>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            <ServiceMetaChip
              label={t('requests.fields.service')}
              value={request.serviceName || getServiceLabel(request.serviceId)}
            />
            <ServiceMetaChip label={t('requests.fields.area')} value={getAreaLabel(request.areaId)} />
            <ServiceMetaChip label={t('requests.fields.budget')} value={request.budgetLabel} />
          </div>
        </div>

        <div className="rounded-[20px] border border-red-100 bg-red-50/80 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-red-500">
            {t('requests.closeOutcomeTitle')}
          </p>
          <p className="mt-2 text-[16px] font-bold text-slate-900">{t(`requests.closeOutcome.${outcome}`)}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
            {t(`requests.closeStatusPreview.${previewStatusKey}`)}
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <LabeledField label={t('requests.closeReasonLabel')}>
            <textarea
              value={draft.reason}
              onChange={(event) => onChangeDraft({ reason: event.target.value })}
              className={dashboardTextareaClass}
              placeholder={t('requests.closeReasonPlaceholder')}
            />
          </LabeledField>

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
