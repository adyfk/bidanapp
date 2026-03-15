import type { GlobalService, Professional } from './catalog';

export type AppointmentStatus =
  | 'requested'
  | 'approved_waiting_payment'
  | 'paid'
  | 'confirmed'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export interface AppointmentSeed {
  index: number;
  id: string;
  professionalId: string;
  serviceId: string;
  time: string;
  status: AppointmentStatus;
  totalPrice: string;
}

export interface Appointment {
  id: string;
  professional: Professional;
  service: GlobalService;
  time: string;
  status: AppointmentStatus;
  totalPrice: string;
}

export interface AppointmentSimulationFile {
  appointments: AppointmentSeed[];
}
