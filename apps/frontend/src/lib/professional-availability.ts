'use client';

import type { ProfessionalManagedAppointmentRecord } from '@/features/professional-portal/lib/contracts';
import { ACTIVE_RUNTIME_CLOCK_ISO } from '@/lib/app-runtime';
import {
  DEFAULT_BOOKING_WINDOW_DAYS,
  DEFAULT_BOOKING_WINDOW_START_ISO,
  generateAvailabilityScheduleDays,
} from '@/lib/availability-rules';
import type { AppointmentStatus } from '@/types/appointments';
import type {
  OfflineServiceDeliveryMode,
  Professional,
  ProfessionalAvailabilityDay,
  ServiceDeliveryMode,
  TimeSlotStatus,
} from '@/types/catalog';

interface AppointmentSlotOccupancySource {
  professionalId: string;
  requestedMode: ServiceDeliveryMode;
  scheduleSnapshot: {
    dateIso?: string;
    scheduledTimeLabel: string;
    timeSlotLabel?: string;
  };
  status: AppointmentStatus;
}

const activeSlotBlockingStatuses: AppointmentStatus[] = ['confirmed', 'in_service'];
const tentativeSlotBlockingStatuses: AppointmentStatus[] = ['requested', 'approved_waiting_payment', 'paid'];

const isOfflineServiceMode = (mode: ServiceDeliveryMode): mode is OfflineServiceDeliveryMode => mode !== 'online';

const extractScheduleTimeLabel = (scheduledTimeLabel: string) => scheduledTimeLabel.match(/(\d{2}:\d{2})/)?.[1];

const getSlotOccupancyEntries = (
  appointmentRecords: AppointmentSlotOccupancySource[],
  professionalId: string,
  mode: OfflineServiceDeliveryMode,
  dateIso: string,
  timeLabel: string,
) =>
  appointmentRecords.filter((record) => {
    if (record.professionalId !== professionalId || record.requestedMode !== mode) {
      return false;
    }

    const recordDateIso = record.scheduleSnapshot.dateIso;
    const recordTimeLabel =
      record.scheduleSnapshot.timeSlotLabel || extractScheduleTimeLabel(record.scheduleSnapshot.scheduledTimeLabel);

    return recordDateIso === dateIso && recordTimeLabel === timeLabel;
  });

const getGeneratedSlotStatus = (
  appointmentRecords: AppointmentSlotOccupancySource[],
  professionalId: string,
  mode: OfflineServiceDeliveryMode,
  dateIso: string,
  timeLabel: string,
): TimeSlotStatus => {
  const occupancyEntries = getSlotOccupancyEntries(appointmentRecords, professionalId, mode, dateIso, timeLabel);

  if (occupancyEntries.some((entry) => activeSlotBlockingStatuses.includes(entry.status))) {
    return 'booked';
  }

  if (occupancyEntries.some((entry) => tentativeSlotBlockingStatuses.includes(entry.status))) {
    return 'limited';
  }

  return 'available';
};

export const getProfessionalAvailabilityScheduleDays = (
  professional: Pick<Professional, 'availabilityRulesByMode' | 'id'>,
  mode: ServiceDeliveryMode,
  {
    appointmentRecords,
    days = DEFAULT_BOOKING_WINDOW_DAYS,
    referenceDateTimeIso = ACTIVE_RUNTIME_CLOCK_ISO,
    startDateIso = DEFAULT_BOOKING_WINDOW_START_ISO,
  }: {
    appointmentRecords?: Array<
      Pick<ProfessionalManagedAppointmentRecord, 'professionalId' | 'requestedMode' | 'scheduleSnapshot' | 'status'>
    >;
    days?: number;
    referenceDateTimeIso?: string;
    startDateIso?: string;
  } = {},
): ProfessionalAvailabilityDay[] => {
  if (!isOfflineServiceMode(mode)) {
    return [];
  }

  const occupancySource = appointmentRecords?.length ? appointmentRecords : [];

  return generateAvailabilityScheduleDays({
    days,
    getSlotStatus: (dateIso, timeLabel) =>
      getGeneratedSlotStatus(occupancySource, professional.id, mode, dateIso, timeLabel),
    mode,
    professionalId: professional.id,
    referenceDateTimeIso,
    ruleSet: professional.availabilityRulesByMode?.[mode],
    startDateIso,
  });
};
