import catalogData from '@/data/simulation/catalog.json';
import type { CatalogSimulationFile, Category, GlobalService, Professional } from '@/types/catalog';

const data = catalogData as CatalogSimulationFile;
const sortByIndex = <T extends { index: number }>(items: T[]) => [...items].sort((left, right) => left.index - right.index);

export const MOCK_CATEGORIES: Category[] = sortByIndex(data.categories);
export const MOCK_SERVICES: GlobalService[] = sortByIndex(data.services);
export const MOCK_PROFESSIONALS: Professional[] = sortByIndex(
  data.professionals.map((professional) => ({
    ...professional,
    portfolioStats: sortByIndex(professional.portfolioStats),
    credentials: sortByIndex(professional.credentials),
    activityStories: sortByIndex(professional.activityStories),
    portfolioEntries: sortByIndex(professional.portfolioEntries),
    gallery: sortByIndex(professional.gallery),
    testimonials: sortByIndex(professional.testimonials),
    feedbackMetrics: sortByIndex(professional.feedbackMetrics),
    feedbackBreakdown: sortByIndex(professional.feedbackBreakdown),
    recentActivities: sortByIndex(professional.recentActivities),
    services: sortByIndex(professional.services),
  }))
);

const categoriesById = new Map(MOCK_CATEGORIES.map((category) => [category.id, category]));
const servicesById = new Map(MOCK_SERVICES.map((service) => [service.id, service]));
const servicesBySlug = new Map(MOCK_SERVICES.map((service) => [service.slug, service]));
const professionalsById = new Map(MOCK_PROFESSIONALS.map((professional) => [professional.id, professional]));
const professionalsBySlug = new Map(MOCK_PROFESSIONALS.map((professional) => [professional.slug, professional]));

export const getCategoryById = (categoryId: string) => categoriesById.get(categoryId);
export const getServiceById = (serviceId: string) => servicesById.get(serviceId);
export const getServiceBySlug = (serviceSlug: string) => servicesBySlug.get(serviceSlug);
export const getProfessionalById = (professionalId: string) => professionalsById.get(professionalId);
export const getProfessionalBySlug = (professionalSlug: string) => professionalsBySlug.get(professionalSlug);

export const getProvidersForService = (serviceId: string) =>
  sortByIndex(
    MOCK_PROFESSIONALS.filter((professional) =>
      professional.services.some((service) => service.serviceId === serviceId)
    )
  );

export const CONSULTATION_SERVICES = MOCK_SERVICES.filter((service) => service.type === 'consultation');
export const SERVICES_WITHOUT_PROVIDERS = MOCK_SERVICES.filter((service) => getProvidersForService(service.id).length === 0);
