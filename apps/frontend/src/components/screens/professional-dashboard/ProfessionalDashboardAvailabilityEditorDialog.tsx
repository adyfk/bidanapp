'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { StandardDateInput, StandardTimeInput } from '@/components/ui/form-controls';
import {
  accentPrimaryButtonClass,
  blushSubtlePanelClass,
  darkPrimaryButtonClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import {
  AVAILABILITY_MINIMUM_NOTICE_OPTIONS,
  addDaysToDateIso,
  buildDefaultAvailabilityRules,
  cloneAvailabilityRulesByMode,
  countDateOverrides,
  countEnabledWeeklyHours,
  DEFAULT_BOOKING_WINDOW_START_ISO,
  formatMinimumNoticeLabel,
  OFFLINE_SERVICE_MODES,
} from '@/lib/availability-rules';
import type {
  OfflineServiceDeliveryMode,
  ProfessionalAvailabilityDateOverride,
  ProfessionalWeeklyAvailabilityWindow,
} from '@/types/catalog';
import { dashboardInputClass } from './editorStyles';
import { DashboardDialog, LabeledField, SegmentButton, SwitchRow } from './ProfessionalDashboardShared';
import type { AvailabilityDraft } from './types';

interface ProfessionalDashboardAvailabilityEditorDialogProps {
  availabilityDraft: AvailabilityDraft;
  getModeLabel: (mode: OfflineServiceDeliveryMode) => string;
  onChangeDraft: (draft: AvailabilityDraft) => void;
  onClose: () => void;
  onSave: () => void;
}

const buildNextOverride = (
  mode: OfflineServiceDeliveryMode,
  overrides: ProfessionalAvailabilityDateOverride[],
): ProfessionalAvailabilityDateOverride => {
  const lastDateIso = overrides[overrides.length - 1]?.dateIso || DEFAULT_BOOKING_WINDOW_START_ISO;

  return {
    dateIso: addDaysToDateIso(lastDateIso, 1),
    id: `availability-override-${mode}-${Date.now()}`,
    index: overrides.length + 1,
    isClosed: true,
  };
};

const NoticeOptionButton = ({
  activeHint,
  inactiveHint,
  isActive,
  label,
  onClick,
}: {
  activeHint: string;
  inactiveHint: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[18px] border px-4 py-3 text-left transition-all ${
      isActive
        ? 'border-pink-100 bg-pink-50 text-slate-900 shadow-[0_16px_28px_-24px_rgba(233,30,140,0.35)]'
        : 'border-slate-200 bg-white text-slate-600'
    }`}
  >
    <p className="text-[14px] font-bold">{label}</p>
    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{isActive ? activeHint : inactiveHint}</p>
  </button>
);

export const ProfessionalDashboardAvailabilityEditorDialog = ({
  availabilityDraft,
  getModeLabel,
  onChangeDraft,
  onClose,
  onSave,
}: ProfessionalDashboardAvailabilityEditorDialogProps) => {
  const t = useTranslations('ProfessionalPortal');
  const [selectedMode, setSelectedMode] = useState<OfflineServiceDeliveryMode>('home_visit');
  const updateDraft = (changes: Partial<AvailabilityDraft>) => onChangeDraft({ ...availabilityDraft, ...changes });

  useEffect(() => {
    if (!OFFLINE_SERVICE_MODES.includes(selectedMode)) {
      setSelectedMode('home_visit');
    }
  }, [selectedMode]);

  const replaceRuleSet = (
    mode: OfflineServiceDeliveryMode,
    nextValue:
      | ReturnType<typeof buildDefaultAvailabilityRules>
      | ((
          currentValue: ReturnType<typeof buildDefaultAvailabilityRules>,
        ) => ReturnType<typeof buildDefaultAvailabilityRules>),
  ) => {
    const nextAvailabilityRulesByMode = cloneAvailabilityRulesByMode(availabilityDraft.availabilityRulesByMode) || {};
    const currentRuleSet = nextAvailabilityRulesByMode[mode] || buildDefaultAvailabilityRules(mode);

    nextAvailabilityRulesByMode[mode] = typeof nextValue === 'function' ? nextValue(currentRuleSet) : nextValue;

    updateDraft({
      availabilityRulesByMode: nextAvailabilityRulesByMode,
    });
  };

  const updateWeeklyWindow = (
    mode: OfflineServiceDeliveryMode,
    weekdayId: string,
    changes: Partial<ProfessionalWeeklyAvailabilityWindow>,
  ) => {
    replaceRuleSet(mode, (currentRuleSet) => ({
      ...currentRuleSet,
      weeklyHours: currentRuleSet.weeklyHours.map((window) =>
        window.id === weekdayId
          ? {
              ...window,
              ...changes,
            }
          : window,
      ),
    }));
  };

  const addDateOverride = (mode: OfflineServiceDeliveryMode) => {
    replaceRuleSet(mode, (currentRuleSet) => ({
      ...currentRuleSet,
      dateOverrides: [...currentRuleSet.dateOverrides, buildNextOverride(mode, currentRuleSet.dateOverrides)],
    }));
  };

  const updateDateOverride = (
    mode: OfflineServiceDeliveryMode,
    overrideId: string,
    changes: Partial<ProfessionalAvailabilityDateOverride>,
  ) => {
    replaceRuleSet(mode, (currentRuleSet) => ({
      ...currentRuleSet,
      dateOverrides: currentRuleSet.dateOverrides.map((override) =>
        override.id === overrideId
          ? {
              ...override,
              ...changes,
            }
          : override,
      ),
    }));
  };

  const removeDateOverride = (mode: OfflineServiceDeliveryMode, overrideId: string) => {
    replaceRuleSet(mode, (currentRuleSet) => ({
      ...currentRuleSet,
      dateOverrides: currentRuleSet.dateOverrides.filter((override) => override.id !== overrideId),
    }));
  };

  const selectedRuleSet =
    availabilityDraft.availabilityRulesByMode?.[selectedMode] || buildDefaultAvailabilityRules(selectedMode);
  const enabledWeeklyDayCount = countEnabledWeeklyHours(selectedRuleSet);
  const overrideCount = countDateOverrides(selectedRuleSet);

  return (
    <DashboardDialog
      closeLabel={t('availability.closeButton')}
      description={t('availability.editorDescription')}
      eyebrow={t('availability.editorTitle')}
      onClose={onClose}
      title={t('availability.editorHeroTitle')}
      footer={
        <button
          type="button"
          onClick={onSave}
          className={`${accentPrimaryButtonClass} flex w-full items-center justify-center gap-2`}
        >
          <Save className="h-4 w-4" />
          {t('availability.saveButton')}
        </button>
      }
    >
      <div className="grid gap-4">
        <div className={`${blushSubtlePanelClass} p-4`}>
          <p className="text-[14px] font-bold text-slate-900">{t('availability.modeSectionTitle')}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('availability.modeSectionDescription')}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-white p-1">
            {OFFLINE_SERVICE_MODES.map((mode) => (
              <SegmentButton
                key={mode}
                isActive={selectedMode === mode}
                label={getModeLabel(mode)}
                onClick={() => setSelectedMode(mode)}
              />
            ))}
          </div>
        </div>

        <div className={`${softWhitePanelClass} grid grid-cols-2 gap-3 p-4`}>
          <div className={softWhitePanelClass}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t('availability.summaryWeekdays')}
            </p>
            <p className="mt-2 text-[18px] font-bold text-slate-900">{enabledWeeklyDayCount}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('availability.summaryWeekdaysHint')}</p>
          </div>
          <div className={softWhitePanelClass}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t('availability.summaryOverrides')}
            </p>
            <p className="mt-2 text-[18px] font-bold text-slate-900">{overrideCount}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('availability.summaryOverridesHint')}</p>
          </div>
          <div className={`${softWhitePanelClass} col-span-2`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t('availability.minimumNoticeTitle')}
            </p>
            <p className="mt-2 text-[18px] font-bold text-slate-900">
              {formatMinimumNoticeLabel(selectedRuleSet.minimumNoticeHours)}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('availability.minimumNoticeHint')}</p>
          </div>
        </div>

        <div className={`${softWhitePanelClass} p-4`}>
          <p className="text-[14px] font-bold text-slate-900">{t('availability.minimumNoticeTitle')}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
            {t('availability.minimumNoticeDescription')}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {AVAILABILITY_MINIMUM_NOTICE_OPTIONS.map((minimumNoticeHours) => (
              <NoticeOptionButton
                key={minimumNoticeHours}
                activeHint={t('availability.minimumNoticeActiveHint')}
                inactiveHint={t('availability.minimumNoticeInactiveHint')}
                isActive={selectedRuleSet.minimumNoticeHours === minimumNoticeHours}
                label={t('availability.noticeValue', { value: minimumNoticeHours })}
                onClick={() => replaceRuleSet(selectedMode, { ...selectedRuleSet, minimumNoticeHours })}
              />
            ))}
          </div>
        </div>

        <div className={`${softWhitePanelClass} p-4`}>
          <p className="text-[14px] font-bold text-slate-900">{t('availability.weeklyHoursTitle')}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{t('availability.weeklyHoursDescription')}</p>

          <div className="mt-4 space-y-3">
            {selectedRuleSet.weeklyHours.map((window) => (
              <div key={window.id} className={`${softWhitePanelClass} px-4 py-4`}>
                <SwitchRow
                  checked={window.isEnabled}
                  description={t('availability.weeklyHoursToggleDescription')}
                  label={t(`availability.weekdays.${window.weekday}`)}
                  onChange={(checked) => updateWeeklyWindow(selectedMode, window.id, { isEnabled: checked })}
                />

                {window.isEnabled ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <LabeledField label={t('availability.startTimeLabel')}>
                      <StandardTimeInput
                        value={window.startTime}
                        onValueChange={(nextValue) =>
                          updateWeeklyWindow(selectedMode, window.id, { startTime: nextValue })
                        }
                        accent="blue"
                        surface="muted"
                        className={dashboardInputClass}
                      />
                    </LabeledField>

                    <LabeledField label={t('availability.endTimeLabel')}>
                      <StandardTimeInput
                        value={window.endTime}
                        onValueChange={(nextValue) =>
                          updateWeeklyWindow(selectedMode, window.id, { endTime: nextValue })
                        }
                        accent="blue"
                        surface="muted"
                        className={dashboardInputClass}
                      />
                    </LabeledField>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className={`${softWhitePanelClass} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold text-slate-900">{t('availability.specialDatesTitle')}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                {t('availability.specialDatesDescription')}
              </p>
            </div>

            <button type="button" onClick={() => addDateOverride(selectedMode)} className={darkPrimaryButtonClass}>
              <Plus className="h-4 w-4" />
              {t('availability.addOverride')}
            </button>
          </div>

          {selectedRuleSet.dateOverrides.length > 0 ? (
            <div className="mt-4 space-y-3">
              {selectedRuleSet.dateOverrides.map((override) => (
                <div key={override.id} className={`${softWhitePanelClass} px-4 py-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900">{t('availability.specialDateCardTitle')}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                        {t('availability.specialDateCardDescription')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDateOverride(selectedMode, override.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <LabeledField label={t('availability.specialDateLabel')}>
                      <StandardDateInput
                        value={override.dateIso}
                        onValueChange={(nextValue) =>
                          updateDateOverride(selectedMode, override.id, { dateIso: nextValue })
                        }
                        accent="blue"
                        surface="muted"
                        className={dashboardInputClass}
                      />
                    </LabeledField>

                    <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
                      <SegmentButton
                        isActive={override.isClosed}
                        label={t('availability.specialDateClosed')}
                        onClick={() => updateDateOverride(selectedMode, override.id, { isClosed: true })}
                      />
                      <SegmentButton
                        isActive={!override.isClosed}
                        label={t('availability.specialDateCustomHours')}
                        onClick={() =>
                          updateDateOverride(selectedMode, override.id, {
                            endTime: override.endTime || '17:00',
                            isClosed: false,
                            startTime: override.startTime || '09:00',
                          })
                        }
                      />
                    </div>

                    {!override.isClosed ? (
                      <div className="grid grid-cols-2 gap-3">
                        <LabeledField label={t('availability.startTimeLabel')}>
                          <StandardTimeInput
                            value={override.startTime || '09:00'}
                            onValueChange={(nextValue) =>
                              updateDateOverride(selectedMode, override.id, { startTime: nextValue })
                            }
                            accent="blue"
                            surface="muted"
                            className={dashboardInputClass}
                          />
                        </LabeledField>

                        <LabeledField label={t('availability.endTimeLabel')}>
                          <StandardTimeInput
                            value={override.endTime || '17:00'}
                            onValueChange={(nextValue) =>
                              updateDateOverride(selectedMode, override.id, { endTime: nextValue })
                            }
                            accent="blue"
                            surface="muted"
                            className={dashboardInputClass}
                          />
                        </LabeledField>
                      </div>
                    ) : null}

                    <LabeledField label={t('availability.specialDateNoteLabel')}>
                      <textarea
                        rows={3}
                        value={override.note || ''}
                        onChange={(event) =>
                          updateDateOverride(selectedMode, override.id, { note: event.target.value })
                        }
                        className={dashboardInputClass}
                      />
                    </LabeledField>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-[14px] font-bold text-slate-900">{t('availability.specialDatesEmptyTitle')}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                {t('availability.specialDatesEmptyDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardDialog>
  );
};
