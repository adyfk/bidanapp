import appointmentRowsData from '@/data/mock-db/appointments.json';
import type { AppointmentRow } from '@/types/mock-db';
import { sortByIndex } from './utils';

const groupBy = <T, K>(items: T[], getKey: (item: T) => K) => {
  const grouped = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const existing = grouped.get(key);

    if (existing) {
      existing.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
};

export const APPOINTMENT_ROWS = sortByIndex(appointmentRowsData as AppointmentRow[]);

const appointmentRowsById = new Map(APPOINTMENT_ROWS.map((appointmentRow) => [appointmentRow.id, appointmentRow]));
const appointmentRowsByProfessionalId = groupBy(APPOINTMENT_ROWS, (appointmentRow) => appointmentRow.professionalId);

export const getAppointmentRowById = (appointmentId: string) => appointmentRowsById.get(appointmentId);

export const getAppointmentRowsByProfessionalId = (professionalId: string) =>
  sortByIndex(appointmentRowsByProfessionalId.get(professionalId) || []);
