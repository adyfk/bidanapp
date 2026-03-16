import appointmentRowsData from '@/data/mock-db/appointments.json';
import { getProfessionalById, getServiceById } from '@/lib/mock-db/catalog';
import type { Appointment } from '@/types/appointments';
import type { AppointmentRow } from '@/types/mock-db';
import { getRequiredItem, sortByIndex } from './utils';

const appointmentRows = sortByIndex(appointmentRowsData as AppointmentRow[]);

const hydrateAppointment = (appointmentRow: AppointmentRow): Appointment => ({
  id: appointmentRow.id,
  professional: getRequiredItem(
    getProfessionalById(appointmentRow.professionalId),
    `appointments.${appointmentRow.id}.professionalId -> ${appointmentRow.professionalId}`,
  ),
  service: getRequiredItem(
    getServiceById(appointmentRow.serviceId),
    `appointments.${appointmentRow.id}.serviceId -> ${appointmentRow.serviceId}`,
  ),
  time: appointmentRow.scheduledTimeLabel,
  status: appointmentRow.status,
  totalPrice: appointmentRow.totalPriceLabel,
});

export const MOCK_APPOINTMENTS: Appointment[] = appointmentRows.map(hydrateAppointment);
