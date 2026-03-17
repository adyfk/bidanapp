'use client';

import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { toAvailabilityDraft } from '@/components/screens/professional-dashboard/helpers';
import { ProfessionalDashboardAvailabilityEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardAvailabilityEditorDialog';
import { ProfessionalDashboardAvailabilityTab } from '@/components/screens/professional-dashboard/ProfessionalDashboardAvailabilityTab';
import { ProfessionalDashboardShell } from '@/components/screens/professional-dashboard/ProfessionalDashboardShell';
import type { AvailabilityDraft } from '@/components/screens/professional-dashboard/types';
import { useDashboardDialogLifecycle } from '@/components/screens/professional-dashboard/useDashboardDialogLifecycle';
import { useProfessionalDashboardPageData } from '@/components/screens/professional-dashboard/useProfessionalDashboardPageData';

export const ProfessionalDashboardAvailabilityScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeReviewState,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    getModeLabel,
    hasMounted,
    isProfessional,
    onboardingState,
    portalState,
    publishProfessionalProfile,
    saveAvailabilityByMode,
    simulateProfessionalAdminReview,
    submitProfessionalProfileForReview,
    t,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [isAvailabilityEditorOpen, setIsAvailabilityEditorOpen] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityDraft>(toAvailabilityDraft(portalState));

  useEffect(() => {
    if (!isAvailabilityEditorOpen) {
      setAvailabilityDraft(toAvailabilityDraft(portalState));
    }
  }, [isAvailabilityEditorOpen, portalState]);

  const closeAvailabilityEditor = () => {
    setAvailabilityDraft(toAvailabilityDraft(portalState));
    setIsAvailabilityEditorOpen(false);
  };

  useDashboardDialogLifecycle(isAvailabilityEditorOpen, closeAvailabilityEditor);

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
      activeTab="availability"
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
      <ProfessionalDashboardAvailabilityTab
        availabilityDraft={availabilityDraft}
        getModeLabel={getModeLabel}
        onEditAvailability={() => {
          setAvailabilityDraft(toAvailabilityDraft(portalState));
          setIsAvailabilityEditorOpen(true);
        }}
        serviceConfigurations={portalState.serviceConfigurations}
      />

      {isAvailabilityEditorOpen ? (
        <ProfessionalDashboardAvailabilityEditorDialog
          availabilityDraft={availabilityDraft}
          getModeLabel={getModeLabel}
          onChangeDraft={setAvailabilityDraft}
          onClose={closeAvailabilityEditor}
          onSave={() => {
            saveAvailabilityByMode(availabilityDraft.availabilityByMode);
            setNotice(t('availability.saveSuccess'));
            setIsAvailabilityEditorOpen(false);
          }}
        />
      ) : null}
    </ProfessionalDashboardShell>
  );
};
