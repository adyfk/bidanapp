'use client';

import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { accentPrimaryButtonClass, blushSubtlePanelClass, softWhitePanelClass } from '@/components/ui/tokens';
import { MOCK_AREAS } from '@/lib/mock-db/catalog';
import { dashboardInputClass, dashboardTextareaClass, dashboardTextareaTallClass } from './editorStyles';
import { DashboardDialog, LabeledField, SelectableChip, SwitchRow } from './ProfessionalDashboardShared';
import type { CoverageDraft } from './types';

interface ProfessionalDashboardCoverageEditorDialogProps {
  coverageDraft: CoverageDraft;
  onChangeDraft: (draft: CoverageDraft) => void;
  onClose: () => void;
  onSave: () => void;
}

export const ProfessionalDashboardCoverageEditorDialog = ({
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
            <input
              type="number"
              value={coverageDraft.homeVisitRadiusKm}
              onChange={(event) => updateDraft({ homeVisitRadiusKm: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.latitude')}>
            <input
              type="number"
              value={coverageDraft.latitude}
              onChange={(event) => updateDraft({ latitude: event.target.value })}
              className={dashboardInputClass}
            />
          </LabeledField>
          <LabeledField label={t('coverage.fields.longitude')}>
            <input
              type="number"
              value={coverageDraft.longitude}
              onChange={(event) => updateDraft({ longitude: event.target.value })}
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
            <div className="flex flex-wrap gap-2">
              {MOCK_AREAS.map((area) => (
                <SelectableChip
                  key={area.id}
                  isActive={coverageDraft.coverageAreaIds.includes(area.id)}
                  label={area.label}
                  onClick={() =>
                    updateDraft({
                      coverageAreaIds: coverageDraft.coverageAreaIds.includes(area.id)
                        ? coverageDraft.coverageAreaIds.filter((currentAreaId) => currentAreaId !== area.id)
                        : [...coverageDraft.coverageAreaIds, area.id],
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className={`${blushSubtlePanelClass} px-4 py-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500">
              {t('coverage.serviceSettingsEyebrow')}
            </p>
            <p className="mt-2 text-[14px] font-bold text-slate-900">{t('coverage.serviceSettingsTitle')}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{t('coverage.serviceSettingsHint')}</p>
          </div>
        </div>
      </div>
    </DashboardDialog>
  );
};
