export type ServiceType = 'visit' | 'consultation';

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
  type: ServiceType;
  image: string;
  coverImage: string;
  badge: string;
  tags: string[];
  highlights: string[];
}

export interface ProfessionalService {
  index: number;
  serviceId: string;
  duration: string;
  price: string;
  summary?: string;
}

export interface ProfessionalPortfolioStat {
  index: number;
  label: string;
  value: string;
  detail: string;
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
  index: number;
  title: string;
  serviceId?: string;
  periodLabel: string;
  summary: string;
  outcomes: string[];
  image: string;
}

export interface ProfessionalGalleryItem {
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

export interface Professional {
  index: number;
  id: string;
  slug: string;
  name: string;
  title: string;
  categoryId: string;
  location: string;
  rating: number;
  reviews: string;
  experience: string;
  clientsServed: string;
  image: string;
  coverImage?: string;
  badgeLabel: string;
  availabilityLabel: string;
  responseTime: string;
  specialties: string[];
  languages: string[];
  addressLines: string[];
  about: string;
  portfolioStats: ProfessionalPortfolioStat[];
  credentials: ProfessionalCredential[];
  activityStories: ProfessionalStory[];
  portfolioEntries: ProfessionalPortfolioEntry[];
  gallery: ProfessionalGalleryItem[];
  testimonials: ProfessionalTestimonial[];
  feedbackSummary: ProfessionalFeedbackSummary;
  feedbackMetrics: ProfessionalFeedbackMetric[];
  feedbackBreakdown: ProfessionalFeedbackBreakdown[];
  recentActivities: ProfessionalRecentActivity[];
  services: ProfessionalService[];
}

export interface CatalogSimulationFile {
  categories: Category[];
  services: GlobalService[];
  professionals: Professional[];
}
