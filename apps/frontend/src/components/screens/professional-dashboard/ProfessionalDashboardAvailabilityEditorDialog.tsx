'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  accentPrimaryButtonClass,
  blushSubtlePanelClass,
  darkPrimaryButtonClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import type {
  ProfessionalAvailabilityDay,
  ProfessionalAvailabilityTimeSlot,
  ServiceDeliveryMode,
  TimeSlotStatus,
} from '@/types/catalog';
import { dashboardInputClass } from './editorStyles';
import {
  cloneAvailabilityByMode,
  countScheduleSlots,
  normalizeAvailabilityDays,
  offlineDeliveryModes,
} from './helpers';
import { DashboardDialog, LabeledField, SegmentButton } from './ProfessionalDashboardShared';
import type { AvailabilityDraft } from './types';

interface ProfessionalDashboardAvailabilityEditorDialogProps {
  availabilityDraft: AvailabilityDraft;
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  onChangeDraft: (draft: AvailabilityDraft) => void;
  onClose: () => void;
  onSave: () => void;
}

const slotStatuses: TimeSlotStatus[] = ['available', 'limited', 'booked'];
const defaultSlotLabels = ['08:00', '10:30', '13:30', '16:30', '18:00'];

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getNextDateIso = (scheduleDays: ProfessionalAvailabilityDay[]) => {
  if (scheduleDays.length === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateInput(tomorrow);
  }

  const latestDate = [...scheduleDays]
    .map((scheduleDay) => new Date(`${scheduleDay.dateIso}T00:00:00`))
    .sort((leftDate, rightDate) => rightDate.getTime() - leftDate.getTime())[0];
  const nextDate = new Date(latestDate);
  nextDate.setDate(nextDate.getDate() + 1);
  return formatDateInput(nextDate);
};

const getNextSlotLabel = (timeSlots: ProfessionalAvailabilityTimeSlot[]) =>
  defaultSlotLabels.find((slotLabel) => !timeSlots.some((timeSlot) => timeSlot.label === slotLabel)) || '09:00';

const buildScheduleDayLabel = (locale: string, dateIso: string) =>
  new Intl.DateTimeFormat(locale.startsWith('id') ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(`${dateIso}T00:00:00`));

const buildScheduleDayId = (mode: ServiceDeliveryMode) => `availability-day-${mode}-${Date.now()}`;
const buildTimeSlotId = (scheduleDayId: string) => `${scheduleDayId}-slot-${Date.now()}`;

