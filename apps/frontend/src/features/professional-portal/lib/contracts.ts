import type {
  AppointmentScheduleSnapshot,
  AppointmentServiceSnapshot,
  AppointmentStatus,
  AppointmentTimelineEvent,
} from '@/types/appointments';
import type {
  BookingFlow,
  GeoPoint,
  OfflineServiceDeliveryMode,
  ProfessionalAvailabilityRules,
  ProfessionalCredential,
  ProfessionalGalleryItem,
  ProfessionalPortfolioEntry,
  ProfessionalService,
  ProfessionalStory,
  ServiceDeliveryMode,
} from '@/types/catalog';

export const PROFESSIONAL_PORTAL_SCHEMA_VERSION = 9;

export const PROFESSIONAL_PORTAL_API_ENDPOINTS = {
  coverage: '/professionals/me/coverage',
  gallery: '/professionals/me/gallery',
  profile: '/professionals/me/profile',
  requests: '/professionals/me/requests',
  services: '/professionals/me/services',
  session: '/professionals/portal/session',
  portfolio: '/professionals/me/portfolio',
} as const;

export type ProfessionalPortalDataSource = 'api' | 'local';
export type ProfessionalRequestStatus = 'new' | 'quoted' | 'scheduled' | 'completed';
export type ProfessionalRequestPriority = 'high' | 'medium' | 'low';
export type ProfessionalLifecycleStatus =
  | 'draft'
  | 'ready_for_review'
  | 'submitted'
  | 'changes_requested'
  | 'verified'
  | 'published';

export interface ProfessionalLifecycleReviewState {
  adminNote?: string;
  publishedAt?: string;
  reviewedAt?: string;
  reviewerName?: string;
  status: ProfessionalLifecycleStatus;
  submittedAt?: string;
}

export interface ProfessionalRequestStatusEvidence {
  createdAt: string;
  createdAtLabel: string;
  customerSummary?: string;
  evidenceNote?: string;
  evidenceUrl?: string;
  fromStatus: ProfessionalRequestStatus;
  id: string;
  status: ProfessionalRequestStatus;
}

export interface ProfessionalManagedService extends Omit<ProfessionalService, 'summary'> {
  featured: boolean;
  isActive: boolean;
  source: 'existing' | 'template';
  summary: string;
}

export interface ProfessionalManagedPortfolioEntry extends ProfessionalPortfolioEntry {
  visibility: 'private' | 'public';
}

export interface ProfessionalManagedGalleryItem extends ProfessionalGalleryItem {
  isFeatured: boolean;
}

export interface ProfessionalManagedCredential extends ProfessionalCredential {
  id: string;
}

export interface ProfessionalManagedActivityStory extends ProfessionalStory {
  id: string;
}

export interface ProfessionalManagedRequest {
  appointmentId: string;
  areaId: string;
  budgetLabel: string;
  bookingFlow: BookingFlow;
  clientId: string;
  clientName: string;
  customerStatus: AppointmentStatus;
  id: string;
  note: string;
  priority: ProfessionalRequestPriority;
  requestedAt: string;
  requestedAtLabel: string;
  requestedMode: ServiceDeliveryMode;
  scheduledTimeLabel: string;
  serviceId: string;
  serviceName: string;
  serviceOfferingId: string;
  serviceSummary: string;
  status: ProfessionalRequestStatus;
  statusHistory: ProfessionalRequestStatusEvidence[];
}

export interface ProfessionalManagedAppointmentRecord {
  areaId: string;
  bookingFlow: BookingFlow;
  consumerId: string;
  id: string;
  index: number;
  professionalId: string;
  requestNote: string;
  requestedAt: string;
  requestedMode: ServiceDeliveryMode;
  scheduleSnapshot: AppointmentScheduleSnapshot;
  serviceId: string;
  serviceOfferingId: string;
  serviceSnapshot: AppointmentServiceSnapshot;
  status: AppointmentStatus;
  timeline: AppointmentTimelineEvent[];
}

export interface ProfessionalPortalState {
  acceptingNewClients: boolean;
  activeProfessionalId: string;
  activityStories: ProfessionalManagedActivityStory[];
  availabilityRulesByMode?: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>>;
  autoApproveInstantBookings: boolean;
  city: string;
  coverageAreaIds: string[];
  credentials: ProfessionalManagedCredential[];
  coverageCenter: GeoPoint;
  credentialNumber: string;
  displayName: string;
  galleryItems: ProfessionalManagedGalleryItem[];
  homeVisitRadiusKm: number;
  phone: string;
  portfolioEntries: ProfessionalManagedPortfolioEntry[];
  practiceAddress: string;
  practiceLabel: string;
  publicBio: string;
  requestBoard: ProfessionalManagedRequest[];
  responseTimeGoal: string;
  serviceConfigurations: ProfessionalManagedService[];
  yearsExperience: string;
}

export interface ProfessionalAccessDraft {
  city?: string;
  credentialNumber?: string;
  displayName?: string;
  phone: string;
  professionalId: string;
}

export type SaveBusinessSettingsInput = Partial<
  Pick<
    ProfessionalPortalState,
    | 'acceptingNewClients'
    | 'autoApproveInstantBookings'
    | 'city'
    | 'coverageAreaIds'
    | 'coverageCenter'
    | 'credentialNumber'
    | 'displayName'
    | 'homeVisitRadiusKm'
    | 'phone'
    | 'practiceAddress'
    | 'practiceLabel'
    | 'publicBio'
    | 'responseTimeGoal'
  >
>;

export interface ProfessionalPortalSnapshot {
  appointmentRecordsByProfessionalId?: Record<string, ProfessionalManagedAppointmentRecord[]>;
  requestBoardsByProfessionalId?: Record<string, ProfessionalManagedRequest[]>;
  reviewStatesByProfessionalId?: Record<string, ProfessionalLifecycleReviewState>;
  savedAt: string;
  schemaVersion: typeof PROFESSIONAL_PORTAL_SCHEMA_VERSION;
  state: ProfessionalPortalState;
}

export interface UpdateRequestStatusInput {
  customerSummary?: string;
  evidenceNote?: string;
  evidenceUrl?: string;
}

export interface CreateCustomerRequestInput {
  note: string;
  priority?: ProfessionalRequestPriority;
  professionalId: string;
  requestedMode: ServiceDeliveryMode;
  scheduleDayId?: string;
  scheduledTimeLabel?: string;
  serviceId: string;
  serviceOfferingId: string;
  timeSlotId?: string;
}

export interface ProfessionalPortalServiceCommand {
  bookingFlow: BookingFlow;
  defaultMode: ServiceDeliveryMode;
  duration: string;
  featured: boolean;
  isActive: boolean;
  price: string;
  serviceId: string;
  summary: string;
}
