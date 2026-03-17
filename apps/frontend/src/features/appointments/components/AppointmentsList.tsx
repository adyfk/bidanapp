'use client';

import { Activity, History } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  accentSoftPillClass,
  blushSubtlePanelClass,
  neutralSoftPillClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import { getAppointmentStatusChipClassName } from '@/features/appointments/lib/status';
import { APP_CONFIG } from '@/lib/config';
import type { Appointment } from '@/types/appointments';

interface AppointmentsListProps {
  activeTab: 'active' | 'history';
  appointments: Appointment[];
  onSelect: (appointmentId: string) => void;
}

export const AppointmentsList = ({ activeTab, appointments, onSelect }: AppointmentsListProps) => {
  const t = useTranslations('Appointments');
  const professionalT = useTranslations('Professional');
  const profileT = useTranslations('Profile');

  return (
    <div className="px-5">
      {appointments.length > 0 ? (
        <div className="mb-6 space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              onClick={() => onSelect(appointment.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(appointment.id);
                }
              }}
              className={`${softWhitePanelClass} flex cursor-pointer flex-col p-4 transition-colors active:bg-gray-50 hover:bg-gray-50/80`}
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
                    <p className="mt-1 line-clamp-1 text-[12px] text-gray-400">{appointment.service.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={neutralSoftPillClass}>
                        {appointment.requestedMode === 'online'
                          ? profileT('modeLabels.online')
                          : appointment.requestedMode === 'home_visit'
                            ? profileT('modeLabels.home_visit')
                            : profileT('modeLabels.onsite')}
                      </span>
                      <span
                        className={appointment.bookingFlow === 'instant' ? accentSoftPillClass : neutralSoftPillClass}
                      >
                        {appointment.bookingFlow === 'instant'
                          ? professionalT('bookingFlowInstant')
                          : professionalT('bookingFlowRequest')}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-[8px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getAppointmentStatusChipClassName(appointment.status)}`}
                >
                  {t(`status.${appointment.status}`)}
                </span>
              </div>

              <div className={`${blushSubtlePanelClass} flex items-center justify-between p-3`}>
                <div>
                  <p className="text-[12px] font-medium text-gray-500">{appointment.service.durationLabel}</p>
                  <p className="mt-1 text-[14px] font-bold" style={{ color: APP_CONFIG.colors.primary }}>
                    {appointment.totalPrice}
                  </p>
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
