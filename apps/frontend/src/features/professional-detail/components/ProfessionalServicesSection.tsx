'use client';

import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  House,
  Search,
  SlidersHorizontal,
  Stethoscope,
  Video,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDeferredValue, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  accentPrimaryButtonClass,
  accentSoftPillClass,
  blushInputShellClass,
  blushPanelClass,
  blushSubtlePanelClass,
  darkPrimaryButtonClass,
  neutralSoftPillClass,
  softMetricTileClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import { ProfessionalSectionTitle } from '@/features/professional-detail/components/ProfessionalSectionTitle';
import type { ProfessionalServiceEntry } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { APP_CONFIG } from '@/lib/config';
import {
  getAccessibleServiceModes,
  getCategoryById,
  getEnabledServiceModes,
  isOfflineServiceMode,
  type ProfessionalCoverageStatus,
} from '@/lib/mock-db/catalog';
import type { ProfessionalAvailabilityDay, ServiceDeliveryMode } from '@/types/catalog';

interface ProfessionalServicesSectionProps {
  availabilityByMode?: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>>;
  coverageStatus: ProfessionalCoverageStatus | null;
  isProfessionalAvailable: boolean;
  offeredServices: ProfessionalServiceEntry[];
  onSelectBookingMode: (mode: ServiceDeliveryMode | null) => void;
  onSelectScheduleDay: (scheduleDayId: string) => void;
  onSelectService: (serviceId: string) => void;
  onSelectTimeSlot: (timeSlotId: string) => void;
  profileCopy: {
    serviceSectionTitle: string;
  };
  selectedBookingMode: ServiceDeliveryMode | null;
  selectedScheduleDayId: string;
  selectedScheduleDays: ProfessionalAvailabilityDay[];
  selectedService: string;
  selectedServiceEntry: ProfessionalServiceEntry | null;
  selectedTimeSlotId: string;
}

type ProfessionalTranslations = ReturnType<typeof useTranslations>;

type DraftSelectionState = {
  accessibleModes: ServiceDeliveryMode[];
  bookingMode: ServiceDeliveryMode | null;
  isReady: boolean;
  requiresOfflineScheduleSelection: boolean;
  scheduleDayId: string;
  scheduleDays: ProfessionalAvailabilityDay[];
  serviceEntry: ProfessionalServiceEntry | null;
  serviceId: string;
  timeSlotId: string;
};

const SERVICE_MODE_OPTIONS: ServiceDeliveryMode[] = ['online', 'home_visit', 'onsite'];

const getModeIcon = (mode: ServiceDeliveryMode) => {
  if (mode === 'online') {
    return Video;
  }

  if (mode === 'home_visit') {
    return House;
  }

  return Stethoscope;
};

const getModeLabel = (t: ProfessionalTranslations, mode: ServiceDeliveryMode) => {
  if (mode === 'online') {
    return t('modeOnline');
  }

  if (mode === 'home_visit') {
    return t('modeHomeVisit');
  }

  return t('modeOnsite');
};

const getBookingFlowLabel = (
  t: ProfessionalTranslations,
  flow: ProfessionalServiceEntry['serviceMapping']['bookingFlow'],
) => (flow === 'instant' ? t('bookingFlowInstant') : t('bookingFlowRequest'));

const SelectionMetaTile = ({ label, value }: { label: string; value: string }) => (
  <div className={softMetricTileClass}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
    <p className="mt-2 text-[13px] font-semibold leading-relaxed text-gray-900">{value}</p>
  </div>
);

