'use client';

import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  getAccessibleServiceModes,
  getProfessionalAvailabilityScheduleDays,
  getProfessionalCategoryLabel,
  getProfessionalCoverageStatus,
  isOfflineServiceMode,
  MOCK_SERVICES,
} from '@/lib/mock-db/catalog';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { Professional, ServiceDeliveryMode } from '@/types/catalog';

export interface ProfessionalTrustIndicator {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export interface ProfessionalServiceEntry {
  catalogService: (typeof MOCK_SERVICES)[number];
  serviceMapping: Professional['services'][number];
}

export const useProfessionalDetail = (professionalSlug: string | undefined) => {
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
    getCustomerRequestForProfessional,
    getPreviewProfessionalBySlug,
    getPublicProfessionalBySlug,
  } = useProfessionalPortal();

  const professional = professionalSlug
    ? (isProfessional ? getPreviewProfessionalBySlug(professionalSlug) : null) ||
      getPublicProfessionalBySlug(professionalSlug)
    : null;
  const customerRequest = professional ? getCustomerRequestForProfessional(professional.id) : null;
  const profCategory = professional ? getProfessionalCategoryLabel(professional) || 'Professional' : 'Professional';
  const requestedServiceId = searchParams.get('service');
  const requestedModeParam = searchParams.get('mode');
  const offeredServices: ProfessionalServiceEntry[] = professional
    ? professional.services.flatMap((serviceMapping) => {
        const catalogService = MOCK_SERVICES.find((service) => service.id === serviceMapping.serviceId);

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
    ? getProfessionalCoverageStatus(professional, userLocation, selectedAreaId)
    : null;
  const selectedAccessibleModes =
    selectedServiceEntry && professional && coverageStatus
      ? getAccessibleServiceModes(
          selectedServiceEntry.serviceMapping.serviceModes,
          coverageStatus,
          professional.availability.isAvailable,
        ).filter(
          (mode) =>
            !isOfflineServiceMode(mode) ||
            getProfessionalAvailabilityScheduleDays(professional, mode).some((scheduleDay) =>
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
      ? getProfessionalAvailabilityScheduleDays(professional, selectedBookingMode)
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

  const requestBooking = () => {
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
        ? `${selectedScheduleDay.label}, ${selectedTimeSlot.label}`
        : undefined;
    const nextNotice = uiText.getServiceBookingNotice(
      selectedBookingMode,
      selectedServiceEntry.catalogService.name,
      scheduleMessage,
    );

    if (professional) {
      const created = createCustomerRequest({
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
    serviceId ? MOCK_SERVICES.find((service) => service.id === serviceId)?.name : undefined;

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
