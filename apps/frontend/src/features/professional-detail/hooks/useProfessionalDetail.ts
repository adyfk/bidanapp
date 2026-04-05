'use client';

import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  getAccessibleServiceModes,
  getProfessionalCategoryLabel,
  getProfessionalCoverageStatus,
  isOfflineServiceMode,
} from '@/lib/catalog-selectors';
import { getProfessionalAvailabilityScheduleDays } from '@/lib/professional-availability';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import { useViewerSession } from '@/lib/use-viewer-session';
import type {
  Area,
  Category,
  GlobalService,
  Professional,
  ProfessionalAvailabilityDay,
  ServiceDeliveryMode,
} from '@/types/catalog';

const getDetailLocale = () => {
  if (typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('id')) {
    return 'id-ID';
  }

  return 'en-US';
};

const formatScheduleSelectionLabel = (dateIso: string, timeLabel: string) =>
  `${new Intl.DateTimeFormat(getDetailLocale(), {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(`${dateIso}T00:00:00`))}, ${timeLabel}`;

export interface ProfessionalTrustIndicator {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export interface ProfessionalServiceEntry {
  catalogService: GlobalService;
  serviceMapping: Professional['services'][number];
}

export const useProfessionalDetail = ({
  areas,
  categories,
  initialProfessional = null,
  professionalSlug,
  services,
}: {
  areas: Area[];
  categories: Category[];
  initialProfessional?: Professional | null;
  professionalSlug: string | undefined;
  services: GlobalService[];
}) => {
  const uiText = useUiText();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBookingMode, setSelectedBookingMode] = useState<ServiceDeliveryMode | null>(null);
  const [selectedScheduleDayId, setSelectedScheduleDayId] = useState('');
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('');
  const { selectedAreaId, userLocation } = useProfessionalUserPreferences();
  const { isProfessional } = useViewerSession();
  const {
    createCustomerRequest,
    getAppointmentRecordsForProfessional,
    getCustomerRequestForProfessional,
    getPreviewProfessionalBySlug,
    getPublicProfessionalBySlug,
  } = useProfessionalPortal();

  const professional = professionalSlug
    ? (isProfessional ? getPreviewProfessionalBySlug(professionalSlug) : null) ||
      initialProfessional ||
      getPublicProfessionalBySlug(professionalSlug) ||
      null
    : null;
  const customerRequest = professional ? getCustomerRequestForProfessional(professional.id) : null;
  const profCategory = professional
    ? getProfessionalCategoryLabel({
        categories,
        professional,
        services,
      }) || 'Professional'
    : 'Professional';
  const requestedServiceId = searchParams.get('service');
  const requestedModeParam = searchParams.get('mode');
  const offeredServices: ProfessionalServiceEntry[] = professional
    ? professional.services.flatMap((serviceMapping) => {
        const catalogService = services.find((service) => service.id === serviceMapping.serviceId);

        return catalogService ? [{ catalogService, serviceMapping }] : [];
      })
    : [];

  useEffect(() => {
    if (offeredServices.length === 0) {
      if (selectedService) {
        setSelectedService('');
      }

      return;
    }

    const nextSelectedService =
      (requestedServiceId &&
        offeredServices.some(({ serviceMapping }) => serviceMapping.serviceId === requestedServiceId) &&
        requestedServiceId) ||
      (offeredServices.some(({ serviceMapping }) => serviceMapping.serviceId === selectedService)
        ? selectedService
        : '');

    if (nextSelectedService !== selectedService) {
      setSelectedService(nextSelectedService);
    }
  }, [offeredServices, requestedServiceId, selectedService]);

  const selectedServiceEntry =
    offeredServices.find(({ serviceMapping }) => serviceMapping.serviceId === selectedService) || null;
  const coverageStatus = professional
    ? getProfessionalCoverageStatus({
        areas,
        professional,
        selectedAreaId,
        userLocation,
      })
    : null;
  const appointmentRecords = professional ? getAppointmentRecordsForProfessional(professional.id) : [];
  const scheduleDaysByMode: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>> = professional
    ? {
        home_visit: getProfessionalAvailabilityScheduleDays(professional, 'home_visit', {
          appointmentRecords,
        }),
        onsite: getProfessionalAvailabilityScheduleDays(professional, 'onsite', {
          appointmentRecords,
        }),
      }
    : {};
  const selectedAccessibleModes =
    selectedServiceEntry && professional && coverageStatus
      ? getAccessibleServiceModes(
          selectedServiceEntry.serviceMapping.serviceModes,
          coverageStatus,
          professional.availability.isAvailable,
        ).filter(
          (mode) =>
            !isOfflineServiceMode(mode) ||
            (scheduleDaysByMode[mode] || []).some((scheduleDay) =>
              scheduleDay.slots.some((slot) => slot.status !== 'booked'),
            ),
        )
      : [];

