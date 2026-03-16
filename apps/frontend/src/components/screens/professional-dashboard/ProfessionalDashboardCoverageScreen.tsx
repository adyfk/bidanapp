'use client';

import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalSetupScreen } from '@/components/screens/ProfessionalSetupScreen';
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
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    getAreaLabel,
    getModeLabel,
    hasMounted,
    isProfessional,
    portalState,
    saveBusinessSettings,
    t,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [isCoverageEditorOpen, setIsCoverageEditorOpen] = useState(false);
  const [coverageDraft, setCoverageDraft] = useState<CoverageDraft>(toCoverageDraft(portalState));

  useEffect(() => {
    setCoverageDraft(toCoverageDraft(portalState));
  }, [portalState]);

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

  if (!portalState.onboardingCompleted || !activeProfessional) {
    return <ProfessionalSetupScreen />;
  }

  const openCoverageEditor = () => {
    setCoverageDraft(toCoverageDraft(portalState));
    setIsCoverageEditorOpen(true);
  };

  const handleSaveCoverage = () => {
    if (coverageDraft.coverageAreaIds.length === 0 || coverageDraft.practiceModes.length === 0) {
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
      monthlyCapacity: parseInteger(coverageDraft.monthlyCapacity, portalState.monthlyCapacity),
      practiceAddress: coverageDraft.practiceAddress,
      practiceLabel: coverageDraft.practiceLabel,
      practiceModes: coverageDraft.practiceModes,
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
      onDismissNotice={() => setNotice(null)}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardCoverageTab
        coverageDraft={coverageDraft}
        getAreaLabel={getAreaLabel}
        getModeLabel={getModeLabel}
        onEditCoverage={openCoverageEditor}
      />

      {isCoverageEditorOpen ? (
        <ProfessionalDashboardCoverageEditorDialog
          coverageDraft={coverageDraft}
          getModeLabel={getModeLabel}
          onChangeDraft={setCoverageDraft}
          onClose={closeCoverageEditor}
          onSave={handleSaveCoverage}
        />
      ) : null}
    </ProfessionalDashboardShell>
  );
};
