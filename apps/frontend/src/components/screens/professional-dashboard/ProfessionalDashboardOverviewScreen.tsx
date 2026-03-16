'use client';

import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalSetupScreen } from '@/components/screens/ProfessionalSetupScreen';
import { ProfessionalDashboardOverviewTab } from './ProfessionalDashboardOverviewTab';
import { ProfessionalDashboardShell } from './ProfessionalDashboardShell';
import { useProfessionalDashboardPageData } from './useProfessionalDashboardPageData';

export const ProfessionalDashboardOverviewScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    featuredServiceConfiguration,
    getServiceLabel,
    hasMounted,
    isProfessional,
    nextSchedule,
    portalState,
    publicPortfolioEntries,
    readinessItems,
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
      activeTab="overview"
      averageServicePriceLabel={averageServicePriceLabel}
      clampedCompletionScore={clampedCompletionScore}
      headerLocationLabel={dashboardLocationLabel}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardOverviewTab
        activeCoverageAreaCount={activeCoverageAreas.length}
        activeProfessionalLocation={activeProfessional.location}
        activeServiceConfigurations={activeServiceConfigurations}
        featuredServiceConfiguration={featuredServiceConfiguration}
        getServiceLabel={getServiceLabel}
        nextSchedule={nextSchedule}
        portalState={portalState}
        publicPortfolioEntries={publicPortfolioEntries}
        readinessItems={readinessItems}
      />
    </ProfessionalDashboardShell>
  );
};
