'use client';

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
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
import { ProfessionalSectionTitle } from '@/features/professional-detail/components/ProfessionalSectionTitle';
import type { ProfessionalServiceEntry } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { APP_CONFIG } from '@/lib/config';
import { getCategoryById, getEnabledServiceModes } from '@/lib/mock-db/catalog';
import type { ProfessionalServiceScheduleDay, ServiceDeliveryMode } from '@/types/catalog';

interface ProfessionalServicesSectionProps {
  offeredServices: ProfessionalServiceEntry[];
  onSelectBookingMode: (mode: ServiceDeliveryMode) => void;
  onSelectScheduleDay: (scheduleDayId: string) => void;
  onSelectService: (serviceId: string) => void;
  onSelectTimeSlot: (timeSlotId: string) => void;
  profileCopy: {
    serviceSectionTitle: string;
  };
  requiresOfflineScheduleSelection: boolean;
  selectedAccessibleModes: ServiceDeliveryMode[];
  selectedBookingMode: ServiceDeliveryMode | null;
  selectedScheduleDayId: string;
  selectedScheduleDays: ProfessionalServiceScheduleDay[];
  selectedService: string;
  selectedServiceEntry: ProfessionalServiceEntry | null;
  selectedTimeSlotId: string;
}

type ProfessionalTranslations = ReturnType<typeof useTranslations>;

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

