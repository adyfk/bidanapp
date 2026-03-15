export type Screen = 'onboarding' | 'home' | 'detail';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  rating: number;
  reviews: string;
  experience: string;
  patients: string;
  image: string;
}
