'use client';

import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  accentPrimaryButtonClass,
  accentSoftPillClass,
  blushSubtlePanelClass,
  neutralSoftPillClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import type { GlobalService, ServiceDeliveryMode } from '@/types/catalog';
import { dashboardInputClass, dashboardTextareaClass } from './editorStyles';
import { deliveryModes, isServiceModeEnabled } from './helpers';
import { DashboardDialog, LabeledField, SegmentButton, SelectableChip } from './ProfessionalDashboardShared';
import type { ServiceDraft } from './types';

interface ProfessionalDashboardServiceEditorDialogProps {
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  onChangeDraft: (draft: ServiceDraft) => void;
  onClose: () => void;
  onSave: () => void;
  onToggleActivation: () => void;
  onToggleMode: (mode: ServiceDeliveryMode) => void;
  serviceDraft: ServiceDraft;
  serviceIsActive: boolean;
  serviceTemplate: Pick<GlobalService, 'description' | 'name'>;
}

export const ProfessionalDashboardServiceEditorDialog = ({
  getModeLabel,
  onChangeDraft,
  onClose,
  onSave,
  onToggleActivation,
  onToggleMode,
  serviceDraft,
  serviceIsActive,
  serviceTemplate,
}: ProfessionalDashboardServiceEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const updateDraft = (changes: Partial<ServiceDraft>) => onChangeDraft({ ...serviceDraft, ...changes });
  const enabledModes = deliveryModes.filter((mode) => isServiceModeEnabled(serviceDraft.serviceModes, mode));

  return (
    <DashboardDialog
      badges={
        <>
          <span className={serviceIsActive ? accentSoftPillClass : neutralSoftPillClass}>
            {serviceIsActive ? t('services.activeBadge') : t('services.templateBadge')}
          </span>
          {serviceDraft.featured ? <span className={neutralSoftPillClass}>{t('services.featuredBadge')}</span> : null}
        </>
      }
      closeLabel={t('services.closeButton')}
      description={serviceTemplate.description}
      eyebrow={t('services.editorTitle')}
      onClose={onClose}
      title={serviceTemplate.name}
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSave}
            className={`${accentPrimaryButtonClass} flex flex-1 items-center justify-center gap-2`}
          >
            <Save className="h-4 w-4" />
            {t('services.saveButton')}
          </button>
          <button
            type="button"
            onClick={onToggleActivation}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold ${
              serviceIsActive
                ? 'border border-slate-200 bg-white text-slate-700 shadow-[inset_0_0_0_1px_rgba(226,232,240,1)]'
                : 'bg-pink-50 text-pink-600 shadow-[inset_0_0_0_1px_rgba(251,207,232,1)]'
            }`}
          >
            {serviceIsActive ? t('services.archiveButton') : t('services.activateButton')}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className={`${blushSubtlePanelClass} p-4`}>
          <LabeledField label={t('services.fields.summary')}>
            <textarea
              value={serviceDraft.summary}
              onChange={(event) => updateDraft({ summary: event.target.value })}
              className={dashboardTextareaClass}
            />
          </LabeledField>
        </div>

        <div className={`${softWhitePanelClass} p-4`}>
          <div className="grid gap-3">
            <LabeledField label={t('services.fields.price')}>
              <input
                type="text"
                value={serviceDraft.price}
                onChange={(event) => updateDraft({ price: event.target.value })}
                className={dashboardInputClass}
              />
            </LabeledField>
            <LabeledField label={t('services.fields.duration')}>
              <input
                type="text"
                value={serviceDraft.duration}
                onChange={(event) => updateDraft({ duration: event.target.value })}
                className={dashboardInputClass}
              />
            </LabeledField>
          </div>
        </div>

        <div className={`${softWhitePanelClass} p-4`}>
          <div>
            <p className="mb-2 text-[12px] font-semibold text-slate-500">{t('services.fields.bookingFlow')}</p>
            <div className="grid grid-cols-2 gap-2 rounded-full bg-white p-1">
              <SegmentButton
                isActive={serviceDraft.bookingFlow === 'instant'}
                label={professionalT('bookingFlowInstant')}
                onClick={() => updateDraft({ bookingFlow: 'instant' })}
              />
              <SegmentButton
                isActive={serviceDraft.bookingFlow === 'request'}
                label={professionalT('bookingFlowRequest')}
                onClick={() => updateDraft({ bookingFlow: 'request' })}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[12px] font-semibold text-slate-500">{t('services.fields.serviceModes')}</p>
            <div className="flex flex-wrap gap-2">
              {deliveryModes.map((mode) => (
                <SelectableChip
                  key={mode}
                  isActive={isServiceModeEnabled(serviceDraft.serviceModes, mode)}
                  label={getModeLabel(mode)}
                  onClick={() => onToggleMode(mode)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[12px] font-semibold text-slate-500">{t('services.fields.defaultMode')}</p>
            <div className="flex flex-wrap gap-2">
              {enabledModes.map((mode) => (
                <SelectableChip
                  key={mode}
                  isActive={serviceDraft.defaultMode === mode}
                  label={getModeLabel(mode)}
                  onClick={() => updateDraft({ defaultMode: mode })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`${softWhitePanelClass} p-4`}>
          <label className="flex items-start justify-between gap-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-[14px] font-bold text-slate-900">{t('services.fields.featured')}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('services.featuredHint')}</p>
            </div>
            <input
              type="checkbox"
              checked={serviceDraft.featured}
              onChange={(event) => updateDraft({ featured: event.target.checked })}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <div className="mt-4 rounded-[20px] border border-pink-100 bg-[linear-gradient(180deg,#FFF8FC_0%,#FFFFFF_100%)] px-4 py-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t('services.availabilityNoteEyebrow')}
            </p>
            <p className="mt-2 text-[14px] font-bold text-slate-900">{t('services.availabilityNoteTitle')}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
              {t('services.availabilityNoteDescription')}
            </p>
          </div>
        </div>
      </div>
    </DashboardDialog>
  );
};
