import type { AppointmentStatus } from './appointments';
import type { BookingFlow, ProfessionalGender, ServiceDeliveryMode, TimeSlotStatus } from './catalog';
import type { ChatSender } from './chat';

export interface IndexedRow {
  index: number;
}

export interface ProfessionalRow extends IndexedRow {
  id: string;
  slug: string;
  name: string;
  title: string;
  gender: ProfessionalGender;
  location: string;
  rating: number;
  reviews: string;
  experience: string;
  clientsServed: string;
  image: string;
  coverImage: string | null;
  badgeLabel: string;
  isAvailable: boolean;
  responseTime: string;
  about: string;
}

export interface ProfessionalLabelRow extends IndexedRow {
  id: string;
  professionalId: string;
  label: string;
}

export interface ProfessionalPracticeLocationRow extends IndexedRow {
  id: string;
  professionalId: string;
  label: string;
  address: string;
  areaId: string;
  latitude: number;
  longitude: number;
}

export interface ProfessionalCoveragePolicyRow extends IndexedRow {
  id: string;
  professionalId: string;
  homeVisitRadiusKm: number;
  centerLatitude: number;
  centerLongitude: number;
}

export interface ProfessionalCoverageAreaRow extends IndexedRow {
  id: string;
  professionalId: string;
  areaId: string;
}

export interface ProfessionalCredentialRow extends IndexedRow {
  id: string;
  professionalId: string;
  title: string;
  issuer: string;
  year: string;
  note: string;
}

export interface ProfessionalActivityStoryRow extends IndexedRow {
  id: string;
  professionalId: string;
  title: string;
  image: string;
  capturedAt: string;
  location: string;
  note: string;
}

export interface ProfessionalPortfolioEntryRow extends IndexedRow {
  id: string;
  professionalId: string;
  title: string;
  serviceId: string | null;
  periodLabel: string;
  summary: string;
  outcomes: string[];
  image: string;
}

export interface ProfessionalGalleryItemRow extends IndexedRow {
  id: string;
  professionalId: string;
  image: string;
  alt: string;
  label: string;
}

export interface ProfessionalTestimonialRow extends IndexedRow {
  id: string;
  professionalId: string;
  author: string;
  role: string;
  rating: number;
  dateLabel: string;
  quote: string;
  serviceId: string | null;
  image: string;
}

export interface ProfessionalFeedbackSummaryRow extends IndexedRow {
  id: string;
  professionalId: string;
  recommendationRate: string;
  repeatClientRate: string;
}

export interface ProfessionalFeedbackMetricRow extends IndexedRow {
  id: string;
  professionalId: string;
  label: string;
  value: string;
  detail: string;
}

export interface ProfessionalFeedbackBreakdownRow extends IndexedRow {
  id: string;
  professionalId: string;
  label: string;
  total: string;
  percentage: number;
}

export interface ProfessionalRecentActivityRow extends IndexedRow {
  id: string;
  professionalId: string;
  dateLabel: string;
  title: string;
  channel: string;
  summary: string;
}

export interface ProfessionalServiceOfferingRow extends IndexedRow {
  id: string;
  professionalId: string;
  serviceId: string;
  duration: string;
  price: string;
  defaultMode: ServiceDeliveryMode;
  bookingFlow: BookingFlow;
  summary: string | null;
  supportsOnline: boolean;
  supportsHomeVisit: boolean;
  supportsOnsite: boolean;
}

export interface ProfessionalServiceScheduleDayRow extends IndexedRow {
  id: string;
  professionalId: string;
  serviceOfferingId: string;
  serviceId: string;
  mode: Exclude<ServiceDeliveryMode, 'online'>;
  label: string;
  dateIso: string;
}

export interface ProfessionalServiceTimeSlotRow extends IndexedRow {
  id: string;
  professionalId: string;
  serviceOfferingId: string;
  serviceId: string;
  scheduleDayId: string;
  mode: Exclude<ServiceDeliveryMode, 'online'>;
  label: string;
  note: string | null;
  status: TimeSlotStatus;
}

export interface ConsumerRow extends IndexedRow {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

export interface UserContextRow extends IndexedRow {
  id: string;
  selectedAreaId: string;
  userLatitude: number;
  userLongitude: number;
  onlineStatusLabel: string;
}

export interface HomeFeedSnapshotRow extends IndexedRow {
  id: string;
  title: string;
  consumerId: string;
  userContextId: string;
}

export interface HomeFeedFeaturedAppointmentRow extends IndexedRow {
  id: string;
  homeFeedId: string;
  appointmentId: string;
  dateLabel: string;
  timeLabel: string;
  professionalId: string;
}

export interface HomeFeedRelationRow extends IndexedRow {
  id: string;
  homeFeedId: string;
}

export interface HomeFeedPopularServiceRow extends HomeFeedRelationRow {
  serviceId: string;
}

export interface HomeFeedNearbyProfessionalRow extends HomeFeedRelationRow {
  professionalId: string;
}

export interface AppSectionConfigRow extends IndexedRow {
  id: string;
  section: string;
  configKey: string;
  entityType: 'category' | 'professional';
  entityId: string;
}

export interface MediaPresetRow extends IndexedRow {
  id: string;
  label: string;
  onboardingHeroImage: string;
  onboardingHeroAlt: string;
  serviceDetailCoverImage: string;
  professionalMapBackgroundImage: string;
}

export interface AppointmentRow extends IndexedRow {
  id: string;
  consumerId: string;
  professionalId: string;
  serviceId: string;
  status: AppointmentStatus;
  scheduledTimeLabel: string;
  totalPriceLabel: string;
}

export interface ChatThreadRow extends IndexedRow {
  id: string;
  threadType: 'direct' | 'appointment';
  professionalId: string | null;
  appointmentId: string | null;
  dayLabel: string;
  inputPlaceholder: string;
  autoReplyText: string | null;
}

export interface ChatMessageRow extends IndexedRow {
  id: string;
  threadId: string;
  sourceMessageId: number;
  sender: ChatSender;
  text: string;
  timeLabel: string;
  isRead: boolean;
}

export interface AppRuntimeSelectionRow extends IndexedRow {
  id: string;
  currentConsumerId: string;
  currentUserContextId: string;
  activeHomeFeedId: string;
  activeMediaPresetId: string;
}
