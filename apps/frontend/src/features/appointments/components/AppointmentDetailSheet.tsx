'use client';

import { ChevronLeft, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  accentPrimaryButtonClass,
  accentSoftPillClass,
  blushSubtlePanelClass,
  neutralSoftPillClass,
  softMetricTileClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
import { useAppointmentHomeVisitStatus } from '@/features/appointments/hooks/useAppointmentHomeVisitStatus';
import { getAppointmentClosePreview } from '@/features/appointments/lib/cancellation';
import {
  getAppointmentStatusChipClassName,
  getStatusBannerClasses,
  isAppointmentChatAvailable,
} from '@/features/appointments/lib/status';
import { useUiText } from '@/lib/ui-text';
import { useAppShell } from '@/lib/use-app-shell';
import type { Appointment } from '@/types/appointments';

interface AppointmentDetailSheetProps {
  appointment: Appointment;
  onClose: () => void;
  onBookAgain: () => void;
  onOpenCancel: () => void;
  onOpenChat: () => void;
  onOpenReview: () => void;
  onPayNow: () => void;
}

export const AppointmentDetailSheet = ({
  appointment,
  onClose,
  onBookAgain,
  onOpenCancel,
  onOpenChat,
  onOpenReview,
  onPayNow,
}: AppointmentDetailSheetProps) => {
  const t = useTranslations('Appointments');
  const professionalT = useTranslations('Professional');
  const profileT = useTranslations('Profile');
  const { currentUserContext } = useAppShell();
  const locale = useLocale();
  const uiText = useUiText();
  const statusBanner = uiText.appointmentStatusBanners[appointment.status];
  const canChat = isAppointmentChatAvailable(appointment.status);
  const customerCancelPreview = getAppointmentClosePreview({
    actor: 'customer',
    policySnapshot: appointment.cancellationPolicySnapshot,
    scheduleSnapshot: appointment.scheduleSnapshot,
    status: appointment.status,
  });
  const canCancel = customerCancelPreview.allowed;
  const modeLabel =
    appointment.requestedMode === 'online'
      ? profileT('modeLabels.online')
      : appointment.requestedMode === 'home_visit'
        ? profileT('modeLabels.home_visit')
        : profileT('modeLabels.onsite');
  const bookingFlowLabel =
    appointment.bookingFlow === 'instant' ? professionalT('bookingFlowInstant') : professionalT('bookingFlowRequest');
  const requestedAtLabel = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(appointment.requestedAt));
  const cancelledAtLabel = appointment.cancellationResolution
    ? new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(appointment.cancellationResolution.cancelledAt))
    : null;
  const customerPolicyLabel =
    customerCancelPreview.cutoffHours === null
      ? uiText.appointmentCancellation.customerNoPaymentPolicy
      : uiText.appointmentCancellation.getCutoffPolicyLabel(customerCancelPreview.cutoffHours);
  const canBookAgain =
    appointment.status === 'cancelled' || appointment.status === 'rejected' || appointment.status === 'expired';
  const homeVisitStatus = useAppointmentHomeVisitStatus(
    appointment.id,
    appointment.requestedMode === 'home_visit' && appointment.status !== 'completed',
  );
  const homeVisitUpdatedAtLabel = homeVisitStatus.status?.updatedAt
    ? new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(homeVisitStatus.status.updatedAt))
    : null;
  const homeVisitDepartedAtLabel = homeVisitStatus.status?.departedAt
    ? new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(homeVisitStatus.status.departedAt))
    : null;
  const showHomeVisitPanel = appointment.requestedMode === 'home_visit';
  const homeVisitTitle = appointment.status === 'in_service' ? t('homeVisit.serviceStarted') : t('homeVisit.title');
  const homeVisitDescription =
    appointment.status === 'in_service'
      ? t('homeVisit.serviceStartedDescription')
      : homeVisitStatus.status?.hasDeparted
        ? t('homeVisit.departedDescription')
        : homeVisitStatus.isLoading
          ? t('homeVisit.loadingDescription')
          : t('homeVisit.pendingDescription');
  const homeVisitEtaLabel =
    homeVisitStatus.status?.showEtaHint && homeVisitStatus.status.etaMinutesHint
      ? t('homeVisit.etaMinutes', { minutes: homeVisitStatus.status.etaMinutesHint })
      : homeVisitStatus.status?.hasDeparted
        ? t('homeVisit.etaUnavailable')
        : t('homeVisit.waitingEta');

  return (
    <div className="fixed inset-y-0 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col bg-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="sticky top-0 z-10 flex items-center border-b border-gray-100 bg-white px-4 py-4">
        <button type="button" onClick={onClose} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900">{uiText.appointmentDetailTitle}</h2>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 pb-24">
        <div className={`${softWhitePanelClass} mb-4 flex items-center justify-between p-5`}>
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
              <p className="text-[12px] font-bold text-green-500">{currentUserContext.onlineStatusLabel}</p>
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

        <div className={`${softWhitePanelClass} p-5`}>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {uiText.appointmentFieldLabels.status}
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-[8px] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider ${getAppointmentStatusChipClassName(appointment.status)}`}
                >
                  {t(`status.${appointment.status}`)}
                </span>
                <span className={neutralSoftPillClass}>{modeLabel}</span>
                <span className={appointment.bookingFlow === 'instant' ? accentSoftPillClass : neutralSoftPillClass}>
                  {bookingFlowLabel}
                </span>
              </div>
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
            {showHomeVisitPanel ? (
              <div className={`${softMetricTileClass} grid gap-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {t('homeVisit.eyebrow')}
                    </p>
                    <p className="mt-1 text-[15px] font-bold text-gray-900">{homeVisitTitle}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{homeVisitDescription}</p>
                  </div>
                  <span className={homeVisitStatus.status?.hasDeparted ? accentSoftPillClass : neutralSoftPillClass}>
                    {homeVisitStatus.status?.hasDeparted ? t('homeVisit.departedBadge') : t('homeVisit.pendingBadge')}
                  </span>
                </div>

                <div className="grid gap-2 rounded-[18px] bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('homeVisit.eta')}</p>
                  <p className="text-[13px] font-semibold text-gray-900">{homeVisitEtaLabel}</p>
                  {homeVisitStatus.status?.distanceKmHint ? (
                    <p className="text-[12px] leading-relaxed text-gray-500">
                      {t('homeVisit.distanceKm', { distance: homeVisitStatus.status.distanceKmHint.toFixed(1) })}
                    </p>
                  ) : null}
                </div>

                {homeVisitDepartedAtLabel || homeVisitUpdatedAtLabel ? (
                  <div className="grid gap-1 rounded-[18px] bg-white px-4 py-3 ring-1 ring-gray-100">
                    {homeVisitDepartedAtLabel ? (
                      <p className="text-[12px] font-semibold text-gray-700">
                        {t('homeVisit.departedAt', { time: homeVisitDepartedAtLabel })}
                      </p>
                    ) : null}
                    {homeVisitUpdatedAtLabel ? (
                      <p className="text-[12px] leading-relaxed text-gray-500">
                        {t('homeVisit.updatedAt', { time: homeVisitUpdatedAtLabel })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {uiText.appointmentFieldLabels.service}
              </p>
              <p className="text-[14px] font-semibold text-gray-900">{appointment.service.name}</p>
              <p className="mt-1 text-[12px] font-medium text-pink-600">{appointment.service.summary}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">{appointment.service.description}</p>
            </div>
            <div className="grid gap-3">
              <div className={softMetricTileClass}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {uiText.appointmentFieldLabels.mode}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-gray-900">{modeLabel}</p>
              </div>
              <div className={softMetricTileClass}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {uiText.appointmentFieldLabels.duration}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-gray-900">{appointment.service.durationLabel}</p>
              </div>
              <div className={softMetricTileClass}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {uiText.appointmentFieldLabels.requestedAt}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-gray-900">{requestedAtLabel}</p>
              </div>
              <div className={softMetricTileClass}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {professionalT('bookingFlowLabel')}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-gray-900">{bookingFlowLabel}</p>
              </div>
              <div className={softMetricTileClass}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {uiText.appointmentFieldLabels.note}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-700">{appointment.requestNote}</p>
              </div>
            </div>
            <div className={`${blushSubtlePanelClass} mt-2 flex items-center justify-between p-4`}>
              <p className="text-[13px] font-bold text-gray-500">{uiText.appointmentFieldLabels.totalPayment}</p>
              <p className="text-right text-[16px] font-bold text-pink-600">{appointment.totalPrice}</p>
            </div>

            {canCancel ? (
              <div className={`${softMetricTileClass} grid gap-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {uiText.appointmentCancellation.outcomeTitle}
                    </p>
                    <p className="mt-1 text-[15px] font-bold text-gray-900">
                      {uiText.appointmentCancellation.getOutcomeLabel(customerCancelPreview.financialOutcome || 'none')}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                      {uiText.appointmentCancellation.getOutcomeDescription(
                        customerCancelPreview.financialOutcome || 'none',
                      )}
                    </p>
                  </div>
                  {customerCancelPreview.cutoffHours !== null ? (
                    <span className={neutralSoftPillClass}>
                      {uiText.appointmentCancellation.getCutoffWindowLabel(customerCancelPreview.cutoffHours)}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2 rounded-[18px] bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {uiText.appointmentCancellation.policyTitle}
                  </p>
                  <p className="text-[13px] leading-relaxed text-gray-600">{customerPolicyLabel}</p>
                  <p className="text-[13px] leading-relaxed text-gray-600">
                    {uiText.appointmentCancellation.professionalPolicy}
                  </p>
                  <p className="text-[12px] font-semibold text-pink-600">
                    {uiText.appointmentCancellation.getTimingLabel(
                      customerCancelPreview.isBeforeCutoff,
                      customerCancelPreview.cutoffHours,
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            {appointment.cancellationResolution ? (
              <div className={`${softMetricTileClass} grid gap-3`}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {uiText.appointmentCancellation.resolutionTitle}
                </p>
                {cancelledAtLabel ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {uiText.appointmentCancellation.resolutionCancelledAtLabel}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-gray-900">{cancelledAtLabel}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {uiText.appointmentCancellation.resolutionFinancialOutcomeLabel}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold text-gray-900">
                    {uiText.appointmentCancellation.getOutcomeLabel(
                      appointment.cancellationResolution.financialOutcome,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {uiText.appointmentCancellation.resolutionReasonLabel}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-700">
                    {appointment.cancellationResolution.cancellationReason}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full border-t border-gray-100 bg-white p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        {appointment.status === 'awaiting_payment' || appointment.status === 'approved_waiting_payment' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onOpenCancel}
              className="flex-1 rounded-xl bg-gray-100 py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              {uiText.appointmentActionLabels.cancel}
            </button>
            <button
              type="button"
              onClick={onPayNow}
              className={`${accentPrimaryButtonClass} flex-1 py-3.5 text-[14px]`}
            >
              {uiText.appointmentActionLabels.payNow}
            </button>
          </div>
        ) : null}

        {appointment.status !== 'awaiting_payment' && appointment.status !== 'approved_waiting_payment' && canCancel ? (
          <button
            type="button"
            onClick={onOpenCancel}
            className="mb-3 w-full rounded-xl bg-gray-100 py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {uiText.appointmentActionLabels.cancel}
          </button>
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

        {canBookAgain ? (
          <button
            type="button"
            onClick={onBookAgain}
            className={`${accentPrimaryButtonClass} mb-3 w-full py-3.5 text-[14px]`}
          >
            {uiText.appointmentActionLabels.bookAgain}
          </button>
        ) : null}

        {appointment.status !== 'awaiting_payment' &&
        appointment.status !== 'approved_waiting_payment' &&
        appointment.status !== 'completed' &&
        statusBanner ? (
          <div className={`rounded-xl border p-4 ${getStatusBannerClasses(appointment.status)}`}>
            <p className="text-[13px] font-medium leading-relaxed">{statusBanner}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
