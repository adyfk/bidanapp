import appointmentData from '@/data/simulation/appointments.json';
import { getProfessionalById, getServiceById } from '@/lib/simulation/catalog';
import { getRequiredItem } from '@/lib/simulation/utils';
import type {
  Appointment,
  AppointmentSeed,
  AppointmentSimulationFile,
  AppointmentStatus,
} from '@/types/appointments';

const data = appointmentData as AppointmentSimulationFile;
const sortByIndex = <T extends { index: number }>(items: T[]) => [...items].sort((left, right) => left.index - right.index);

const hydrateAppointment = (appointment: AppointmentSeed): Appointment => ({
  id: appointment.id,
  professional: getRequiredItem(
    getProfessionalById(appointment.professionalId),
    `appointments.${appointment.id}.professionalId -> ${appointment.professionalId}`
  ),
  service: getRequiredItem(
    getServiceById(appointment.serviceId),
    `appointments.${appointment.id}.serviceId -> ${appointment.serviceId}`
  ),
  time: appointment.time,
  status: appointment.status,
  totalPrice: appointment.totalPrice,
});

export const MOCK_APPOINTMENTS: Appointment[] = sortByIndex(data.appointments).map(hydrateAppointment);

const appointmentsById = new Map(MOCK_APPOINTMENTS.map((appointment) => [appointment.id, appointment]));

export const getAppointmentById = (appointmentId: string) => appointmentsById.get(appointmentId);

export const APPOINTMENTS_BY_STATUS = MOCK_APPOINTMENTS.reduce<Record<AppointmentStatus, Appointment[]>>(
  (accumulator, appointment) => {
    accumulator[appointment.status].push(appointment);
    return accumulator;
  },
  {
    requested: [],
    approved_waiting_payment: [],
    paid: [],
    confirmed: [],
    in_service: [],
    completed: [],
    cancelled: [],
    rejected: [],
    expired: [],
  }
);

export const ACTIVE_APPOINTMENT_CASES = [
  ...APPOINTMENTS_BY_STATUS.requested,
  ...APPOINTMENTS_BY_STATUS.approved_waiting_payment,
  ...APPOINTMENTS_BY_STATUS.paid,
  ...APPOINTMENTS_BY_STATUS.confirmed,
  ...APPOINTMENTS_BY_STATUS.in_service,
];

export const HISTORY_APPOINTMENT_CASES = [
  ...APPOINTMENTS_BY_STATUS.completed,
  ...APPOINTMENTS_BY_STATUS.cancelled,
  ...APPOINTMENTS_BY_STATUS.rejected,
  ...APPOINTMENTS_BY_STATUS.expired,
];