export const ProfessionalServicesSection = ({
  offeredServices,
  onSelectBookingMode,
  onSelectScheduleDay,
  onSelectService,
  onSelectTimeSlot,
  profileCopy,
  requiresOfflineScheduleSelection,
  selectedAccessibleModes,
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
  const [isSelectedServiceDetailsOpen, setIsSelectedServiceDetailsOpen] = useState(false);
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

  const selectedServiceModes = selectedServiceEntry
    ? getEnabledServiceModes(selectedServiceEntry.serviceMapping.serviceModes)
    : [];
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
  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategoryId('all');
    setActiveModeFilter('all');
  };
  const handleSelectService = (serviceId: string) => {
    setIsSelectedServiceDetailsOpen(false);
    onSelectService(serviceId);
  };

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm">
      <ProfessionalSectionTitle icon={<Stethoscope className="h-4 w-4" />} title={profileCopy.serviceSectionTitle} />

      <div className="mt-4 rounded-[24px] border border-gray-100 bg-[linear-gradient(180deg,#FFF9FC_0%,#FFFFFF_100%)] p-4">
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
            <span className="hidden sm:inline">{t('filterLabel')}</span>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

      {selectedServiceEntry ? (
        <div className="mt-5 rounded-[26px] border border-pink-100 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF7FB_100%)] p-5 shadow-[0_18px_40px_-30px_rgba(17,24,39,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                >
                  {t('selectedServiceLabel')}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-600 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]">
                  {selectedCategoryLabel}
                </span>
              </div>
              <h4 className="mt-3 text-[19px] font-bold text-gray-900">{selectedServiceEntry.catalogService.name}</h4>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                {selectedServiceEntry.serviceMapping.summary || selectedServiceEntry.catalogService.shortDescription}
              </p>
            </div>

            <div className="flex-shrink-0 text-right">
              <p className="text-[18px] font-bold text-gray-900">{selectedServiceEntry.serviceMapping.price}</p>
              <p className="mt-1 text-[12px] font-medium text-gray-500">
                {selectedServiceEntry.serviceMapping.duration}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {t('chooseServiceMode')}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {selectedServiceModes.map((mode) => {
                const ModeIcon = getModeIcon(mode);
                const isSelectedMode = selectedBookingMode === mode;
                const isAccessible = selectedAccessibleModes.includes(mode);

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
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: isSelectedMode ? APP_CONFIG.colors.primary : '#F3F4F6',
                          color: isSelectedMode ? '#FFFFFF' : '#4B5563',
                        }}
                      >
                        <ModeIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900">{getModeLabel(t, mode)}</p>
                        <p className="mt-1 text-[11px] font-medium text-gray-500">
                          {isAccessible ? t('modeReadyToBook') : t('modeNotBookable')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {requiresOfflineScheduleSelection ? (
            <div className="mt-5 space-y-4 rounded-[22px] bg-white/80 p-4 shadow-[inset_0_0_0_1px_rgba(243,244,246,1)]">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  <CalendarDays className="h-4 w-4" /> {t('chooseVisitDay')}
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {selectedScheduleDays.map((scheduleDay) => {
                    const isSelectedDay = scheduleDay.id === selectedScheduleDayId;

                    return (
                      <button
                        type="button"
                        key={scheduleDay.id}
                        onClick={() => onSelectScheduleDay(scheduleDay.id)}
                        className={`min-w-[96px] rounded-[18px] px-3 py-3 text-left transition-all ${
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

              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  <Clock3 className="h-4 w-4" /> {t('chooseVisitTime')}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(selectedScheduleDay?.slots || []).map((timeSlot) => {
                    const isSelectedSlot = timeSlot.id === selectedTimeSlotId;
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
                {!selectedTimeSlot ? (
                  <p className="mt-3 text-[12px] font-medium text-amber-700">{t('scheduleRequired')}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {selectedTimeSlot && selectedScheduleDay ? (
            <p className="mt-4 text-[12px] font-semibold text-gray-600">
              {t('selectedSchedule')}: {dateFormatter.format(new Date(`${selectedScheduleDay.dateIso}T00:00:00`))} •{' '}
              {selectedTimeSlot.label}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-pink-50 pt-4">
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]">
              {t('bookingFlowLabel')}:{' '}
              {selectedServiceEntry.serviceMapping.bookingFlow === 'instant'
                ? t('bookingFlowInstant')
                : t('bookingFlowRequest')}
            </span>
            <button
              type="button"
              onClick={() => setIsSelectedServiceDetailsOpen((current) => !current)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: APP_CONFIG.colors.primary }}
            >
              {isSelectedServiceDetailsOpen ? t('hideServiceDetails') : t('showServiceDetails')}
              {isSelectedServiceDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {isSelectedServiceDetailsOpen ? (
            <div className="mt-4 rounded-[22px] bg-white/80 p-4 shadow-[inset_0_0_0_1px_rgba(243,244,246,1)]">
              {selectedServiceEntry.catalogService.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedServiceEntry.catalogService.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-gray-500 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                {selectedServiceEntry.catalogService.highlights.slice(0, 3).map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2 text-[12px] text-gray-600">
                    <span
                      className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: APP_CONFIG.colors.primary }}
                    />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-[14px] font-bold text-gray-900">{t('serviceListTitle')}</h4>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
            {filteredServices.length}
          </span>
        </div>

        {filteredServices.length > 0 ? (
          <div className="space-y-2">
            {filteredServices.map(({ serviceMapping, catalogService }) => {
              const categoryName = getCategoryById(catalogService.categoryId)?.name || catalogService.name;
              const enabledModes = getEnabledServiceModes(serviceMapping.serviceModes);
              const isSelected = selectedService === serviceMapping.serviceId;

              return (
                <button
                  type="button"
                  key={serviceMapping.serviceId}
                  onClick={() => handleSelectService(serviceMapping.serviceId)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
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
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                          {categoryName}
                        </span>
                        {isSelected ? (
                          <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor: APP_CONFIG.colors.primaryLight,
                              color: APP_CONFIG.colors.primary,
                            }}
                          >
                            {t('serviceSelected')}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-[12px] leading-relaxed text-gray-500">
                        {serviceMapping.summary || catalogService.shortDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {enabledModes.map((mode) => {
                          const ModeIcon = getModeIcon(mode);

                          return (
                            <span
                              key={`${serviceMapping.serviceId}-${mode}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]"
                              title={getModeLabel(t, mode)}
                            >
                              <ModeIcon className="h-4 w-4" />
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-[15px] font-bold text-gray-900">{serviceMapping.price}</p>
                      <p className="mt-1 text-[11px] font-medium text-gray-500">{serviceMapping.duration}</p>
                      <span
                        className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold ${
                          isSelected ? '' : 'text-gray-400'
                        }`}
                        style={isSelected ? { color: APP_CONFIG.colors.primary } : undefined}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
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
  );
};
