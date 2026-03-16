'use client';

import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalSetupScreen } from '@/components/screens/ProfessionalSetupScreen';
import { ProfessionalDashboardShell } from './ProfessionalDashboardShell';
import { ProfessionalDashboardTrustTab } from './ProfessionalDashboardTrustTab';
import { useProfessionalDashboardPageData } from './useProfessionalDashboardPageData';

export const ProfessionalDashboardTrustScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    getServiceLabel,
    hasMounted,
    isProfessional,
    portalState,
    publicPortfolioEntries,
  } = useProfessionalDashboardPageData();

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  if (!portalState.onboardingCompleted || !activeProfessional) {
    return <ProfessionalSetupScreen />;
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
