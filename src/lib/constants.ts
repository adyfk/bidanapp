import { Doctor } from '@/types';

// --- Konstanta Warna & Tema ---
export const COLORS = {
  primary: '#7B61FF',
  primaryLight: '#9A85FF',
  darkNav: '#1E1E1E',
  textMain: '#111827',
  textMuted: '#6B7280',
  bgLight: '#F9FAFB',
};

// --- Data Mock ---
export const DOCTOR_DATA: Doctor = {
  id: '1',
  name: 'Dr. Omeya Sen',
  specialty: 'Child Specialist',
  hospital: 'Cinbwy Hospital',
  location: 'Ontario',
  rating: 5.0,
  reviews: '120+',
  experience: '8+',
  patients: '200+',
  image: 'https://images.unsplash.com/photo-1594824416928-859427b3d3ab?q=80&w=150&auto=format&fit=crop'
};

export const DOCTORS_NEARBY: Doctor[] = [
  {
    id: '2',
    name: 'Dr. Alex Ben',
    specialty: 'General Specialist',
    hospital: 'Clinic',
    location: 'Ontario',
    rating: 4.0,
    reviews: '90+',
    experience: '6 Years Experience',
    patients: '100+',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=150&auto=format&fit=crop'
  }
];
