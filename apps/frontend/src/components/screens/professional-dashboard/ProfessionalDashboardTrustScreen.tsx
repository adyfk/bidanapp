'use client';

import { useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalDashboardShell } from './ProfessionalDashboardShell';
import { ProfessionalDashboardTrustTab } from './ProfessionalDashboardTrustTab';
import { useProfessionalDashboardPageData } from './useProfessionalDashboardPageData';

export const ProfessionalDashboardTrustScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeReviewState,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    getServiceLabel,
    hasMounted,
    isProfessional,
    onboardingState,
    publishProfessionalProfile,
    portalState,
    publicPortfolioEntries,
    simulateProfessionalAdminReview,
    submitProfessionalProfileForReview,
    t,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  if (!activeProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  return (
    <ProfessionalDashboardShell
      activeCoverageAreaCount={activeCoverageAreas.length}
      activeProfessional={activeProfessional}
      activeServiceCount={activeServiceConfigurations.length}
      activeTab="trust"
      averageServicePriceLabel={averageServicePriceLabel}
      clampedCompletionScore={clampedCompletionScore}
      headerLocationLabel={dashboardLocationLabel}
      notice={notice}
      onboardingState={onboardingState}
      onDismissNotice={() => setNotice(null)}
      onPublishProfile={() => {
        if (!publishProfessionalProfile()) {
          return;
        }

        setNotice(t('onboarding.publishSuccess'));
      }}
      onSimulateReview={(status) => {
        if (!simulateProfessionalAdminReview(status)) {
          return;
        }

        setNotice(
          status === 'changes_requested' ? t('onboarding.demoRevisionSuccess') : t('onboarding.demoVerifySuccess'),
        );
      }}
      onSubmitForReview={() => {
        if (!submitProfessionalProfileForReview()) {
          setNotice(t('onboarding.validationNotice'));
          return;
        }

        setNotice(t('onboarding.submitSuccess'));
      }}
      reviewState={activeReviewState}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardTrustTab
        activeProfessional={activeProfessional}
        galleryCount={portalState.galleryItems.length}
        getServiceLabel={getServiceLabel}
        portfolioCount={publicPortfolioEntries.length}
        responseTimeGoal={portalState.responseTimeGoal}
        serviceCount={activeServiceConfigurations.length}
      />
    </ProfessionalDashboardShell>
  );
};
