import { createDefaultCancellationPolicySnapshot } from '@/features/appointments/lib/cancellation';
import type {
  Appointment,
  AppointmentCancellationPolicySnapshot,
  AppointmentCancellationResolution,
  AppointmentFeedback,
  AppointmentScheduleSnapshot,
  AppointmentServiceSnapshot,
  AppointmentTimelineEvent,
} from '@/types/appointments';
import type { BookingFlow, Professional, ServiceDeliveryMode } from '@/types/catalog';

export interface AppointmentSeed {
  areaId: string;
  bookingFlow: BookingFlow;
  cancellationPolicySnapshot?: AppointmentCancellationPolicySnapshot;
  cancellationResolution?: AppointmentCancellationResolution;
  consumerId: string;
  customerFeedback?: AppointmentFeedback;
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

export const createHydratedAppointment = (
  appointmentSeed: AppointmentSeed,
  professional: Professional | null | undefined,
): Appointment => ({
  areaId: appointmentSeed.areaId,
  bookingFlow: appointmentSeed.bookingFlow,
  cancellationPolicySnapshot:
    appointmentSeed.cancellationPolicySnapshot ||
    createDefaultCancellationPolicySnapshot(appointmentSeed.requestedMode),
  cancellationResolution: appointmentSeed.cancellationResolution,
  consumerId: appointmentSeed.consumerId,
  feedback: appointmentSeed.feedback || appointmentSeed.customerFeedback,
  id: appointmentSeed.id,
  professional: professional || {
    about: '',
    activityStories: [],
    availability: { isAvailable: false },
    availabilityRulesByMode: undefined,
    badgeLabel: '',
    cancellationPoliciesByMode: undefined,
    clientsServed: '',
    coverImage: undefined,
    coverage: {
      areaIds: [],
      center: { latitude: 0, longitude: 0 },
      homeVisitRadiusKm: 0,
    },
    credentials: [],
    experience: '',
    feedbackBreakdown: [],
    feedbackMetrics: [],
    feedbackSummary: {
      recommendationRate: '',
      repeatClientRate: '',
    },
    gallery: [],
    gender: 'female',
    id: appointmentSeed.professionalId,
    image: '',
    index: 0,
    languages: [],
    location: '',
    name: '',
    portfolioEntries: [],
    practiceLocation: {
      address: '',
      areaId: '',
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      label: '',
    },
    rating: 0,
    recentActivities: [],
    responseTime: '',
    reviews: '',
    services: [],
    slug: '',
    specialties: [],
    testimonials: [],
    title: '',
  },
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
