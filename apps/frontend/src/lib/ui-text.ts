'use client';

import { useTranslations } from 'next-intl';
import type {
  AppointmentCancellationActor,
  AppointmentFinancialOutcome,
  AppointmentStatus,
} from '@/types/appointments';
import type { ProfessionalGender, ServiceDeliveryMode } from '@/types/catalog';

const GENDER_OPTION_KEYS = ['any', 'female', 'male'] as const;

export const useUiText = () => {
  const t = useTranslations('UiText');

  const bookingMessages: Record<ServiceDeliveryMode, string> = {
    online: t('booking.online'),
    home_visit: t('booking.homeVisit'),
    onsite: t('booking.onsite'),
  };

  const appointmentStatusBanners: Partial<Record<AppointmentStatus, string>> = {
    requested: t('appointment.statusBanners.requested'),
    paid: t('appointment.statusBanners.paid'),
    confirmed: t('appointment.statusBanners.confirmed'),
    in_service: t('appointment.statusBanners.inService'),
    cancelled: t('appointment.statusBanners.cancelled'),
    rejected: t('appointment.statusBanners.rejected'),
    expired: t('appointment.statusBanners.expired'),
  };

  const professionalGenderLabels: Record<ProfessionalGender, string> = {
    female: t('professionalGender.female'),
    male: t('professionalGender.male'),
  };
  const appointmentCancellationOutcomeLabels: Record<AppointmentFinancialOutcome, string> = {
    none: t('appointment.cancellation.outcomes.none'),
    void_pending_payment: t('appointment.cancellation.outcomes.void_pending_payment'),
    full_refund: t('appointment.cancellation.outcomes.full_refund'),
    no_refund: t('appointment.cancellation.outcomes.no_refund'),
    manual_refund_required: t('appointment.cancellation.outcomes.manual_refund_required'),
  };
  const appointmentCancellationOutcomeDescriptions: Record<AppointmentFinancialOutcome, string> = {
    none: t('appointment.cancellation.outcomeDescriptions.none'),
    void_pending_payment: t('appointment.cancellation.outcomeDescriptions.void_pending_payment'),
    full_refund: t('appointment.cancellation.outcomeDescriptions.full_refund'),
    no_refund: t('appointment.cancellation.outcomeDescriptions.no_refund'),
    manual_refund_required: t('appointment.cancellation.outcomeDescriptions.manual_refund_required'),
  };
  const appointmentCancellationNoticeMessages: Record<AppointmentFinancialOutcome, string> = {
    none: t('alerts.appointmentCancelled.none'),
    void_pending_payment: t('alerts.appointmentCancelled.void_pending_payment'),
    full_refund: t('alerts.appointmentCancelled.full_refund'),
    no_refund: t('alerts.appointmentCancelled.no_refund'),
    manual_refund_required: t('alerts.appointmentCancelled.manual_refund_required'),
  };
  const appointmentCancellationActorLabels: Record<AppointmentCancellationActor, string> = {
    customer: t('appointment.cancellation.actorLabels.customer'),
    professional: t('appointment.cancellation.actorLabels.professional'),
  };
  const exploreGenderOptions = GENDER_OPTION_KEYS.map((key) => ({
    key,
    label: t(`explore.genderOptions.${key}`),
  }));

  return {
    terms: {
      professional: t('terms.professional'),
      category: t('terms.category'),
      service: t('terms.service'),
      location: t('terms.location'),
      experience: t('terms.experience'),
      patients: t('terms.patients'),
    },
    getBookingMessage: (mode: ServiceDeliveryMode) => bookingMessages[mode],
    getProviderBookingNotice: (mode: ServiceDeliveryMode, providerName: string) =>
      t('booking.providerSelectedNotice', {
        bookingMessage: bookingMessages[mode],
        providerName,
      }),
    getServiceBookingNotice: (mode: ServiceDeliveryMode, serviceName: string, scheduleMessage = '') =>
      t('booking.serviceSelectedNotice', {
        bookingMessage: bookingMessages[mode],
        serviceName,
        scheduleMessage,
      }),
    getScheduleNotice: (dateIso: string, timeLabel: string) =>
      t('booking.scheduleNotice', {
        dateIso,
        timeLabel,
      }),
    booking: {
      home_visit: bookingMessages.home_visit,
      online: bookingMessages.online,
      onsite: bookingMessages.onsite,
    },
    chatAutoReply: t('alerts.chatAutoReply'),
    paymentSuccessAlert: t('alerts.paymentSuccess'),
    chatSentAlert: t('alerts.chatSent'),
    chatUnavailableAlert: t('alerts.chatUnavailable'),
    getAppointmentCancellationNotice: (financialOutcome: AppointmentFinancialOutcome) =>
      appointmentCancellationNoticeMessages[financialOutcome],
    getReviewPhotoReadyNotice: (fileName: string) =>
      t('alerts.reviewPhotoReady', {
        fileName,
      }),
    getReviewSuccessNotice: (reviewPhotoName?: string | null) =>
      reviewPhotoName
        ? t('alerts.reviewSuccessWithPhoto', {
            successMessage: t('review.successAlert'),
            fileName: reviewPhotoName,
          })
        : t('review.successAlert'),
    appointmentDetailTitle: t('appointment.detailTitle'),
    appointmentNotFoundMessage: t('appointment.notFoundMessage'),
    appointmentBackLabel: t('appointment.backLabel'),
    getAppointmentWelcomeMessage: (serviceName: string) =>
      t('appointment.welcomeTemplate', {
        serviceName,
      }),
    appointmentChatDayLabel: t('appointment.chatDayLabel'),
    appointmentChatInputPlaceholder: t('appointment.chatInputPlaceholder'),
    appointmentFieldLabels: {
      duration: t('appointment.fieldLabels.duration'),
      mode: t('appointment.fieldLabels.mode'),
      note: t('appointment.fieldLabels.note'),
      requestedAt: t('appointment.fieldLabels.requestedAt'),
      status: t('appointment.fieldLabels.status'),
      time: t('appointment.fieldLabels.time'),
      location: t('appointment.fieldLabels.location'),
      service: t('appointment.fieldLabels.service'),
      totalPayment: t('appointment.fieldLabels.totalPayment'),
    },
    appointmentActionLabels: {
      bookAgain: t('appointment.actionLabels.bookAgain'),
      detail: t('appointment.actionLabels.detail'),
      cancel: t('appointment.actionLabels.cancel'),
      payNow: t('appointment.actionLabels.payNow'),
    },
    appointmentCancellation: {
      title: t('appointment.cancellation.title'),
      description: t('appointment.cancellation.description'),
      submitLabel: t('appointment.cancellation.submitLabel'),
      keepLabel: t('appointment.cancellation.keepLabel'),
      reasonLabel: t('appointment.cancellation.reasonLabel'),
      reasonPlaceholder: t('appointment.cancellation.reasonPlaceholder'),
      policyTitle: t('appointment.cancellation.policyTitle'),
      outcomeTitle: t('appointment.cancellation.outcomeTitle'),
      customerNoPaymentPolicy: t('appointment.cancellation.customerNoPaymentPolicy'),
      professionalPolicy: t('appointment.cancellation.professionalPolicy'),
      resolutionTitle: t('appointment.cancellation.resolutionTitle'),
      resolutionReasonLabel: t('appointment.cancellation.resolutionReasonLabel'),
      resolutionFinancialOutcomeLabel: t('appointment.cancellation.resolutionFinancialOutcomeLabel'),
      resolutionCancelledAtLabel: t('appointment.cancellation.resolutionCancelledAtLabel'),
      getActorLabel: (actor: AppointmentCancellationActor) => appointmentCancellationActorLabels[actor],
      getCutoffPolicyLabel: (hours: number) =>
        t('appointment.cancellation.customerCutoffPolicy', {
          hours: String(hours),
        }),
      getCutoffWindowLabel: (hours: number) =>
        t('appointment.cancellation.cutoffWindowLabel', {
          hours: String(hours),
        }),
      getTimingLabel: (isBeforeCutoff: boolean | null, hours: number | null) => {
        if (hours === null || isBeforeCutoff === null) {
          return t('appointment.cancellation.timing.notApplicable');
        }

        return isBeforeCutoff
          ? t('appointment.cancellation.timing.beforeCutoff', { hours: String(hours) })
          : t('appointment.cancellation.timing.afterCutoff', { hours: String(hours) });
      },
      getOutcomeLabel: (financialOutcome: AppointmentFinancialOutcome) =>
        appointmentCancellationOutcomeLabels[financialOutcome],
      getOutcomeDescription: (financialOutcome: AppointmentFinancialOutcome) =>
        appointmentCancellationOutcomeDescriptions[financialOutcome],
    },
    appointmentStatusBanners,
    homeEmptyStateTitle: t('home.emptyStateTitle'),
    homeEmptyStateDescription: t('home.emptyStateDescription'),
    homeEmptyStateAction: t('home.emptyStateAction'),
    serviceHighlightsTitle: t('serviceDetail.highlightsTitle'),
    professionalProfile: {
      storiesTitle: t('professionalProfile.storiesTitle'),
      portfolioEntriesTitle: t('professionalProfile.portfolioEntriesTitle'),
      galleryTitle: t('professionalProfile.galleryTitle'),
      testimonialsTitle: t('professionalProfile.testimonialsTitle'),
      feedbackTitle: t('professionalProfile.feedbackTitle'),
      credentialsTitle: t('professionalProfile.credentialsTitle'),
      recentActivityTitle: t('professionalProfile.recentActivityTitle'),
      serviceSectionTitle: t('professionalProfile.serviceSectionTitle'),
      availabilityLabel: t('professionalProfile.availabilityLabel'),
      responseTimeLabel: t('professionalProfile.responseTimeLabel'),
      languagesLabel: t('professionalProfile.languagesLabel'),
      totalReviewsLabel: t('professionalProfile.totalReviewsLabel'),
      recommendationLabel: t('professionalProfile.recommendationLabel'),
      repeatClientsLabel: t('professionalProfile.repeatClientsLabel'),
    },
    exploreGenderOptions,
    getProfessionalGenderLabel: (gender: ProfessionalGender) => professionalGenderLabels[gender],
    review: {
      title: t('review.title'),
      getTitleForProfessional: (professionalName: string) =>
        t('review.titleTemplate', {
          professionalName,
        }),
      helperText: t('review.helperText'),
      photoLabel: t('review.photoLabel'),
      photoButtonLabel: t('review.photoButtonLabel'),
      reviewLabel: t('review.reviewLabel'),
      reviewPlaceholder: t('review.reviewPlaceholder'),
      submitLabel: t('review.submitLabel'),
      uploadAlert: t('review.uploadAlert'),
      successAlert: t('review.successAlert'),
    },
  };
};
