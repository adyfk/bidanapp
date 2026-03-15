import type { AppointmentStatus } from '@/types/appointments';

export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'requested',
  'approved_waiting_payment',
  'paid',
  'confirmed',
  'in_service',
];

export const HISTORY_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'completed',
  'cancelled',
  'rejected',
  'expired',
];

export const getStatusBannerClasses = (status: AppointmentStatus) => {
  if (status === 'requested') return 'bg-orange-50 border-orange-100 text-orange-800';
  if (status === 'paid' || status === 'confirmed' || status === 'in_service') return 'bg-green-50 border-green-100 text-green-800';
  if (status === 'cancelled' || status === 'expired') return 'bg-gray-100 border-gray-200 text-gray-700';
  if (status === 'rejected') return 'bg-red-50 border-red-100 text-red-700';
  return 'bg-gray-100 border-gray-200 text-gray-700';
};
