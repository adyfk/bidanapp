import type { GlobalService, Professional, ServiceDeliveryMode } from './catalog';

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

export interface AppointmentFeedback {
  author: string;
  dateLabel: string;
  image: string;
  quote: string;
  rating: number;
  role: string;
}

export interface Appointment {
  areaId: string;
  consumerId: string;
  feedback?: AppointmentFeedback;
  id: string;
  professional: Professional;
  requestChannel: string;
  requestNote: string;
  requestedAt: string;
  requestedMode: ServiceDeliveryMode;
  service: GlobalService;
  time: string;
  status: AppointmentStatus;
  totalPrice: string;
}
