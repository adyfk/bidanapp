'use client';

import { useTranslations } from 'next-intl';
import { filterChipClass } from '@/components/ui/tokens';
import {
  type AppointmentStatusFilter,
  type AppointmentTab,
  getAppointmentStatusFilterOptions,
} from '@/features/appointments/lib/status';
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
        className={`flex items-center justify-center gap-2 whitespace-nowrap ${filterChipClass(statusFilter === 'all')}`}
      >
        {t('allStatuses')}
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${statusFilter === 'all' ? 'bg-white/70 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
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
            className={`flex items-center justify-center gap-2 whitespace-nowrap ${filterChipClass(isActive)}`}
          >
            {t(`status.${status}`)}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/70 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
