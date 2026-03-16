import type { Appointment } from './appointments';
import type { Area, GeoPoint, GlobalService, Professional } from './catalog';

export interface ConsumerProfile {
  index: number;
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

export interface UserContext {
  index: number;
  id: string;
  area: Area;
  currentArea: string;
  userLocation: GeoPoint;
  onlineStatusLabel: string;
}

export interface HomeFeedSnapshot {
  id: string;
  title: string;
  currentUser: ConsumerProfile;
  sharedContext: UserContext;
  featuredAppointment?: {
    appointment: Appointment;
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
