import type {
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalRequestStatus,
} from '@/lib/use-professional-portal';
import type { ProfessionalAvailabilityDay, ServiceDeliveryMode } from '@/types/catalog';

export type RequestFilter = ProfessionalRequestStatus;

export interface ServiceDraft {
  bookingFlow: ProfessionalManagedService['bookingFlow'];
  defaultMode: ServiceDeliveryMode;
  duration: string;
  featured: boolean;
  price: string;
  serviceModes: ProfessionalManagedService['serviceModes'];
  summary: string;
}

export interface AvailabilityDraft {
  availabilityByMode?: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>>;
}

export interface PortfolioDraft {
  image: string;
  outcomesText: string;
  periodLabel: string;
  serviceId: string;
  summary: string;
  title: string;
  visibility: ProfessionalManagedPortfolioEntry['visibility'];
}

export interface GalleryDraft {
  alt: string;
  image: string;
  isFeatured: boolean;
  label: string;
}

export interface CoverageDraft {
  acceptingNewClients: boolean;
  autoApproveInstantBookings: boolean;
  city: string;
  coverageAreaIds: string[];
  homeVisitRadiusKm: string;
  latitude: string;
  longitude: string;
  practiceAddress: string;
  practiceLabel: string;
  publicBio: string;
  responseTimeGoal: string;
}

export interface RequestStatusDraft {
  customerSummary: string;
  evidenceNote: string;
  evidenceUrl: string;
  nextStatus: ProfessionalRequestStatus;
}
