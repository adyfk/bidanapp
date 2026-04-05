'use client';

import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { parseInteger, toCoverageDraft } from '@/components/screens/professional-dashboard/helpers';
import { ProfessionalDashboardCoverageEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardCoverageEditorDialog';
import { ProfessionalDashboardCoverageTab } from '@/components/screens/professional-dashboard/ProfessionalDashboardCoverageTab';
import { ProfessionalDashboardShell } from '@/components/screens/professional-dashboard/ProfessionalDashboardShell';
import type { CoverageDraft } from '@/components/screens/professional-dashboard/types';
import { useDashboardDialogLifecycle } from '@/components/screens/professional-dashboard/useDashboardDialogLifecycle';
import { useProfessionalDashboardPageData } from '@/components/screens/professional-dashboard/useProfessionalDashboardPageData';

export const ProfessionalDashboardCoverageScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeReviewState,
    activeServiceConfigurations,
    averageServicePriceLabel,
    catalogAreas,
    clampedCompletionScore,
    dashboardLocationLabel,
    getAreaLabel,
    getModeLabel,
    hasMounted,
    isProfessional,
    onboardingState,
    publishProfessionalProfile,
    portalState,
    saveBusinessSettings,
    submitProfessionalProfileForReview,
    t,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [isCoverageEditorOpen, setIsCoverageEditorOpen] = useState(false);
  const [coverageDraft, setCoverageDraft] = useState<CoverageDraft>(toCoverageDraft(portalState));

  useEffect(() => {
    if (!isCoverageEditorOpen) {
      setCoverageDraft(toCoverageDraft(portalState));
    }
  }, [isCoverageEditorOpen, portalState]);

  const closeCoverageEditor = () => {
    setCoverageDraft(toCoverageDraft(portalState));
    setIsCoverageEditorOpen(false);
  };

  useDashboardDialogLifecycle(isCoverageEditorOpen, closeCoverageEditor);

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  if (!activeProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  const openCoverageEditor = () => {
    setCoverageDraft(toCoverageDraft(portalState));
    setIsCoverageEditorOpen(true);
  };

  const handleSaveCoverage = () => {
    if (coverageDraft.coverageAreaIds.length === 0) {
      setNotice(t('coverage.validationMessage'));
      return;
    }

    saveBusinessSettings({
      acceptingNewClients: coverageDraft.acceptingNewClients,
      autoApproveInstantBookings: coverageDraft.autoApproveInstantBookings,
      city: coverageDraft.city,
      coverageAreaIds: coverageDraft.coverageAreaIds,
      coverageCenter: {
        latitude: Number.parseFloat(coverageDraft.latitude) || portalState.coverageCenter.latitude,
        longitude: Number.parseFloat(coverageDraft.longitude) || portalState.coverageCenter.longitude,
      },
      homeVisitRadiusKm: parseInteger(coverageDraft.homeVisitRadiusKm, portalState.homeVisitRadiusKm),
      practiceAddress: coverageDraft.practiceAddress,
      practiceLabel: coverageDraft.practiceLabel,
      publicBio: coverageDraft.publicBio,
      responseTimeGoal: coverageDraft.responseTimeGoal,
    });
    setNotice(t('coverage.saveSuccess'));
    setIsCoverageEditorOpen(false);
  };

  return (
    <ProfessionalDashboardShell
      activeCoverageAreaCount={activeCoverageAreas.length}
      activeProfessional={activeProfessional}
      activeServiceCount={activeServiceConfigurations.length}
      activeTab="coverage"
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
      onSubmitForReview={async () => {
        if (!(await submitProfessionalProfileForReview())) {
          setNotice(t('onboarding.validationNotice'));
          return;
        }

        setNotice(t('onboarding.submitSuccess'));
      }}
      reviewState={activeReviewState}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardCoverageTab
        availabilityRulesByMode={portalState.availabilityRulesByMode}
        coverageDraft={coverageDraft}
        getAreaLabel={getAreaLabel}
        getModeLabel={getModeLabel}
        onEditCoverage={openCoverageEditor}
        serviceConfigurations={portalState.serviceConfigurations}
      />

      {isCoverageEditorOpen ? (
        <ProfessionalDashboardCoverageEditorDialog
          areas={catalogAreas}
          coverageDraft={coverageDraft}
          onChangeDraft={setCoverageDraft}
          onClose={closeCoverageEditor}
          onSave={handleSaveCoverage}
        />
      ) : null}
    </ProfessionalDashboardShell>
  );
};
