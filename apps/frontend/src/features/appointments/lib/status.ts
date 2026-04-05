import type { AppointmentStatus } from '@/types/appointments';

export type AppointmentTab = 'active' | 'history';
export type AppointmentStatusFilter = AppointmentStatus | 'all';

export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'requested',
  'awaiting_payment',
  'approved_waiting_payment',
  'paid',
  'confirmed',
  'in_service',
];

export const HISTORY_APPOINTMENT_STATUSES: AppointmentStatus[] = ['completed', 'cancelled', 'rejected', 'expired'];

export const getAppointmentTabForStatus = (status: AppointmentStatus): AppointmentTab =>
  ACTIVE_APPOINTMENT_STATUSES.includes(status) ? 'active' : 'history';

export const getAppointmentStatusFilterOptions = (tab: AppointmentTab): AppointmentStatus[] =>
  tab === 'active' ? ACTIVE_APPOINTMENT_STATUSES : HISTORY_APPOINTMENT_STATUSES;

export const isAppointmentChatAvailable = (status: AppointmentStatus) => ACTIVE_APPOINTMENT_STATUSES.includes(status);

export const isValidAppointmentTab = (value: string | null): value is AppointmentTab =>
  value === 'active' || value === 'history';

export const isValidAppointmentStatusFilter = (value: string | null): value is AppointmentStatus =>
  value !== null &&
  [...ACTIVE_APPOINTMENT_STATUSES, ...HISTORY_APPOINTMENT_STATUSES].includes(value as AppointmentStatus);

export const getAppointmentStatusChipClassName = (status: AppointmentStatus) => {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'requested') return 'bg-orange-100 text-orange-700';
  if (status === 'awaiting_payment' || status === 'approved_waiting_payment') return 'bg-blue-100 text-blue-700';
  if (status === 'paid') return 'bg-cyan-100 text-cyan-700';
  if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'in_service') return 'bg-violet-100 text-violet-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

export const getStatusBannerClasses = (status: AppointmentStatus) => {
  if (status === 'requested') return 'bg-orange-50 border-orange-100 text-orange-800';
  if (status === 'awaiting_payment' || status === 'paid' || status === 'confirmed' || status === 'in_service')
    return 'bg-green-50 border-green-100 text-green-800';
  if (status === 'cancelled' || status === 'expired') return 'bg-gray-100 border-gray-200 text-gray-700';
  if (status === 'rejected') return 'bg-red-50 border-red-100 text-red-700';
  return 'bg-gray-100 border-gray-200 text-gray-700';
};
