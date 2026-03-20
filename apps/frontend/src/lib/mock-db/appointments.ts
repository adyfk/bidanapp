import { createDefaultCancellationPolicySnapshot } from '@/features/appointments/lib/cancellation';
import { APPOINTMENT_ROWS } from '@/lib/mock-db/appointment-records';
import { getProfessionalById } from '@/lib/mock-db/catalog';
import type {
  Appointment,
  AppointmentCancellationPolicySnapshot,
  AppointmentCancellationResolution,
  AppointmentFeedback,
  AppointmentScheduleSnapshot,
  AppointmentServiceSnapshot,
  AppointmentTimelineEvent,
} from '@/types/appointments';
import type { BookingFlow, ServiceDeliveryMode } from '@/types/catalog';
import { getRequiredItem } from './utils';

export interface AppointmentSeed {
  areaId: string;
  bookingFlow: BookingFlow;
  cancellationPolicySnapshot?: AppointmentCancellationPolicySnapshot;
  cancellationResolution?: AppointmentCancellationResolution;
  consumerId: string;
  feedback?: AppointmentFeedback;
  id: string;
  professionalId: string;
  requestNote: string;
  requestedAt: string;
  requestedMode: ServiceDeliveryMode;
  scheduleSnapshot: AppointmentScheduleSnapshot;
  serviceSnapshot: AppointmentServiceSnapshot;
  status: Appointment['status'];
  timeline: AppointmentTimelineEvent[];
}

export const appointmentPriceLabelToNumber = (priceLabel: string) =>
  Number.parseInt(priceLabel.replace(/\D/g, ''), 10) || 0;

export const createHydratedAppointment = (appointmentSeed: AppointmentSeed): Appointment => ({
  areaId: appointmentSeed.areaId,
  bookingFlow: appointmentSeed.bookingFlow,
  cancellationPolicySnapshot:
    appointmentSeed.cancellationPolicySnapshot ||
    createDefaultCancellationPolicySnapshot(appointmentSeed.requestedMode),
  cancellationResolution: appointmentSeed.cancellationResolution,
  consumerId: appointmentSeed.consumerId,
  feedback: appointmentSeed.feedback,
  id: appointmentSeed.id,
  professional: getRequiredItem(
    getProfessionalById(appointmentSeed.professionalId),
    `appointments.${appointmentSeed.id}.professionalId -> ${appointmentSeed.professionalId}`,
  ),
  requestNote: appointmentSeed.requestNote,
  requestedAt: appointmentSeed.requestedAt,
  requestedMode: appointmentSeed.requestedMode,
  scheduleSnapshot: appointmentSeed.scheduleSnapshot,
  service: appointmentSeed.serviceSnapshot,
  serviceSnapshot: appointmentSeed.serviceSnapshot,
  status: appointmentSeed.status,
  time: appointmentSeed.scheduleSnapshot.scheduledTimeLabel,
  timeline: appointmentSeed.timeline,
  totalPrice: appointmentSeed.serviceSnapshot.priceLabel,
});

export const MOCK_APPOINTMENTS: Appointment[] = APPOINTMENT_ROWS.map((appointmentRow) =>
  createHydratedAppointment({
    areaId: appointmentRow.areaId,
    bookingFlow: appointmentRow.bookingFlow,
    cancellationPolicySnapshot: appointmentRow.cancellationPolicySnapshot,
    cancellationResolution: appointmentRow.cancellationResolution || undefined,
    consumerId: appointmentRow.consumerId,
    feedback: appointmentRow.customerFeedback || undefined,
    id: appointmentRow.id,
    professionalId: appointmentRow.professionalId,
    requestNote: appointmentRow.requestNote,
    requestedAt: appointmentRow.requestedAt,
    requestedMode: appointmentRow.requestedMode,
    scheduleSnapshot: appointmentRow.scheduleSnapshot,
    serviceSnapshot: appointmentRow.serviceSnapshot,
    status: appointmentRow.status,
    timeline: appointmentRow.timeline,
  }),
);

const appointmentsById = new Map(MOCK_APPOINTMENTS.map((appointment) => [appointment.id, appointment]));

export const getAppointmentById = (appointmentId: string) => appointmentsById.get(appointmentId);