const SelectionJourneyStep = ({
  index,
  label,
  state,
  t,
}: {
  index: string;
  label: string;
  state: 'current' | 'done' | 'pending';
  t: ProfessionalTranslations;
}) => (
  <div
    className={`rounded-[20px] border px-3 py-3 ${
      state === 'done'
        ? 'border-pink-100 bg-white shadow-[0_18px_30px_-28px_rgba(233,30,140,0.35)]'
        : state === 'current'
          ? 'border-pink-100/80 bg-white/90 shadow-[0_18px_30px_-28px_rgba(17,24,39,0.2)]'
          : 'border-white/80 bg-white/75'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500">{index}</p>
      <span className={state === 'done' ? accentSoftPillClass : neutralSoftPillClass}>
        {state === 'done'
          ? t('selectionStatusDone')
          : state === 'current'
            ? t('selectionStatusCurrent')
            : t('selectionStatusPending')}
      </span>
    </div>
    <p className="mt-3 text-[12px] font-semibold leading-relaxed text-gray-700">{label}</p>
  </div>
);

const deriveDraftSelectionState = ({
  availabilityByMode,
  bookingMode,
  coverageStatus,
  isProfessionalAvailable,
  offeredServices,
  scheduleDayId,
  serviceId,
  timeSlotId,
}: {
  availabilityByMode?: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>>;
  bookingMode: ServiceDeliveryMode | null;
  coverageStatus: ProfessionalCoverageStatus | null;
  isProfessionalAvailable: boolean;
  offeredServices: ProfessionalServiceEntry[];
  scheduleDayId: string;
  serviceId: string;
  timeSlotId: string;
}): DraftSelectionState => {
  const serviceEntry = offeredServices.find(({ serviceMapping }) => serviceMapping.serviceId === serviceId) || null;
  const accessibleModes =
    serviceEntry && coverageStatus
      ? getAccessibleServiceModes(
          serviceEntry.serviceMapping.serviceModes,
          coverageStatus,
          isProfessionalAvailable,
        ).filter(
          (mode) =>
            !isOfflineServiceMode(mode) ||
            (availabilityByMode?.[mode] || []).some((scheduleDay) =>
              scheduleDay.slots.some((slot) => slot.status !== 'booked'),
            ),
        )
      : [];
  const resolvedBookingMode =
    (bookingMode && accessibleModes.includes(bookingMode) && bookingMode) ||
    (serviceEntry && accessibleModes.includes(serviceEntry.serviceMapping.defaultMode)
      ? serviceEntry.serviceMapping.defaultMode
      : accessibleModes[0] || null);
  const requiresOfflineScheduleSelection = Boolean(resolvedBookingMode && isOfflineServiceMode(resolvedBookingMode));
  const scheduleDays =
    serviceEntry && resolvedBookingMode && isOfflineServiceMode(resolvedBookingMode)
      ? availabilityByMode?.[resolvedBookingMode] || []
      : [];
  const resolvedScheduleDayId = requiresOfflineScheduleSelection
    ? (scheduleDayId && scheduleDays.some((scheduleDay) => scheduleDay.id === scheduleDayId)
        ? scheduleDayId
        : scheduleDays[0]?.id) || ''
    : '';
  const resolvedScheduleDay = scheduleDays.find((scheduleDay) => scheduleDay.id === resolvedScheduleDayId) || null;
  const resolvedTimeSlotId =
    requiresOfflineScheduleSelection && resolvedScheduleDay
      ? timeSlotId &&
        resolvedScheduleDay.slots.some((timeSlot) => timeSlot.id === timeSlotId && timeSlot.status !== 'booked')
        ? timeSlotId
        : ''
      : '';
  const resolvedTimeSlot =
    resolvedScheduleDay?.slots.find((timeSlot) => timeSlot.id === resolvedTimeSlotId && timeSlot.status !== 'booked') ||
    null;

  return {
    accessibleModes,
    bookingMode: resolvedBookingMode,
    isReady: Boolean(serviceEntry && resolvedBookingMode && (!requiresOfflineScheduleSelection || resolvedTimeSlot)),
    requiresOfflineScheduleSelection,
    scheduleDayId: resolvedScheduleDayId,
    scheduleDays,
    serviceEntry,
    serviceId: serviceEntry?.serviceMapping.serviceId || '',
    timeSlotId: resolvedTimeSlotId,
  };
};

interface ServiceSelectionSheetProps {
  draftSelection: DraftSelectionState;
  isOpen: boolean;
  locale: string;
  onClose: () => void;
  onConfirm: () => void;
  onSelectBookingMode: (mode: ServiceDeliveryMode) => void;
  onSelectScheduleDay: (scheduleDayId: string) => void;
  onSelectTimeSlot: (timeSlotId: string) => void;
}

const ServiceSelectionSheet = ({
  draftSelection,
  isOpen,
  locale,
  onClose,
  onConfirm,
  onSelectBookingMode,
  onSelectScheduleDay,
  onSelectTimeSlot,
}: ServiceSelectionSheetProps) => {
  const t = useTranslations('Professional');
  const {
    accessibleModes,
    bookingMode,
    isReady,
    requiresOfflineScheduleSelection,
    scheduleDayId,
    scheduleDays,
    serviceEntry,
    timeSlotId,
  } = draftSelection;

  if (!isOpen || !serviceEntry) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
  const selectedCategoryLabel =
    getCategoryById(serviceEntry.catalogService.categoryId)?.name || serviceEntry.catalogService.name;
  const selectedServiceModes = getEnabledServiceModes(serviceEntry.serviceMapping.serviceModes);
  const selectedScheduleDay =
    scheduleDays.find((currentScheduleDay) => currentScheduleDay.id === scheduleDayId) || null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-hidden">
      <button
        type="button"
        aria-label={t('closeServiceDialog')}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="animate-in slide-in-from-bottom-full relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] bg-[#FFFDFE] shadow-2xl duration-300">
        <div className="mx-auto mb-2 mt-4 h-1.5 w-12 rounded-full bg-gray-200" />

        <div className="flex items-start gap-3 border-b border-gray-100 px-5 pb-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <h2 className="text-[20px] font-bold text-gray-900">{t('serviceDialogTitle')}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{t('serviceDialogDescription')}</p>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 pb-28 pt-5">
          <div className="rounded-[26px] border border-pink-100 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF7FB_100%)] p-4 shadow-[0_18px_40px_-30px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                  >
                    {selectedCategoryLabel}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]">
                    {getBookingFlowLabel(t, serviceEntry.serviceMapping.bookingFlow)}
                  </span>
                </div>
                <h3 className="mt-3 text-[19px] font-bold leading-snug text-gray-900">
                  {serviceEntry.catalogService.name}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                  {serviceEntry.serviceMapping.summary || serviceEntry.catalogService.shortDescription}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[18px] font-bold text-gray-900">{serviceEntry.serviceMapping.price}</p>
                <p className="mt-1 text-[12px] font-medium text-gray-500">{serviceEntry.serviceMapping.duration}</p>
              </div>
            </div>
          </div>

          {serviceEntry.catalogService.highlights.length > 0 || serviceEntry.catalogService.tags.length > 0 ? (
            <div className="mt-4 rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                {t('serviceHighlightsTitle')}
              </p>

              {serviceEntry.catalogService.highlights.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {serviceEntry.catalogService.highlights.slice(0, 4).map((highlight) => (
                    <div key={highlight} className="flex items-start gap-2 text-[12px] text-gray-600">
                      <span
                        className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: APP_CONFIG.colors.primary }}
                      />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {serviceEntry.catalogService.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {serviceEntry.catalogService.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-500 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              {t('chooseServiceMode')}
            </p>
            <div className="mt-3 grid gap-2">
              {selectedServiceModes.map((mode) => {
                const ModeIcon = getModeIcon(mode);
                const isSelectedMode = bookingMode === mode;
                const isAccessible = accessibleModes.includes(mode);

                return (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => onSelectBookingMode(mode)}
                    disabled={!isAccessible}
                    className={`rounded-[18px] border px-4 py-3 text-left transition-all ${
                      isSelectedMode ? 'shadow-[0_16px_28px_-24px_rgba(233,30,140,0.45)]' : 'shadow-none'
                    } ${isAccessible ? 'hover:-translate-y-[1px]' : 'cursor-not-allowed opacity-55'}`}
                    style={{
                      borderColor: isSelectedMode ? 'rgba(233, 30, 140, 0.2)' : 'rgba(229, 231, 235, 1)',
                      backgroundColor: isSelectedMode ? '#FFF2F9' : '#FFFFFF',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: isSelectedMode ? APP_CONFIG.colors.primary : '#F3F4F6',
                          color: isSelectedMode ? '#FFFFFF' : '#4B5563',
                        }}
                      >
                        <ModeIcon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-gray-900">{getModeLabel(t, mode)}</p>
                        <p className="mt-1 text-[11px] font-medium text-gray-500">
                          {isAccessible ? t('modeReadyToBook') : t('modeNotBookable')}
                        </p>
                      </div>

                      {isSelectedMode ? (
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: APP_CONFIG.colors.primary }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {requiresOfflineScheduleSelection ? (
            <div className="mt-4 rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  <CalendarDays className="h-4 w-4" /> {t('chooseVisitDay')}
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {scheduleDays.map((scheduleDay) => {
                    const isSelectedDay = scheduleDay.id === scheduleDayId;

                    return (
                      <button
                        type="button"
                        key={scheduleDay.id}
                        onClick={() => onSelectScheduleDay(scheduleDay.id)}
                        className={`min-w-[104px] rounded-[18px] px-3 py-3 text-left transition-all ${
                          isSelectedDay ? 'text-white' : 'bg-white text-gray-700'
                        }`}
                        style={{
                          backgroundColor: isSelectedDay ? APP_CONFIG.colors.primary : '#FFFFFF',
                          boxShadow: isSelectedDay
                            ? '0 16px 32px -22px rgba(233, 30, 140, 0.42)'
                            : 'inset 0 0 0 1px rgba(229, 231, 235, 1)',
                        }}
                      >
                        <p className="text-[13px] font-bold">
                          {dateFormatter.format(new Date(`${scheduleDay.dateIso}T00:00:00`))}
                        </p>
                        <p
                          className={`mt-1 text-[11px] font-medium ${isSelectedDay ? 'text-white/80' : 'text-gray-500'}`}
                        >
                          {scheduleDay.slots.filter((slot) => slot.status !== 'booked').length} {t('slotOpenLabel')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  <Clock3 className="h-4 w-4" /> {t('chooseVisitTime')}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(selectedScheduleDay?.slots || []).map((timeSlot) => {
                    const isSelectedSlot = timeSlot.id === timeSlotId;
                    const isBooked = timeSlot.status === 'booked';
                    const statusLabel =
                      timeSlot.status === 'limited'
                        ? t('slotLimited')
                        : timeSlot.status === 'booked'
                          ? t('slotBooked')
                          : t('slotAvailable');

                    return (
                      <button
                        type="button"
                        key={timeSlot.id}
                        onClick={() => onSelectTimeSlot(timeSlot.id)}
                        disabled={isBooked}
                        className={`rounded-[18px] border px-3 py-3 text-left transition-all ${
                          isSelectedSlot ? 'shadow-[0_16px_32px_-22px_rgba(233,30,140,0.42)]' : 'shadow-none'
                        } ${isBooked ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-[1px]'}`}
                        style={{
                          borderColor: isSelectedSlot ? 'rgba(233, 30, 140, 0.24)' : 'rgba(229, 231, 235, 1)',
                          backgroundColor: isSelectedSlot ? '#FFF2F9' : '#FFFFFF',
                        }}
                      >
                        <p className="text-[14px] font-bold text-gray-900">{timeSlot.label}</p>
                        <p className="mt-1 text-[11px] font-medium text-gray-500">{statusLabel}</p>
                      </button>
                    );
                  })}
                </div>

                {!timeSlotId ? (
                  <p className="mt-3 text-[12px] font-medium text-amber-700">{t('scheduleRequired')}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100 bg-white px-5 pb-6 pt-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isReady}
            className={`${accentPrimaryButtonClass} w-full py-4 text-[15px]`}
            style={{
              background: isReady ? undefined : '#D1D5DB',
              boxShadow: isReady ? '0 12px 28px rgba(233, 30, 140, 0.28)' : 'none',
            }}
          >
            {t('saveServiceSelection')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const ProfessionalServicesSection = ({
  availabilityByMode,
  coverageStatus,
  isProfessionalAvailable,
  offeredServices,
  onSelectBookingMode,
  onSelectScheduleDay,
  onSelectService,
  onSelectTimeSlot,
  profileCopy,
  selectedBookingMode,
  selectedScheduleDayId,
  selectedScheduleDays,
  selectedService,
  selectedServiceEntry,
  selectedTimeSlotId,
}: ProfessionalServicesSectionProps) => {
  const t = useTranslations('Professional');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeModeFilter, setActiveModeFilter] = useState<'all' | ServiceDeliveryMode>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
  const [draftServiceId, setDraftServiceId] = useState('');
  const [draftBookingMode, setDraftBookingMode] = useState<ServiceDeliveryMode | null>(null);
  const [draftScheduleDayId, setDraftScheduleDayId] = useState('');
  const [draftTimeSlotId, setDraftTimeSlotId] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const categoryFilterMap = new Map<string, string>();

  for (const entry of offeredServices) {
    const categoryId = entry.catalogService.categoryId;

    if (!categoryFilterMap.has(categoryId)) {
      categoryFilterMap.set(categoryId, getCategoryById(categoryId)?.name || entry.catalogService.name);
    }
  }

  const categoryFilters = [...categoryFilterMap.entries()].map(([id, label]) => ({ id, label }));
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredServices = offeredServices.filter(({ serviceMapping, catalogService }) => {
    const categoryLabel = getCategoryById(catalogService.categoryId)?.name || catalogService.name;
    const matchesCategory = activeCategoryId === 'all' || catalogService.categoryId === activeCategoryId;
    const matchesMode =
      activeModeFilter === 'all' ||
      getEnabledServiceModes(serviceMapping.serviceModes).includes(activeModeFilter as ServiceDeliveryMode);
    const searchableText = [
      catalogService.name,
      categoryLabel,
      serviceMapping.summary,
      catalogService.shortDescription,
      ...catalogService.tags,
      ...catalogService.highlights,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesCategory && matchesMode && (!normalizedSearchQuery || searchableText.includes(normalizedSearchQuery));
  });

  const selectedCategoryLabel = selectedServiceEntry
    ? getCategoryById(selectedServiceEntry.catalogService.categoryId)?.name || selectedServiceEntry.catalogService.name
    : '';
  const selectedScheduleDay =
    selectedScheduleDays.find((scheduleDay) => scheduleDay.id === selectedScheduleDayId) || null;
  const selectedTimeSlot =
    selectedScheduleDay?.slots.find((timeSlot) => timeSlot.id === selectedTimeSlotId && timeSlot.status !== 'booked') ||
    null;
  const dateFormatter = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
  const hasActiveFilters = searchQuery.trim().length > 0 || activeCategoryId !== 'all' || activeModeFilter !== 'all';
  const activeStructuredFilterCount = (activeCategoryId !== 'all' ? 1 : 0) + (activeModeFilter !== 'all' ? 1 : 0);
  const activeCategoryLabel = categoryFilters.find((category) => category.id === activeCategoryId)?.label;
  const selectedModeLabel = selectedBookingMode ? getModeLabel(t, selectedBookingMode) : t('selectionModePending');
  const needsSelectedSchedule = Boolean(selectedBookingMode && isOfflineServiceMode(selectedBookingMode));
  const isSelectionReady = Boolean(
    selectedServiceEntry && selectedBookingMode && (!needsSelectedSchedule || selectedTimeSlot),
  );
  const selectedScheduleLabel =
    selectedBookingMode === 'online'
      ? t('selectionScheduleNotNeeded')
      : selectedScheduleDay && selectedTimeSlot
        ? `${dateFormatter.format(new Date(`${selectedScheduleDay.dateIso}T00:00:00`))} • ${selectedTimeSlot.label}`
        : t('selectionSchedulePending');
  const journeySteps: Array<{ index: string; label: string; state: 'current' | 'done' | 'pending' }> = [
    {
      index: '01',
      label: t('selectionStepChoose'),
      state: selectedServiceEntry ? 'done' : 'current',
    },
    {
      index: '02',
      label: t('selectionStepConfigure'),
      state: !selectedServiceEntry ? 'pending' : isSelectionReady ? 'done' : 'current',
    },
    {
      index: '03',
      label: t('selectionStepBook'),
      state: isSelectionReady ? 'current' : 'pending',
    },
  ];
  const selectionResumeTitle = !selectedServiceEntry
    ? t('selectionResumeEmptyTitle')
    : isSelectionReady
      ? t('selectionResumeReadyTitle')
      : t('selectionResumeIncompleteTitle');
  const selectionResumeDescription = !selectedServiceEntry
    ? t('selectionResumeEmptyDescription')
    : !selectedBookingMode
      ? t('selectionResumeModeDescription')
      : needsSelectedSchedule && !selectedTimeSlot
        ? t('selectionResumeScheduleDescription')
        : t('selectionResumeReadyDescription');
  const selectionResumeBadge = isSelectionReady ? t('selectionReadyBadge') : t('selectionProgressBadge');
  const draftSelection = deriveDraftSelectionState({
    availabilityByMode,
    bookingMode: draftBookingMode,
    coverageStatus,
    isProfessionalAvailable,
    offeredServices,
    scheduleDayId: draftScheduleDayId,
    serviceId: draftServiceId,
    timeSlotId: draftTimeSlotId,
  });

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategoryId('all');
    setActiveModeFilter('all');
  };

  const openServiceSheet = (serviceId: string) => {
    const isCurrentSelection = selectedService === serviceId;

    setDraftServiceId(serviceId);
    setDraftBookingMode(isCurrentSelection ? selectedBookingMode : null);
    setDraftScheduleDayId(isCurrentSelection ? selectedScheduleDayId : '');
    setDraftTimeSlotId(isCurrentSelection ? selectedTimeSlotId : '');
    setIsServiceSheetOpen(true);
  };

  const commitDraftSelection = () => {
    if (!draftSelection.serviceEntry || !draftSelection.bookingMode) {
      return;
    }

    onSelectService(draftSelection.serviceId);
    onSelectBookingMode(draftSelection.bookingMode);
    onSelectScheduleDay(draftSelection.scheduleDayId);
    onSelectTimeSlot(draftSelection.timeSlotId);
    setIsServiceSheetOpen(false);
  };

  return (
    <>
      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <ProfessionalSectionTitle icon={<Stethoscope className="h-4 w-4" />} title={profileCopy.serviceSectionTitle} />
        <p className="mt-3 text-[13px] leading-relaxed text-gray-500">{t('serviceSectionHelper')}</p>

        {selectedServiceEntry ? (
          <div className={`${blushPanelClass} mt-4 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={accentSoftPillClass}>{t('selectionResumeEyebrow')}</span>
                <h4 className="mt-3 text-[18px] font-bold leading-snug text-gray-900">{selectionResumeTitle}</h4>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{selectionResumeDescription}</p>
              </div>
              <span className={isSelectionReady ? accentSoftPillClass : neutralSoftPillClass}>
                {selectionResumeBadge}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {journeySteps.map((step) => (
                <SelectionJourneyStep key={step.index} index={step.index} label={step.label} state={step.state} t={t} />
              ))}
            </div>

            <div className={`${blushSubtlePanelClass} mt-4 p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={accentSoftPillClass}>{t('selectedServiceLabel')}</span>
                    <span className={neutralSoftPillClass}>{selectedCategoryLabel}</span>
                  </div>
                  <h4 className="mt-3 text-[18px] font-bold leading-snug text-gray-900">
                    {selectedServiceEntry.catalogService.name}
                  </h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                    {selectedServiceEntry.serviceMapping.summary ||
                      selectedServiceEntry.catalogService.shortDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openServiceSheet(selectedServiceEntry.serviceMapping.serviceId)}
                  className={neutralSoftPillClass}
                >
                  {t('configureSelectionAction')}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <SelectionMetaTile label={t('selectedModeLabel')} value={selectedModeLabel} />
                <SelectionMetaTile
                  label={t('bookingFlowLabel')}
                  value={getBookingFlowLabel(t, selectedServiceEntry.serviceMapping.bookingFlow)}
                />
                <SelectionMetaTile label={t('selectedSchedule')} value={selectedScheduleLabel} />
                <SelectionMetaTile label={t('selectedPriceLabel')} value={selectedServiceEntry.serviceMapping.price} />
              </div>
            </div>
          </div>
        ) : null}

        <div className={`${blushInputShellClass} mt-4 p-4`}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 w-full rounded-[18px] border border-gray-200 bg-white pl-11 pr-4 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-pink-100"
                placeholder={t('serviceSearchPlaceholder')}
              />
            </div>

            <button
              type="button"
              aria-expanded={isFilterPanelOpen}
              onClick={() => setIsFilterPanelOpen((current) => !current)}
              className="relative inline-flex h-12 items-center gap-2 rounded-[18px] border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeStructuredFilterCount > 0 ? (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: APP_CONFIG.colors.primary }}
                >
                  {activeStructuredFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          {activeStructuredFilterCount > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeCategoryLabel ? (
                <button
                  type="button"
                  onClick={() => setActiveCategoryId('all')}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]"
                >
                  {activeCategoryLabel}
                  <X className="h-3 w-3" />
                </button>
              ) : null}
              {activeModeFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setActiveModeFilter('all')}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]"
                >
                  {getModeLabel(t, activeModeFilter)}
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          ) : null}

          {isFilterPanelOpen || activeStructuredFilterCount > 0 ? (
            <div className="mt-4 space-y-4 border-t border-pink-50 pt-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {t('categoryFilterLabel')}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId('all')}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-semibold transition-colors ${
                      activeCategoryId === 'all' ? 'text-white' : 'bg-white text-gray-600'
                    }`}
                    style={{
                      backgroundColor: activeCategoryId === 'all' ? APP_CONFIG.colors.primary : '#FFFFFF',
                      boxShadow:
                        activeCategoryId === 'all'
                          ? '0 12px 28px -20px rgba(233, 30, 140, 0.42)'
                          : 'inset 0 0 0 1px rgba(229, 231, 235, 1)',
                    }}
                  >
                    {t('allCategories')}
                  </button>
                  {categoryFilters.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-semibold transition-colors ${
                        activeCategoryId === category.id ? 'text-white' : 'bg-white text-gray-600'
                      }`}
                      style={{
                        backgroundColor: activeCategoryId === category.id ? APP_CONFIG.colors.primary : '#FFFFFF',
                        boxShadow:
                          activeCategoryId === category.id
                            ? '0 12px 28px -20px rgba(233, 30, 140, 0.42)'
                            : 'inset 0 0 0 1px rgba(229, 231, 235, 1)',
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {t('modeFilterLabel')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModeFilter('all')}
                    className={`rounded-[18px] border px-3 py-3 text-left transition-all ${
                      activeModeFilter === 'all' ? 'shadow-[0_16px_28px_-22px_rgba(233,30,140,0.42)]' : 'shadow-none'
                    }`}
                    style={{
                      borderColor: activeModeFilter === 'all' ? 'rgba(233, 30, 140, 0.18)' : 'rgba(229, 231, 235, 1)',
                      backgroundColor: activeModeFilter === 'all' ? '#FFF2F9' : '#FFFFFF',
                    }}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: activeModeFilter === 'all' ? APP_CONFIG.colors.primary : '#F3F4F6',
                        color: activeModeFilter === 'all' ? '#FFFFFF' : '#4B5563',
                      }}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-[12px] font-semibold text-gray-900">{t('allModes')}</p>
                  </button>

                  {SERVICE_MODE_OPTIONS.map((mode) => {
                    const ModeIcon = getModeIcon(mode);
                    const isSelectedMode = activeModeFilter === mode;

                    return (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setActiveModeFilter(mode)}
                        className={`rounded-[18px] border px-3 py-3 text-left transition-all ${
                          isSelectedMode ? 'shadow-[0_16px_28px_-22px_rgba(233,30,140,0.42)]' : 'shadow-none'
                        }`}
                        style={{
                          borderColor: isSelectedMode ? 'rgba(233, 30, 140, 0.18)' : 'rgba(229, 231, 235, 1)',
                          backgroundColor: isSelectedMode ? '#FFF2F9' : '#FFFFFF',
                        }}
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: isSelectedMode ? APP_CONFIG.colors.primary : '#F3F4F6',
                            color: isSelectedMode ? '#FFFFFF' : '#4B5563',
                          }}
                        >
                          <ModeIcon className="h-4 w-4" />
                        </span>
                        <p className="mt-3 text-[12px] font-semibold text-gray-900">{getModeLabel(t, mode)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium text-gray-500">
              {t('serviceResultsCount', { count: filteredServices.length })}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="text-[12px] font-semibold"
                style={{ color: APP_CONFIG.colors.primary }}
                onClick={resetFilters}
              >
                {t('resetServiceFilters')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-[14px] font-bold text-gray-900">{t('serviceListTitle')}</h4>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
              {filteredServices.length}
            </span>
          </div>

          {filteredServices.length > 0 ? (
            <div className="space-y-3">
              {filteredServices.map(({ serviceMapping, catalogService }) => {
                const categoryName = getCategoryById(catalogService.categoryId)?.name || catalogService.name;
                const enabledModes = getEnabledServiceModes(serviceMapping.serviceModes);
                const isSelected = selectedService === serviceMapping.serviceId;

                return (
                  <button
                    type="button"
                    key={serviceMapping.serviceId}
                    onClick={() => openServiceSheet(serviceMapping.serviceId)}
                    className={`${softWhitePanelClass} w-full p-4 text-left transition-all ${
                      isSelected
                        ? 'shadow-[0_18px_34px_-24px_rgba(233,30,140,0.42)]'
                        : 'shadow-[0_12px_26px_-24px_rgba(17,24,39,0.32)] hover:shadow-[0_16px_30px_-22px_rgba(17,24,39,0.34)]'
                    }`}
                    style={{
                      borderColor: isSelected ? 'rgba(233, 30, 140, 0.2)' : 'rgba(243, 244, 246, 1)',
                      backgroundColor: isSelected ? '#FFF7FB' : '#FFFFFF',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-bold text-gray-900">{catalogService.name}</p>
                          <span className={neutralSoftPillClass}>{categoryName}</span>
                          {isSelected ? <span className={accentSoftPillClass}>{t('serviceSelected')}</span> : null}
                        </div>

                        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
                          {serviceMapping.summary || catalogService.shortDescription}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {enabledModes.map((mode) => {
                            const ModeIcon = getModeIcon(mode);

                            return (
                              <span
                                key={`${serviceMapping.serviceId}-${mode}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]"
                                title={getModeLabel(t, mode)}
                              >
                                <ModeIcon className="h-4 w-4" />
                              </span>
                            );
                          })}

                          <span className={neutralSoftPillClass}>
                            {getBookingFlowLabel(t, serviceMapping.bookingFlow)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[15px] font-bold text-gray-900">{serviceMapping.price}</p>
                        <p className="mt-1 text-[11px] font-medium text-gray-500">{serviceMapping.duration}</p>
                        <span
                          className={`mt-3 ${isSelected ? accentPrimaryButtonClass : darkPrimaryButtonClass} px-4 py-2.5 text-[11px]`}
                        >
                          {isSelected ? t('changeServiceAction') : t('selectServiceAction')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <p className="text-[14px] font-bold text-gray-900">{t('noFilteredServices')}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{t('noFilteredServicesHint')}</p>
            </div>
          )}
        </div>
      </section>

      <ServiceSelectionSheet
        draftSelection={draftSelection}
        isOpen={isServiceSheetOpen}
        locale={locale}
        onClose={() => setIsServiceSheetOpen(false)}
        onConfirm={commitDraftSelection}
        onSelectBookingMode={(mode) => {
          setDraftBookingMode(mode);
          setDraftScheduleDayId('');
          setDraftTimeSlotId('');
        }}
        onSelectScheduleDay={(scheduleDayId) => {
          setDraftScheduleDayId(scheduleDayId);
          setDraftTimeSlotId('');
        }}
        onSelectTimeSlot={setDraftTimeSlotId}
      />
    </>
  );
};
