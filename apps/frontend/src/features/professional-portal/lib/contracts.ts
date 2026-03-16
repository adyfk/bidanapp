import type {
  BookingFlow,
  GeoPoint,
  ProfessionalGalleryItem,
  ProfessionalPortfolioEntry,
  ProfessionalService,
  ServiceDeliveryMode,
} from '@/types/catalog';

export const PROFESSIONAL_PORTAL_SCHEMA_VERSION = 2;

export const PROFESSIONAL_PORTAL_API_ENDPOINTS = {
  coverage: '/professionals/me/coverage',
  gallery: '/professionals/me/gallery',
  profile: '/professionals/me/profile',
  requests: '/professionals/me/requests',
  services: '/professionals/me/services',
  setup: '/professionals/me/setup',
  session: '/professionals/portal/session',
  portfolio: '/professionals/me/portfolio',
} as const;

export type ProfessionalPortalDataSource = 'api' | 'local';
export type ProfessionalRequestStatus = 'new' | 'quoted' | 'scheduled' | 'completed';
export type ProfessionalRequestPriority = 'high' | 'medium' | 'low';

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
  leadTimeHours: number;
  source: 'existing' | 'template';
  summary: string;
  weeklyCapacity: number;
}

export interface ProfessionalManagedPortfolioEntry extends ProfessionalPortfolioEntry {
  visibility: 'private' | 'public';
}

export interface ProfessionalManagedGalleryItem extends ProfessionalGalleryItem {
  isFeatured: boolean;
}

export interface ProfessionalManagedRequest {
  areaId: string;
  budgetLabel: string;
  channel: string;
  clientId: string;
  clientName: string;
  id: string;
  note: string;
  priority: ProfessionalRequestPriority;
  requestedAt: string;
  requestedAtLabel: string;
  requestedMode: ServiceDeliveryMode;
  serviceId: string;
  status: ProfessionalRequestStatus;
  statusHistory: ProfessionalRequestStatusEvidence[];
}

export interface ProfessionalPortalState {
  acceptingNewClients: boolean;
  activeProfessionalId: string;
  autoApproveInstantBookings: boolean;
  city: string;
  coverageAreaIds: string[];
  coverageCenter: GeoPoint;
  credentialNumber: string;
  displayName: string;
  galleryItems: ProfessionalManagedGalleryItem[];
  homeVisitRadiusKm: number;
  monthlyCapacity: number;
  onboardingCompleted: boolean;
  phone: string;
  portfolioEntries: ProfessionalManagedPortfolioEntry[];
  practiceAddress: string;
  practiceLabel: string;
  practiceModes: ServiceDeliveryMode[];
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

export interface ProfessionalSetupInput {
  coverageAreaIds: string[];
  practiceModes: ServiceDeliveryMode[];
  yearsExperience: string;
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
    | 'monthlyCapacity'
    | 'phone'
    | 'practiceAddress'
    | 'practiceLabel'
    | 'practiceModes'
    | 'publicBio'
    | 'responseTimeGoal'
  >
>;

export interface ProfessionalPortalSnapshot {
  requestBoardsByProfessionalId?: Record<string, ProfessionalManagedRequest[]>;
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
  budgetLabel: string;
  channel: string;
  note: string;
  priority?: ProfessionalRequestPriority;
  professionalId: string;
  requestedMode: ServiceDeliveryMode;
  serviceId: string;
}

export interface ProfessionalPortalServiceCommand {
  bookingFlow: BookingFlow;
  defaultMode: ServiceDeliveryMode;
  duration: string;
  featured: boolean;
  isActive: boolean;
  leadTimeHours: number;
  price: string;
  serviceId: string;
  summary: string;
  weeklyCapacity: number;
}
