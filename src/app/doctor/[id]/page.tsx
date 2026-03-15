import { DoctorDetailScreen } from '@/components/screens/DoctorDetailScreen';
import { DOCTOR_DATA } from '@/lib/constants'; // In a real app, this would be fetched
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Detail - ${DOCTOR_DATA.name} | BidanApp`,
  description: `Book an appointment with ${DOCTOR_DATA.name}, ${DOCTOR_DATA.specialty}.`,
};

export default function DoctorDetailRoute() {
  return <DoctorDetailScreen />;
}
