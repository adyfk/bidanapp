import type { AppointmentStatus } from './appointments';
import type { Category, GlobalService, Professional, ServiceType } from './catalog';
import type { ChatThread } from './chat';

export type Screen = 'onboarding' | 'home' | 'detail';

export interface CurrentUser {
  index: number;
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

export interface SharedContext {
  index: number;
  id: string;
  currentArea: string;
  onlineStatusLabel: string;
}

export interface HomeFeaturedAppointmentSeed {
  dateLabel: string;
  timeLabel: string;
  professionalId: string;
}

export interface HomeScenarioSeed {
  index: number;
  id: string;
  title: string;
  currentUserId: string;
  sharedContextId: string;
  featuredAppointment?: HomeFeaturedAppointmentSeed;
  popularServiceIds: string[];
  nearbyProfessionalIds: string[];
}

export interface HomeScenario {
  id: string;
  title: string;
  currentUser: CurrentUser;
  sharedContext: SharedContext;
  featuredAppointment?: {
    dateLabel: string;
    timeLabel: string;
    professional: Professional;
  };
  popularServices: GlobalService[];
  nearbyProfessionals: Professional[];
}

export interface MediaPreset {
  index: number;
  id: string;
  label: string;
  onboardingHeroImage: string;
  onboardingHeroAlt: string;
  serviceDetailCoverImage: string;
  professionalMapBackgroundImage: string;
}

export interface ProfessionalDetailScenario {
  index: number;
  id: string;
  label: string;
  distance: string;
  travelTime: string;
  addressLine1: string;
  addressLine2: string;
}

export interface ReviewPreset {
  title: string;
  titleTemplate: string;
  helperText: string;
  photoLabel: string;
  photoButtonLabel: string;
  reviewLabel: string;
  reviewPlaceholder: string;
  submitLabel: string;
  uploadAlert: string;
  successAlert: string;
}

export interface ProfessionalProfilePreset {
  storiesTitle: string;
  portfolioStatsTitle: string;
  portfolioEntriesTitle: string;
  galleryTitle: string;
  testimonialsTitle: string;
  feedbackTitle: string;
  credentialsTitle: string;
  recentActivityTitle: string;
  serviceSectionTitle: string;
  availabilityLabel: string;
  responseTimeLabel: string;
  languagesLabel: string;
  totalReviewsLabel: string;
  recommendationLabel: string;
  repeatClientsLabel: string;
}

export interface AppointmentFieldLabels {
  status: string;
  time: string;
  location: string;
  service: string;
  totalPayment: string;
}

export interface AppointmentActionLabels {
  detail: string;
  cancel: string;
  payNow: string;
}

export interface MessagePreset {
  index: number;
  id: string;
  label: string;
  booking: Record<ServiceType, string>;
  chatAutoReply: string;
  paymentSuccessAlert: string;
  chatSentAlert: string;
  appointmentDetailTitle: string;
  appointmentNotFoundMessage: string;
  appointmentBackLabel: string;
  appointmentWelcomeTemplate: string;
  appointmentChatDayLabel: string;
  appointmentChatInputPlaceholder: string;
  appointmentFieldLabels: AppointmentFieldLabels;
  appointmentActionLabels: AppointmentActionLabels;
  appointmentStatusBanners: Partial<Record<AppointmentStatus, string>>;
  homeEmptyStateTitle: string;
  homeEmptyStateDescription: string;
  homeEmptyStateAction: string;
  serviceHighlightsTitle: string;
  professionalProfile: ProfessionalProfilePreset;
  exploreSortOptions: string[];
  exploreGenderOptions: string[];
  review: ReviewPreset;
}

export interface UiSimulationFile {
  appSections?: {
    homeCategoryIds?: string[];
    featuredProfessionalIds?: string[];
  };
  currentUsers: CurrentUser[];
  sharedContexts: SharedContext[];
  homeScenarios: HomeScenarioSeed[];
  mediaPresets: MediaPreset[];
  professionalDetailScenarios: ProfessionalDetailScenario[];
  messagePresets: MessagePreset[];
  active: {
    currentUserId: string;
    sharedContextId: string;
    homeScenarioId: string;
    mediaPresetId: string;
    professionalDetailScenarioId: string;
    messagePresetId: string;
  };
}

export interface SimulationCatalog {
  categories: Category[];
  services: GlobalService[];
  professionals: Professional[];
}

export interface SimulationCollections {
  directThreads: ChatThread[];
  appointmentThreads: ChatThread[];
}
