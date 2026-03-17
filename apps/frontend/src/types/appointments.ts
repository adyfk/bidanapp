import type { BookingFlow, Professional, ServiceDeliveryMode, ServiceModeFlags } from './catalog';

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

export interface AppointmentServiceSnapshot {
  bookingFlow: BookingFlow;
  categoryId: string;
  coverImage: string;
  defaultMode: ServiceDeliveryMode;
  description: string;
  durationLabel: string;
  highlights: string[];
  image: string;
  name: string;
  priceAmount: number;
  priceLabel: string;
  serviceId: string;
  serviceModes: ServiceModeFlags;
  serviceOfferingId: string;
  shortDescription: string;
  slug: string;
  summary: string;
  tags: string[];
}

export interface AppointmentScheduleSnapshot {
  dateIso?: string;
  requiresSchedule: boolean;
  scheduleDayId?: string;
  scheduleDayLabel?: string;
  scheduledTimeLabel: string;
  timeSlotId?: string;
  timeSlotLabel?: string;
}

export type AppointmentTimelineActor = 'customer' | 'professional' | 'system';

export interface AppointmentTimelineEvent {
  actor: AppointmentTimelineActor;
  createdAt: string;
  createdAtLabel: string;
  customerSummary?: string;
  evidenceUrl?: string;
  fromStatus?: AppointmentStatus;
  id: string;
  internalNote?: string;
  toStatus: AppointmentStatus;
}

export interface Appointment {
  areaId: string;
  bookingFlow: BookingFlow;
  consumerId: string;
  feedback?: AppointmentFeedback;
  id: string;
  professional: Professional;
  requestNote: string;
  requestedAt: string;
  requestedMode: ServiceDeliveryMode;
  scheduleSnapshot: AppointmentScheduleSnapshot;
  service: AppointmentServiceSnapshot;
  serviceSnapshot: AppointmentServiceSnapshot;
  time: string;
  timeline: AppointmentTimelineEvent[];
  status: AppointmentStatus;
  totalPrice: string;
}
