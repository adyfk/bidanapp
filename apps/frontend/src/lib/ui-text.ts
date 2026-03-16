'use client';

import { useTranslations } from 'next-intl';
import type { AppointmentStatus } from '@/types/appointments';
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
      customerAppChannel: t('booking.customerAppChannel'),
      home_visit: bookingMessages.home_visit,
      online: bookingMessages.online,
      onsite: bookingMessages.onsite,
    },
    chatAutoReply: t('alerts.chatAutoReply'),
    paymentSuccessAlert: t('alerts.paymentSuccess'),
    chatSentAlert: t('alerts.chatSent'),
    chatUnavailableAlert: t('alerts.chatUnavailable'),
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
      status: t('appointment.fieldLabels.status'),
      time: t('appointment.fieldLabels.time'),
      location: t('appointment.fieldLabels.location'),
      service: t('appointment.fieldLabels.service'),
      totalPayment: t('appointment.fieldLabels.totalPayment'),
    },
    appointmentActionLabels: {
      detail: t('appointment.actionLabels.detail'),
      cancel: t('appointment.actionLabels.cancel'),
      payNow: t('appointment.actionLabels.payNow'),
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
