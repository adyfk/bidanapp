'use client';

import { useTranslations } from 'next-intl';
import {
  type AppointmentStatusFilter,
  type AppointmentTab,
  getAppointmentStatusFilterOptions,
} from '@/features/appointments/lib/status';
import { APP_CONFIG } from '@/lib/config';
import type { Appointment } from '@/types/appointments';

interface AppointmentsStatusFiltersProps {
  activeTab: AppointmentTab;
  appointments: Appointment[];
  statusFilter: AppointmentStatusFilter;
  onChange: (value: AppointmentStatusFilter) => void;
}

export const AppointmentsStatusFilters = ({
  activeTab,
  appointments,
  statusFilter,
  onChange,
}: AppointmentsStatusFiltersProps) => {
  const t = useTranslations('Appointments');
  const statusOptions = getAppointmentStatusFilterOptions(activeTab);

  return (
    <div className="mb-5 flex gap-3 overflow-x-auto px-5 pb-1 custom-scrollbar">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold whitespace-nowrap transition-all ${
          statusFilter === 'all'
            ? 'border-transparent text-white shadow-md'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
        style={{ backgroundColor: statusFilter === 'all' ? APP_CONFIG.colors.primary : undefined }}
      >
        {t('allStatuses')}
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${statusFilter === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}
        >
          {appointments.length}
        </span>
      </button>

      {statusOptions.map((status) => {
        const count = appointments.filter((appointment) => appointment.status === status).length;
        const isActive = statusFilter === status;

        return (
          <button
            type="button"
            key={status}
            onClick={() => onChange(status)}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold whitespace-nowrap transition-all ${
              isActive
                ? 'border-transparent text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={{ backgroundColor: isActive ? APP_CONFIG.colors.primary : undefined }}
          >
            {t(`status.${status}`)}
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
