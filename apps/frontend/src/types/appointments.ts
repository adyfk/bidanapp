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

export interface Appointment {
  consumerId: string;
  id: string;
  professional: Professional;
  service: GlobalService;
  time: string;
  status: AppointmentStatus;
  totalPrice: string;
}