export const ProfessionalDashboardAvailabilityEditorDialog = ({
  availabilityDraft,
  getModeLabel,
  onChangeDraft,
  onClose,
  onSave,
}: ProfessionalDashboardAvailabilityEditorDialogProps) => {
  const locale = useLocale();
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const [selectedMode, setSelectedMode] = useState<ServiceDeliveryMode>('home_visit');
  const updateDraft = (changes: Partial<AvailabilityDraft>) => onChangeDraft({ ...availabilityDraft, ...changes });

  useEffect(() => {
    if (!offlineDeliveryModes.includes(selectedMode)) {
      setSelectedMode('home_visit');
    }
  }, [selectedMode]);

  const replaceScheduleDays = (mode: ServiceDeliveryMode, scheduleDays: ProfessionalAvailabilityDay[]) => {
    const nextAvailabilityByMode = cloneAvailabilityByMode(availabilityDraft.availabilityByMode);
    const normalizedScheduleDays = normalizeAvailabilityDays(scheduleDays);

    if (normalizedScheduleDays.length > 0) {
      nextAvailabilityByMode[mode] = normalizedScheduleDays;
    } else {
      delete nextAvailabilityByMode[mode];
    }

    updateDraft({
      availabilityByMode: Object.keys(nextAvailabilityByMode).length > 0 ? nextAvailabilityByMode : undefined,
    });
  };

  const updateScheduleDay = (
    mode: ServiceDeliveryMode,
    scheduleDayId: string,
    changes: Partial<ProfessionalAvailabilityDay>,
  ) => {
    const scheduleDays = cloneAvailabilityByMode(availabilityDraft.availabilityByMode)[mode] || [];
    replaceScheduleDays(
      mode,
      scheduleDays.map((scheduleDay) =>
        scheduleDay.id === scheduleDayId
          ? {
              ...scheduleDay,
              ...changes,
              label: changes.dateIso ? buildScheduleDayLabel(locale, changes.dateIso) : scheduleDay.label,
            }
          : scheduleDay,
      ),
    );
  };

  const removeScheduleDay = (mode: ServiceDeliveryMode, scheduleDayId: string) => {
    const scheduleDays = cloneAvailabilityByMode(availabilityDraft.availabilityByMode)[mode] || [];
    replaceScheduleDays(
      mode,
      scheduleDays.filter((scheduleDay) => scheduleDay.id !== scheduleDayId),
    );
  };

  const addScheduleDay = (mode: ServiceDeliveryMode) => {
    const scheduleDays = cloneAvailabilityByMode(availabilityDraft.availabilityByMode)[mode] || [];
    const dateIso = getNextDateIso(scheduleDays);
    replaceScheduleDays(mode, [
      ...scheduleDays,
      {
        dateIso,
        id: buildScheduleDayId(mode),
        index: scheduleDays.length + 1,
        label: buildScheduleDayLabel(locale, dateIso),
        slots: [],
      },
    ]);
  };

  const updateTimeSlot = (
    mode: ServiceDeliveryMode,
    scheduleDayId: string,
    timeSlotId: string,
    changes: Partial<ProfessionalAvailabilityTimeSlot>,
  ) => {
    const scheduleDays = cloneAvailabilityByMode(availabilityDraft.availabilityByMode)[mode] || [];
    replaceScheduleDays(
      mode,
      scheduleDays.map((scheduleDay) =>
        scheduleDay.id === scheduleDayId
          ? {
              ...scheduleDay,
              slots: scheduleDay.slots.map((timeSlot) =>
                timeSlot.id === timeSlotId
                  ? {
                      ...timeSlot,
                      ...changes,
                    }
                  : timeSlot,
              ),
            }
          : scheduleDay,
      ),
    );
  };

  const removeTimeSlot = (mode: ServiceDeliveryMode, scheduleDayId: string, timeSlotId: string) => {
    const scheduleDays = cloneAvailabilityByMode(availabilityDraft.availabilityByMode)[mode] || [];
    replaceScheduleDays(
      mode,
      scheduleDays.map((scheduleDay) =>
        scheduleDay.id === scheduleDayId
          ? {
              ...scheduleDay,
              slots: scheduleDay.slots.filter((timeSlot) => timeSlot.id !== timeSlotId),
            }
          : scheduleDay,
      ),
    );
  };

  const addTimeSlot = (mode: ServiceDeliveryMode, scheduleDayId: string) => {
    const scheduleDays = cloneAvailabilityByMode(availabilityDraft.availabilityByMode)[mode] || [];
    replaceScheduleDays(
      mode,
      scheduleDays.map((scheduleDay) =>
        scheduleDay.id === scheduleDayId
          ? {
              ...scheduleDay,
              slots: [
                ...scheduleDay.slots,
                {
                  id: buildTimeSlotId(scheduleDayId),
                  index: scheduleDay.slots.length + 1,
                  label: getNextSlotLabel(scheduleDay.slots),
                  status: 'available',
                },
              ],
            }
          : scheduleDay,
      ),
    );
  };

  const selectedScheduleDays = availabilityDraft.availabilityByMode?.[selectedMode] || [];
  const selectedScheduleSlotCount = countScheduleSlots(selectedScheduleDays);

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
            {offlineDeliveryModes.map((mode) => (
              <SegmentButton
                key={mode}
                isActive={selectedMode === mode}
                label={getModeLabel(mode)}
                onClick={() => setSelectedMode(mode)}
              />
            ))}
          </div>
        </div>

        <div className={`${softWhitePanelClass} px-4 py-3`}>
          <p className="text-[12px] font-semibold text-slate-500">{t('availability.summaryLabel')}</p>
          <p className="mt-1 text-[13px] font-semibold text-slate-900">
            {selectedScheduleDays.length > 0
              ? t('availability.modeSummaryValue', {
                  days: selectedScheduleDays.length,
                  slots: selectedScheduleSlotCount,
                })
              : t('availability.modeSummaryEmpty')}
          </p>
        </div>

        {selectedScheduleDays.length > 0 ? (
          <div className="grid gap-3">
            {selectedScheduleDays.map((scheduleDay) => (
              <div key={scheduleDay.id} className={`${softWhitePanelClass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{scheduleDay.label}</p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {t('availability.dayValue', {
                        count: scheduleDay.slots.length,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeScheduleDay(selectedMode, scheduleDay.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                    aria-label={t('availability.removeDay')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <LabeledField label={t('availability.dateLabel')}>
                    <input
                      type="date"
                      value={scheduleDay.dateIso}
                      onChange={(event) =>
                        updateScheduleDay(selectedMode, scheduleDay.id, {
                          dateIso: event.target.value,
                        })
                      }
                      className={dashboardInputClass}
                    />
                  </LabeledField>
                </div>

                {scheduleDay.slots.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {scheduleDay.slots.map((timeSlot) => (
                      <div key={timeSlot.id} className={`${softWhitePanelClass} px-3 py-3`}>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <LabeledField label={t('availability.slotTimeLabel')}>
                            <input
                              type="time"
                              value={timeSlot.label}
                              onChange={(event) =>
                                updateTimeSlot(selectedMode, scheduleDay.id, timeSlot.id, {
                                  label: event.target.value,
                                })
                              }
                              className={dashboardInputClass}
                            />
                          </LabeledField>
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(selectedMode, scheduleDay.id, timeSlot.id)}
                            className="mt-[26px] flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,1)]"
                            aria-label={t('availability.removeSlot')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3">
                          <LabeledField label={t('availability.slotStatusLabel')}>
                            <select
                              value={timeSlot.status}
                              onChange={(event) =>
                                updateTimeSlot(selectedMode, scheduleDay.id, timeSlot.id, {
                                  status: event.target.value as TimeSlotStatus,
                                })
                              }
                              className={dashboardInputClass}
                            >
                              {slotStatuses.map((slotStatus) => (
                                <option key={slotStatus} value={slotStatus}>
                                  {slotStatus === 'available'
                                    ? professionalT('slotAvailable')
                                    : slotStatus === 'limited'
                                      ? professionalT('slotLimited')
                                      : professionalT('slotBooked')}
                                </option>
                              ))}
                            </select>
                          </LabeledField>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[12px] leading-relaxed text-slate-500">{t('availability.emptySlotState')}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => addTimeSlot(selectedMode, scheduleDay.id)}
                  className={`${darkPrimaryButtonClass} mt-3 flex w-full items-center justify-center gap-2`}
                >
                  <Plus className="h-4 w-4" />
                  {t('availability.addSlot')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-5">
            <p className="text-[14px] font-bold text-slate-900">{t('availability.emptyTitle')}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{t('availability.emptyDescription')}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => addScheduleDay(selectedMode)}
          className={`${accentPrimaryButtonClass} flex w-full items-center justify-center gap-2`}
        >
          <Plus className="h-4 w-4" />
          {t('availability.addDay')}
        </button>
      </div>
    </DashboardDialog>
  );
};
