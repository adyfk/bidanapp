export type Screen = 'onboarding' | 'home' | 'detail';

export interface Category {
  id: string; // e.g. "newborn", "stroke", "sunnah"
  name: string; // "Newborn", "Stroke", "Sunnah"
  description?: string;
}

export interface GlobalService {
  id: string;
  slug: string;
  name: string; // "Pijat Bayi", "Bekam"
  categoryId: string; // Belongs to a Category
  description: string;
}

export interface ProfessionalService {
  serviceId: string; // References GlobalService.id
  duration: string;
  price: string;
}

export interface Professional {
  id: string;
  slug: string;
  name: string;
  categoryId: string; // Renamed from category to link to Category.id
  location: string;
  rating: number;
  reviews: string; // e.g., "120+"
  experience: string; // e.g., "8+"
  clientsServed: string; // generalized from patients
  image: string;
  about: string; // Description field
  services: ProfessionalService[]; // Mapping to Global Services
}
