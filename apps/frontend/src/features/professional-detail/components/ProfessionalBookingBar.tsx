'use client';

import { CalendarDays, Clock3 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Messages, _Translator as Translator } from 'use-intl/core';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import {
  accentPrimaryButtonClass,
  accentSoftPillClass,
  blushSubtlePanelClass,
  neutralSoftPillClass,
} from '@/components/ui/tokens';
import type { ProfessionalServiceEntry } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { getCategoryById } from '@/lib/mock-db/catalog';
import type {
  ProfessionalAvailabilityDay,
  ProfessionalAvailabilityTimeSlot,
  ServiceDeliveryMode,
} from '@/types/catalog';

interface ProfessionalBookingBarProps {
  canRequestBooking: boolean;
  ctaLabel: string;
  notice: string | null;
  onDismissNotice: () => void;
  onRequestBooking: () => void;
  requiresOfflineScheduleSelection: boolean;
  selectedBookingMode: ServiceDeliveryMode | null;
  selectedScheduleDay: ProfessionalAvailabilityDay | null;
  selectedServiceEntry: ProfessionalServiceEntry | null;
  selectedTimeSlot: ProfessionalAvailabilityTimeSlot | null;
}

type ProfessionalTranslations = Translator<Messages, 'Professional'>;

const getModeLabel = (t: ProfessionalTranslations, mode: ServiceDeliveryMode) => {
  if (mode === 'online') {
    return t('modeOnline');
  }

  if (mode === 'home_visit') {
    return t('modeHomeVisit');
  }

  return t('modeOnsite');
};

export const ProfessionalBookingBar = ({
  canRequestBooking,
  ctaLabel,
  notice,
  onDismissNotice,
  onRequestBooking,
  requiresOfflineScheduleSelection,
  selectedBookingMode,
  selectedScheduleDay,
  selectedServiceEntry,
  selectedTimeSlot,
}: ProfessionalBookingBarProps) => {
  const t = useTranslations('Professional');
  const locale = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });

  return (
    <div className="absolute bottom-0 left-0 z-30 w-full rounded-t-[34px] bg-white/90 p-6 pt-5 shadow-[0_-18px_40px_rgba(17,24,39,0.08)] backdrop-blur-xl">
      <div className="mb-5 space-y-4">
        {notice ? <InlineFeedbackNotice message={notice} onDismiss={onDismissNotice} /> : null}

        {selectedServiceEntry ? (
          <div className={`${blushSubtlePanelClass} p-4`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={accentSoftPillClass}>
                    {getCategoryById(selectedServiceEntry.catalogService.categoryId)?.name ||
                      selectedServiceEntry.catalogService.name}
                  </span>
                  {selectedBookingMode ? (
                    <span className={neutralSoftPillClass}>{getModeLabel(t, selectedBookingMode)}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-[14px] font-bold text-gray-900">{selectedServiceEntry.catalogService.name}</p>
                {selectedBookingMode ? (
                  <p className="mt-1 text-[12px] font-medium text-gray-500">{t('selectionResumeReadyDescription')}</p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-gray-900">{selectedServiceEntry.serviceMapping.price}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-500">
                  {selectedServiceEntry.serviceMapping.duration}
                </p>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-600">
              {selectedServiceEntry.serviceMapping.summary || selectedServiceEntry.catalogService.shortDescription}
            </p>

            {requiresOfflineScheduleSelection ? (
              <div className="mt-3 rounded-[18px] bg-white/75 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]">
                {selectedScheduleDay && selectedTimeSlot ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {t('selectedSchedule')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {dateFormatter.format(new Date(`${selectedScheduleDay.dateIso}T00:00:00`))}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-gray-400" />
                        {selectedTimeSlot.label}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] font-medium text-amber-700">{t('offlineScheduleRequired')}</p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-[13px] font-bold text-gray-900">{t('selectionEmptyTitle')}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{t('selectionEmptyDescription')}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`${accentPrimaryButtonClass} w-full py-4 text-[15px]`}
        style={{
          background: canRequestBooking ? undefined : '#D1D5DB',
          boxShadow: canRequestBooking ? '0 12px 28px rgba(233, 30, 140, 0.28)' : 'none',
        }}
        onClick={onRequestBooking}
        disabled={!selectedServiceEntry || !canRequestBooking}
      >
        {ctaLabel}
      </button>
    </div>
  );
};
