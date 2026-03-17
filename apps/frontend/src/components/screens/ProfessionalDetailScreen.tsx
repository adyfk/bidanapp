'use client';

import { BadgeCheck, Clock3, Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomerRequestStatusCard } from '@/features/professional-detail/components/CustomerRequestStatusCard';
import { ProfessionalBookingBar } from '@/features/professional-detail/components/ProfessionalBookingBar';
import { ProfessionalHeroSection } from '@/features/professional-detail/components/ProfessionalHeroSection';
import { ProfessionalPortfolioSections } from '@/features/professional-detail/components/ProfessionalPortfolioSections';
import { ProfessionalPracticeSections } from '@/features/professional-detail/components/ProfessionalPracticeSections';
import { ProfessionalServicesSection } from '@/features/professional-detail/components/ProfessionalServicesSection';
import { ProfessionalTrustSections } from '@/features/professional-detail/components/ProfessionalTrustSections';
import { useProfessionalDetail } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { usePathname, useRouter } from '@/i18n/routing';
import { customerAccessRoute } from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import { useViewerSession } from '@/lib/use-viewer-session';

export const ProfessionalDetailScreen = ({ professionalSlug }: { professionalSlug?: string }) => {
  const t = useTranslations('Professional');
  const uiText = useUiText();
  const router = useRouter();
  const pathname = usePathname();
  const { isCustomer } = useViewerSession();
  const { isFavorite, toggleFavorite } = useProfessionalUserPreferences();
  const profileCopy = uiText.professionalProfile;
  const trustIndicators = [
    {
      label: profileCopy.availabilityLabel,
      value: '',
      icon: <BadgeCheck className="h-4 w-4" />,
    },
    {
      label: profileCopy.responseTimeLabel,
      value: '',
      icon: <Clock3 className="h-4 w-4" />,
    },
    {
      label: profileCopy.languagesLabel,
      value: '',
      icon: <Languages className="h-4 w-4" />,
    },
  ];

  const {
    canRequestBooking,
    coverageStatus,
    customerRequest,
    getServiceName,
    notice,
    offeredServices,
    professional,
    profCategory,
    requestBooking,
    requiresOfflineScheduleSelection,
    selectedBookingMode,
    selectedScheduleDay,
    selectedScheduleDayId,
    selectedScheduleDays,
    selectedService,
    selectedServiceEntry,
    selectedTimeSlot,
    selectedTimeSlotId,
    setNotice,
    setSelectedBookingMode,
    setSelectedScheduleDayId,
    setSelectedService,
    setSelectedTimeSlotId,
  } = useProfessionalDetail(professionalSlug);

  if (!professional) {
    return null;
  }

  const hydratedTrustIndicators = [
    {
      ...trustIndicators[0],
      value: professional.availability.isAvailable ? t('available') : t('unavailable'),
    },
    {
      ...trustIndicators[1],
      value: professional.responseTime,
    },
    {
      ...trustIndicators[2],
      value: professional.languages.join(' / '),
    },
  ];

  return (
    <div
      className="relative flex h-full flex-col overflow-y-auto custom-scrollbar"
      style={{ background: 'linear-gradient(180deg, #FFF7FB 0%, #FFFFFF 20%, #F9FAFB 100%)' }}
    >
      <ProfessionalHeroSection
        genderLabel={uiText.getProfessionalGenderLabel(professional.gender)}
        isFavorite={isFavorite(professional.id)}
        onToggleFavorite={() => toggleFavorite(professional.id)}
        profCategory={profCategory}
        professional={professional}
        ratingLabel={t('rating')}
        totalReviewsLabel={profileCopy.totalReviewsLabel}
        trustIndicators={hydratedTrustIndicators}
      />

      <div className="relative z-10 mt-6 space-y-5 px-6 pb-52">
        {isCustomer && customerRequest ? (
          <CustomerRequestStatusCard professionalName={professional.name} request={customerRequest} />
        ) : null}
        <ProfessionalPracticeSections
          profCategory={profCategory}
          profileCopy={profileCopy}
          professional={professional}
        />
        <ProfessionalPortfolioSections
          getServiceName={getServiceName}
          profileCopy={profileCopy}
          professional={professional}
        />
        <ProfessionalTrustSections profileCopy={profileCopy} professional={professional} />
        <ProfessionalServicesSection
          availabilityByMode={professional.availabilityByMode}
          coverageStatus={coverageStatus}
          isProfessionalAvailable={professional.availability.isAvailable}
          offeredServices={offeredServices}
          onSelectBookingMode={setSelectedBookingMode}
          onSelectScheduleDay={setSelectedScheduleDayId}
          onSelectService={setSelectedService}
          onSelectTimeSlot={setSelectedTimeSlotId}
          profileCopy={profileCopy}
          selectedBookingMode={selectedBookingMode}
          selectedScheduleDayId={selectedScheduleDayId}
          selectedScheduleDays={selectedScheduleDays}
          selectedService={selectedService}
          selectedServiceEntry={selectedServiceEntry}
          selectedTimeSlotId={selectedTimeSlotId}
        />
      </div>

      <ProfessionalBookingBar
        ctaLabel={t('makeAppointment')}
        notice={notice}
        onDismissNotice={() => setNotice(null)}
        onRequestBooking={() => {
          if (!isCustomer) {
            router.push(customerAccessRoute({ intent: 'booking', next: pathname }));
            return;
          }

          requestBooking();
        }}
        canRequestBooking={canRequestBooking}
        requiresOfflineScheduleSelection={requiresOfflineScheduleSelection}
        selectedBookingMode={selectedBookingMode}
        selectedScheduleDay={selectedScheduleDay}
        selectedServiceEntry={selectedServiceEntry}
        selectedTimeSlot={selectedTimeSlot}
      />
    </div>
  );
};
