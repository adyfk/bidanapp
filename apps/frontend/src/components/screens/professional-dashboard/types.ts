import type {
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedService,
  ProfessionalRequestStatus,
} from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';

export type RequestFilter = ProfessionalRequestStatus;

export interface ServiceDraft {
  bookingFlow: ProfessionalManagedService['bookingFlow'];
  defaultMode: ServiceDeliveryMode;
  duration: string;
  featured: boolean;
  leadTimeHours: string;
  price: string;
  serviceModes: ProfessionalManagedService['serviceModes'];
  summary: string;
  weeklyCapacity: string;
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
  monthlyCapacity: string;
  practiceAddress: string;
  practiceLabel: string;
  practiceModes: ServiceDeliveryMode[];
  publicBio: string;
  responseTimeGoal: string;
}

export interface ReadinessItem {
  id: string;
  label: string;
  value: string;
}

export interface NextAvailableSchedule {
  dayLabel: string;
  mode: 'home_visit' | 'onsite';
  serviceId: string;
  slotLabel: string;
}

export interface RequestStatusDraft {
  customerSummary: string;
  evidenceNote: string;
  evidenceUrl: string;
  nextStatus: ProfessionalRequestStatus;
}