  useEffect(() => {
    if (!selectedServiceEntry) {
      if (selectedBookingMode !== null) {
        setSelectedBookingMode(null);
      }

      return;
    }

    const requestedMode =
      requestedModeParam === 'online' || requestedModeParam === 'home_visit' || requestedModeParam === 'onsite'
        ? requestedModeParam
        : null;
    const nextMode =
      (requestedMode && selectedAccessibleModes.includes(requestedMode) && requestedMode) ||
      (selectedBookingMode && selectedAccessibleModes.includes(selectedBookingMode) && selectedBookingMode) ||
      (selectedAccessibleModes.includes(selectedServiceEntry.serviceMapping.defaultMode) &&
        selectedServiceEntry.serviceMapping.defaultMode) ||
      selectedAccessibleModes[0] ||
      null;

    if (nextMode !== selectedBookingMode) {
      setSelectedBookingMode(nextMode);
    }
  }, [requestedModeParam, selectedAccessibleModes, selectedBookingMode, selectedServiceEntry]);

  const selectedScheduleDays =
    selectedServiceEntry && professional && selectedBookingMode && isOfflineServiceMode(selectedBookingMode)
      ? scheduleDaysByMode[selectedBookingMode] || []
      : [];
  const selectedScheduleDay =
    selectedScheduleDays.find((scheduleDay) => scheduleDay.id === selectedScheduleDayId) || null;
  const selectedTimeSlot =
    selectedScheduleDay?.slots.find((timeSlot) => timeSlot.id === selectedTimeSlotId && timeSlot.status !== 'booked') ||
    null;
  const requiresOfflineScheduleSelection = Boolean(selectedBookingMode && isOfflineServiceMode(selectedBookingMode));

  useEffect(() => {
    if (!requiresOfflineScheduleSelection) {
      if (selectedScheduleDayId) {
        setSelectedScheduleDayId('');
      }

      if (selectedTimeSlotId) {
        setSelectedTimeSlotId('');
      }

      return;
    }

    const nextScheduleDayId =
      (selectedScheduleDayId && selectedScheduleDays.some((scheduleDay) => scheduleDay.id === selectedScheduleDayId)
        ? selectedScheduleDayId
        : selectedScheduleDays[0]?.id) || '';

    if (nextScheduleDayId !== selectedScheduleDayId) {
      setSelectedScheduleDayId(nextScheduleDayId);
    }
  }, [requiresOfflineScheduleSelection, selectedScheduleDayId, selectedScheduleDays, selectedTimeSlotId]);

  useEffect(() => {
    if (!requiresOfflineScheduleSelection || !selectedScheduleDay) {
      if (selectedTimeSlotId) {
        setSelectedTimeSlotId('');
      }

      return;
    }

    if (
      !selectedScheduleDay.slots.some((timeSlot) => timeSlot.id === selectedTimeSlotId && timeSlot.status !== 'booked')
    ) {
      setSelectedTimeSlotId('');
    }
  }, [requiresOfflineScheduleSelection, selectedScheduleDay, selectedTimeSlotId]);

  const canRequestBooking = Boolean(
    selectedServiceEntry && selectedBookingMode && (!requiresOfflineScheduleSelection || selectedTimeSlot),
  );

  const requestBooking = async () => {
    if (!selectedServiceEntry || !selectedBookingMode) {
      return;
    }

    if (requiresOfflineScheduleSelection && (!selectedScheduleDay || !selectedTimeSlot)) {
      return;
    }

    const scheduleMessage =
      requiresOfflineScheduleSelection && selectedScheduleDay && selectedTimeSlot
        ? uiText.getScheduleNotice(selectedScheduleDay.dateIso, selectedTimeSlot.label)
        : '';
    const scheduledTimeLabel =
      requiresOfflineScheduleSelection && selectedScheduleDay && selectedTimeSlot
        ? formatScheduleSelectionLabel(selectedScheduleDay.dateIso, selectedTimeSlot.label)
        : undefined;
    const nextNotice = uiText.getServiceBookingNotice(
      selectedBookingMode,
      selectedServiceEntry.catalogService.name,
      scheduleMessage,
    );

    if (professional) {
      const created = await createCustomerRequest({
        note: nextNotice,
        professionalId: professional.id,
        requestedMode: selectedBookingMode,
        scheduleDayId: selectedScheduleDay?.id,
        scheduledTimeLabel,
        serviceId: selectedServiceEntry.catalogService.id,
        serviceOfferingId: selectedServiceEntry.serviceMapping.id,
        timeSlotId: selectedTimeSlot?.id,
      });

      if (!created) {
        return;
      }
    }

    setNotice(nextNotice);
  };

  const getServiceName = (serviceId?: string) =>
    serviceId ? services.find((service) => service.id === serviceId)?.name : undefined;

  return {
    canRequestBooking,
    coverageStatus,
    customerRequest,
    getServiceName,
    notice,
    offeredServices,
    professional,
    profCategory,
    requestBooking,
    requiresOfflineScheduleSelection,
    scheduleDaysByMode,
    selectedAccessibleModes,
    selectedBookingMode,
    selectedScheduleDay,
    selectedScheduleDayId,
    selectedScheduleDays,
    selectedService,
    selectedServiceEntry,
    selectedTimeSlot,
    selectedTimeSlotId,
    setNotice,
    setSelectedBookingMode,
    setSelectedScheduleDayId,
    setSelectedService,
    setSelectedTimeSlotId,
  };
};
