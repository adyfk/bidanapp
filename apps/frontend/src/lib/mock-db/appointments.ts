import { APPOINTMENT_ROWS } from '@/lib/mock-db/appointment-records';
import { getProfessionalById, getServiceById } from '@/lib/mock-db/catalog';
import type { Appointment, AppointmentFeedback } from '@/types/appointments';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { getRequiredItem } from './utils';

export interface AppointmentSeed {
  areaId: string;
  consumerId: string;
  feedback?: AppointmentFeedback;
  id: string;
  professionalId: string;
  requestChannel: string;
  requestNote: string;
  requestedAt: string;
  requestedMode: ServiceDeliveryMode;
  scheduledTimeLabel: string;
  serviceId: string;
  status: Appointment['status'];
  totalPriceLabel: string;
}

export const createHydratedAppointment = (appointmentSeed: AppointmentSeed): Appointment => ({
  areaId: appointmentSeed.areaId,
  consumerId: appointmentSeed.consumerId,
  feedback: appointmentSeed.feedback,
  id: appointmentSeed.id,
  professional: getRequiredItem(
    getProfessionalById(appointmentSeed.professionalId),
    `appointments.${appointmentSeed.id}.professionalId -> ${appointmentSeed.professionalId}`,
  ),
  service: getRequiredItem(
    getServiceById(appointmentSeed.serviceId),
    `appointments.${appointmentSeed.id}.serviceId -> ${appointmentSeed.serviceId}`,
  ),
  requestChannel: appointmentSeed.requestChannel,
  requestNote: appointmentSeed.requestNote,
  requestedAt: appointmentSeed.requestedAt,
  requestedMode: appointmentSeed.requestedMode,
  time: appointmentSeed.scheduledTimeLabel,
  status: appointmentSeed.status,
  totalPrice: appointmentSeed.totalPriceLabel,
});

export const MOCK_APPOINTMENTS: Appointment[] = APPOINTMENT_ROWS.map((appointmentRow) =>
  createHydratedAppointment({
    areaId: appointmentRow.areaId,
    consumerId: appointmentRow.consumerId,
    feedback: appointmentRow.customerFeedback || undefined,
    id: appointmentRow.id,
    professionalId: appointmentRow.professionalId,
    requestChannel: appointmentRow.requestChannel,
    requestNote: appointmentRow.requestNote,
    requestedAt: appointmentRow.requestedAt,
    requestedMode: appointmentRow.requestedMode,
    scheduledTimeLabel: appointmentRow.scheduledTimeLabel,
    serviceId: appointmentRow.serviceId,
    status: appointmentRow.status,
    totalPriceLabel: appointmentRow.totalPriceLabel,
  }),
);
const appointmentsById = new Map(MOCK_APPOINTMENTS.map((appointment) => [appointment.id, appointment]));

export const getAppointmentById = (appointmentId: string) => appointmentsById.get(appointmentId);
