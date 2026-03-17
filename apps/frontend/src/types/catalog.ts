export type ServiceDeliveryMode = 'online' | 'home_visit' | 'onsite';
export type OfflineServiceDeliveryMode = Exclude<ServiceDeliveryMode, 'online'>;
export type BookingFlow = 'instant' | 'request';
export type TimeSlotStatus = 'available' | 'limited' | 'booked';
export type ProfessionalGender = 'female' | 'male';
export type ProfessionalAvailabilityWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Area {
  index: number;
  id: string;
  city: string;
  district: string;
  province: string;
  label: string;
  latitude: number;
  longitude: number;
}

export interface ResolvedLocation {
  point: GeoPoint;
  areaId: string;
  areaLabel: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  source: 'mock';
  precision: 'district';
}

export interface ServiceModeFlags {
  online: boolean;
  homeVisit: boolean;
  onsite: boolean;
}

export interface Category {
  index: number;
  id: string;
  name: string;
  shortLabel: string;
  description?: string;
  image: string;
  iconImage: string;
  coverImage?: string;
  accentColor: string;
  overviewPoints: string[];
}

export interface GlobalService {
  index: number;
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  image: string;
  coverImage: string;
  defaultMode: ServiceDeliveryMode;
  serviceModes: ServiceModeFlags;
  tags: string[];
  highlights: string[];
}

export interface ProfessionalService {
  index: number;
  id: string;
  serviceId: string;
  duration: string;
  price: string;
  serviceModes: ServiceModeFlags;
  defaultMode: ServiceDeliveryMode;
  bookingFlow: BookingFlow;
  summary?: string;
}

export interface ProfessionalAvailabilityTimeSlot {
  index: number;
  id: string;
  label: string;
  note?: string;
  status: TimeSlotStatus;
}

export interface ProfessionalAvailabilityDay {
  index: number;
  id: string;
  label: string;
  dateIso: string;
  slots: ProfessionalAvailabilityTimeSlot[];
}

export interface ProfessionalWeeklyAvailabilityWindow {
  endTime: string;
  id: string;
  index: number;
  isEnabled: boolean;
  slotIntervalMinutes: number;
  startTime: string;
  weekday: ProfessionalAvailabilityWeekday;
}

export interface ProfessionalAvailabilityDateOverride {
  dateIso: string;
  endTime?: string;
  id: string;
  index: number;
  isClosed: boolean;
  note?: string;
  slotIntervalMinutes?: number;
  startTime?: string;
}

export interface ProfessionalAvailabilityRules {
  dateOverrides: ProfessionalAvailabilityDateOverride[];
  minimumNoticeHours: number;
  weeklyHours: ProfessionalWeeklyAvailabilityWindow[];
}

export interface ProfessionalCredential {
  index: number;
  title: string;
  issuer: string;
  year: string;
  note: string;
}

export interface ProfessionalStory {
  index: number;
  title: string;
  image: string;
  capturedAt: string;
  location: string;
  note: string;
}

export interface ProfessionalPortfolioEntry {
  id: string;
  index: number;
  title: string;
  serviceId?: string;
  periodLabel: string;
  summary: string;
  outcomes: string[];
  image: string;
}

export interface ProfessionalGalleryItem {
  id: string;
  index: number;
  image: string;
  alt: string;
  label: string;
}

export interface ProfessionalTestimonial {
  index: number;
  author: string;
  role: string;
  rating: number;
  dateLabel: string;
  quote: string;
  serviceId?: string;
  image: string;
}

export interface ProfessionalFeedbackSummary {
  recommendationRate: string;
  repeatClientRate: string;
}

export interface ProfessionalFeedbackMetric {
  index: number;
  label: string;
  value: string;
  detail: string;
}

export interface ProfessionalFeedbackBreakdown {
  index: number;
  label: string;
  total: string;
  percentage: number;
}

export interface ProfessionalRecentActivity {
  index: number;
  dateLabel: string;
  title: string;
  channel: string;
  summary: string;
}

export interface ProfessionalAvailability {
  isAvailable: boolean;
}

export interface ProfessionalPracticeLocation {
  label: string;
  address: string;
  areaId: string;
  coordinates: GeoPoint;
}

export interface ProfessionalCoverage {
  areaIds: string[];
  homeVisitRadiusKm: number;
  center: GeoPoint;
}

export interface Professional {
  index: number;
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
  coverImage?: string;
  badgeLabel: string;
  availability: ProfessionalAvailability;
  responseTime: string;
  specialties: string[];
  languages: string[];
  practiceLocation?: ProfessionalPracticeLocation;
  coverage: ProfessionalCoverage;
  about: string;
  credentials: ProfessionalCredential[];
  activityStories: ProfessionalStory[];
  portfolioEntries: ProfessionalPortfolioEntry[];
  gallery: ProfessionalGalleryItem[];
  testimonials: ProfessionalTestimonial[];
  feedbackSummary: ProfessionalFeedbackSummary;
  feedbackMetrics: ProfessionalFeedbackMetric[];
  feedbackBreakdown: ProfessionalFeedbackBreakdown[];
  recentActivities: ProfessionalRecentActivity[];
  availabilityRulesByMode?: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>>;
  services: ProfessionalService[];
}
