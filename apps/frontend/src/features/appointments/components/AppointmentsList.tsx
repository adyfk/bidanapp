'use client';

import { Activity, History } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getAppointmentStatusChipClassName } from '@/features/appointments/lib/status';
import { APP_CONFIG } from '@/lib/config';
import { useUiText } from '@/lib/ui-text';
import type { Appointment } from '@/types/appointments';

interface AppointmentsListProps {
  activeTab: 'active' | 'history';
  appointments: Appointment[];
  onSelect: (appointmentId: string) => void;
}

export const AppointmentsList = ({ activeTab, appointments, onSelect }: AppointmentsListProps) => {
  const t = useTranslations('Appointments');
  const uiText = useUiText();

  return (
    <div className="px-5">
      {appointments.length > 0 ? (
        <div className="mb-6 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          {appointments.map((appointment, index) => (
            <div
              key={appointment.id}
              onClick={() => onSelect(appointment.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(appointment.id);
                }
              }}
              className={`flex cursor-pointer flex-col p-4 transition-colors active:bg-gray-100 hover:bg-gray-50 sm:p-5 ${
                index !== appointments.length - 1 ? 'border-b border-gray-50' : ''
              }`}
              role="button"
              tabIndex={0}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
                    <Image
                      src={appointment.professional.image}
                      alt={appointment.professional.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold leading-tight text-gray-900">
                      {appointment.professional.name}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-gray-500">{appointment.service.name}</p>
                  </div>
                </div>
                <span
                  className={`rounded-[8px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getAppointmentStatusChipClassName(appointment.status)}`}
                >
                  {t(`status.${appointment.status}`)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-gray-100 bg-gray-50 p-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    className="pointer-events-none rounded-full px-4 py-1.5 text-[13px] font-bold"
                    style={{ color: APP_CONFIG.colors.primary, backgroundColor: APP_CONFIG.colors.primaryLight }}
                  >
                    {uiText.appointmentActionLabels.detail}
                  </button>
                </div>
                <p className="text-right text-[12px] font-medium text-gray-500">{appointment.time}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-300">
            {activeTab === 'history' ? <History className="h-8 w-8" /> : <Activity className="h-8 w-8" />}
          </div>
          <p className="mb-1 text-lg font-bold text-gray-900">{t('noAppointments')}</p>
          <p className="text-sm text-gray-500">{t('trySearching')}</p>
        </div>
      )}
    </div>
  );
};
