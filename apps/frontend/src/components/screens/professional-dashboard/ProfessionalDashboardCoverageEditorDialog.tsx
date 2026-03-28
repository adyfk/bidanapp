'use client';

import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StandardMultiSelect, StandardNumberInput } from '@/components/ui/form-controls';
import { accentPrimaryButtonClass, blushSubtlePanelClass, softWhitePanelClass } from '@/components/ui/tokens';
import type { Area } from '@/types/catalog';
import { dashboardInputClass, dashboardTextareaClass, dashboardTextareaTallClass } from './editorStyles';
import { DashboardDialog, LabeledField, SwitchRow } from './ProfessionalDashboardShared';
import type { CoverageDraft } from './types';

interface ProfessionalDashboardCoverageEditorDialogProps {
  areas: Area[];
  coverageDraft: CoverageDraft;
  onChangeDraft: (draft: CoverageDraft) => void;
  onClose: () => void;
  onSave: () => void;
}

export const ProfessionalDashboardCoverageEditorDialog = ({
  areas,
  coverageDraft,
  onChangeDraft,
  onClose,
  onSave,
}: ProfessionalDashboardCoverageEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const updateDraft = (changes: Partial<CoverageDraft>) => onChangeDraft({ ...coverageDraft, ...changes });

  return (
    <DashboardDialog
      closeLabel={t('coverage.closeButton')}
      description={coverageDraft.practiceAddress}
      eyebrow={t('coverage.title')}
      onClose={onClose}
      title={coverageDraft.practiceLabel || t('coverage.title')}
      footer={
        <button
          type="button"
          onClick={onSave}
          className={`${accentPrimaryButtonClass} flex w-full items-center justify-center gap-2`}
        >
          <Save className="h-4 w-4" />
          {t('coverage.saveButton')}
        </button>
      }
    >
      <div className="grid gap-4">
        <div className={`${blushSubtlePanelClass} grid gap-3 p-4`}>
          <SwitchRow
            checked={coverageDraft.acceptingNewClients}
            description={t('coverage.switches.acceptingDescription')}
            label={t('coverage.switches.accepting')}
            onChange={(checked) => updateDraft({ acceptingNewClients: checked })}
          />
          <SwitchRow
            checked={coverageDraft.autoApproveInstantBookings}
            description={t('coverage.switches.instantDescription')}
            label={t('coverage.switches.instant')}
            onChange={(checked) => updateDraft({ autoApproveInstantBookings: checked })}
          />
        </div>

        <div className={`${softWhitePanelClass} grid gap-4 p-4`}>
          <LabeledField label={t('coverage.fields.city')}>
            <input
              type="text"
              value={coverageDraft.city}
              onChange={(event) => updateDraft({ city: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.responseTime')}>
            <input
              type="text"
              value={coverageDraft.responseTimeGoal}
              onChange={(event) => updateDraft({ responseTimeGoal: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.practiceLabel')}>
            <input
              type="text"
              value={coverageDraft.practiceLabel}
              onChange={(event) => updateDraft({ practiceLabel: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.radius')}>
            <StandardNumberInput
              value={coverageDraft.homeVisitRadiusKm}
              onValueChange={(nextValue) => updateDraft({ homeVisitRadiusKm: nextValue })}
              accent="blue"
              surface="muted"
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.latitude')}>
            <StandardNumberInput
              allowDecimal
              allowNegative
              maxDecimals={6}
              value={coverageDraft.latitude}
              onValueChange={(nextValue) => updateDraft({ latitude: nextValue })}
              accent="blue"
              surface="muted"
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.longitude')}>
            <StandardNumberInput
              allowDecimal
              allowNegative
              maxDecimals={6}
              value={coverageDraft.longitude}
              onValueChange={(nextValue) => updateDraft({ longitude: nextValue })}
              accent="blue"
              surface="muted"
              className={dashboardInputClass}
            />
          </LabeledField>
        </div>

        <div className={`${softWhitePanelClass} grid gap-4 p-4`}>
          <LabeledField label={t('coverage.fields.practiceAddress')}>
            <textarea
              value={coverageDraft.practiceAddress}
              onChange={(event) => updateDraft({ practiceAddress: event.target.value })}
              className={dashboardTextareaClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.publicBio')}>
            <textarea
              value={coverageDraft.publicBio}
              onChange={(event) => updateDraft({ publicBio: event.target.value })}
              className={dashboardTextareaTallClass}
            />
          </LabeledField>
        </div>

        <div className={`${softWhitePanelClass} grid gap-4 p-4`}>
          <div>
            <p className="mb-2 text-[12px] font-semibold text-slate-500">{t('coverage.fields.areaSelection')}</p>
            <StandardMultiSelect
              accent="blue"
              emptyStateLabel={t('coverage.emptyAreaSelection')}
              options={areas.map((area) => ({
                description: `${area.district}, ${area.city}`,
                label: area.label,
                value: area.id,
              }))}
              placeholder={t('coverage.fields.areaSelection')}
              searchPlaceholder={t('coverage.fields.areaSelection')}
              surface="muted"
              values={coverageDraft.coverageAreaIds}
              onValuesChange={(nextValues) => updateDraft({ coverageAreaIds: nextValues })}
            />
          </div>
        </div>
      </div>
    </DashboardDialog>
  );
};
