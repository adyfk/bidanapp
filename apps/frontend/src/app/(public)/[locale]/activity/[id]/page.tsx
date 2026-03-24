'use client';

import { useParams } from 'next/navigation';
import { AppointmentDetailExperience } from '@/features/appointments/components/AppointmentDetailExperience';
import { useRouter } from '@/i18n/routing';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!appointmentId) {
    return null;
  }

  return <AppointmentDetailExperience appointmentId={appointmentId} onBack={() => router.back()} />;
}
