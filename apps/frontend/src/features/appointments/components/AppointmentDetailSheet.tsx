'use client';

import { ChevronLeft, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  getAppointmentStatusChipClassName,
  getStatusBannerClasses,
  isAppointmentChatAvailable,
} from '@/features/appointments/lib/status';
import { APP_CONFIG } from '@/lib/config';
import { ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import { useUiText } from '@/lib/ui-text';
import type { Appointment } from '@/types/appointments';

interface AppointmentDetailSheetProps {
  appointment: Appointment;
  onClose: () => void;
  onOpenChat: () => void;
  onOpenReview: () => void;
  onPayNow: () => void;
}

export const AppointmentDetailSheet = ({
  appointment,
  onClose,
  onOpenChat,
  onOpenReview,
  onPayNow,
}: AppointmentDetailSheetProps) => {
  const t = useTranslations('Appointments');
  const uiText = useUiText();
  const statusBanner = uiText.appointmentStatusBanners[appointment.status];
  const canChat = isAppointmentChatAvailable(appointment.status);

  return (
    <div className="fixed inset-y-0 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col bg-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="sticky top-0 z-10 flex items-center border-b border-gray-100 bg-white px-4 py-4">
        <button type="button" onClick={onClose} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900">{uiText.appointmentDetailTitle}</h2>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 pb-24">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              <Image
                src={appointment.professional.image}
                alt={appointment.professional.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">{appointment.professional.name}</h3>
              <p className="text-[12px] font-bold text-green-500">{ACTIVE_USER_CONTEXT.onlineStatusLabel}</p>
            </div>
          </div>
          {canChat ? (
            <button
              type="button"
              onClick={onOpenChat}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors active:scale-95 hover:bg-gray-50"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {uiText.appointmentFieldLabels.status}
              </p>
              <span
                className={`rounded-[8px] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider ${getAppointmentStatusChipClassName(appointment.status)}`}
              >
                {t(`status.${appointment.status}`)}
              </span>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {uiText.appointmentFieldLabels.time}
              </p>
              <p className="text-[14px] font-semibold text-gray-900">{appointment.time}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {uiText.appointmentFieldLabels.location}
              </p>
              <p className="text-[14px] font-semibold text-gray-900">{appointment.professional.location}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {uiText.appointmentFieldLabels.service}
              </p>
              <p className="text-[14px] font-semibold text-gray-900">{appointment.service.name}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">{appointment.service.description}</p>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-4">
              <p className="text-[13px] font-bold text-gray-500">{uiText.appointmentFieldLabels.totalPayment}</p>
              <p className="text-right text-[16px] font-bold text-pink-600">{appointment.totalPrice}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full border-t border-gray-100 bg-white p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        {appointment.status === 'approved_waiting_payment' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              {uiText.appointmentActionLabels.cancel}
            </button>
            <button
              type="button"
              onClick={onPayNow}
              className="flex-1 rounded-xl py-3.5 text-[14px] font-bold text-white shadow-md shadow-pink-500/20 transition-transform active:scale-95"
              style={{ backgroundColor: APP_CONFIG.colors.primary }}
            >
              {uiText.appointmentActionLabels.payNow}
            </button>
          </div>
        ) : null}

        {appointment.status === 'completed' ? (
          <button
            type="button"
            onClick={onOpenReview}
            className="w-full rounded-xl bg-gray-100 py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {uiText.review.title}
          </button>
        ) : null}

        {appointment.status !== 'approved_waiting_payment' && appointment.status !== 'completed' && statusBanner ? (
          <div className={`rounded-xl border p-4 ${getStatusBannerClasses(appointment.status)}`}>
            <p className="text-[13px] font-medium leading-relaxed">{statusBanner}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
