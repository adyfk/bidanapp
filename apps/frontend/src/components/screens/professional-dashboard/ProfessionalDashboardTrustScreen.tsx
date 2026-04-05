'use client';

import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { toActivityStoryDraft, toCredentialDraft } from '@/components/screens/professional-dashboard/helpers';
import { ProfessionalDashboardTrustCredentialEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardTrustCredentialEditorDialog';
import { ProfessionalDashboardTrustStoryEditorDialog } from '@/components/screens/professional-dashboard/ProfessionalDashboardTrustStoryEditorDialog';
import type { ActivityStoryDraft, CredentialDraft } from '@/components/screens/professional-dashboard/types';
import { useDashboardDialogLifecycle } from '@/components/screens/professional-dashboard/useDashboardDialogLifecycle';
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
    deleteActivityStory,
    deleteCredential,
    dashboardLocationLabel,
    getServiceLabel,
    hasMounted,
    isProfessional,
    onboardingState,
    publishProfessionalProfile,
    portalState,
    publicPortfolioEntries,
    submitProfessionalProfileForReview,
    t,
    upsertActivityStory,
    upsertCredential,
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
      <TrustDashboardContent
        activeProfessional={activeProfessional}
        galleryCount={portalState.galleryItems.length}
        getServiceLabel={getServiceLabel}
        onDeleteActivityStory={deleteActivityStory}
        onDeleteCredential={deleteCredential}
        onNotice={setNotice}
        onUpsertActivityStory={upsertActivityStory}
        onUpsertCredential={upsertCredential}
        portfolioCount={publicPortfolioEntries.length}
        responseTimeGoal={portalState.responseTimeGoal}
        serviceCount={activeServiceConfigurations.length}
        trustActivityStories={portalState.activityStories}
        trustCredentials={portalState.credentials}
        t={t}
      />
    </ProfessionalDashboardShell>
  );
};

const emptyCredentialDraft: CredentialDraft = {
  issuer: '',
  note: '',
  title: '',
  year: '',
};

const emptyActivityStoryDraft: ActivityStoryDraft = {
  capturedAt: '',
  image: '',
  location: '',
  note: '',
  title: '',
};

const TrustDashboardContent = ({
  activeProfessional,
  galleryCount,
  getServiceLabel,
  onDeleteActivityStory,
  onDeleteCredential,
  onNotice,
  onUpsertActivityStory,
  onUpsertCredential,
  portfolioCount,
  responseTimeGoal,
  serviceCount,
  t,
  trustActivityStories,
  trustCredentials,
}: {
  activeProfessional: NonNullable<ReturnType<typeof useProfessionalDashboardPageData>['activeProfessional']>;
  galleryCount: number;
  getServiceLabel: (serviceId: string) => string;
  onDeleteActivityStory: (storyId: string) => void;
  onDeleteCredential: (credentialId: string) => void;
  onNotice: (notice: string | null) => void;
  onUpsertActivityStory: (
    input: { id?: string } & Partial<{
      capturedAt: string;
      image: string;
      location: string;
      note: string;
      title: string;
    }>,
  ) => string;
  onUpsertCredential: (
    input: { id?: string } & Partial<{ issuer: string; note: string; title: string; year: string }>,
  ) => string;
  portfolioCount: number;
  responseTimeGoal: string;
  serviceCount: number;
  t: ReturnType<typeof useProfessionalDashboardPageData>['t'];
  trustActivityStories: ReturnType<typeof useProfessionalDashboardPageData>['portalState']['activityStories'];
  trustCredentials: ReturnType<typeof useProfessionalDashboardPageData>['portalState']['credentials'];
}) => {
  const [isCredentialEditorOpen, setIsCredentialEditorOpen] = useState(false);
  const [isStoryEditorOpen, setIsStoryEditorOpen] = useState(false);
  const [selectedCredentialId, setSelectedCredentialId] = useState(trustCredentials[0]?.id || '');
  const [selectedStoryId, setSelectedStoryId] = useState(trustActivityStories[0]?.id || '');
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [credentialDraft, setCredentialDraft] = useState<CredentialDraft>(emptyCredentialDraft);
  const [storyDraft, setStoryDraft] = useState<ActivityStoryDraft>(emptyActivityStoryDraft);
  const selectedCredential = trustCredentials.find((item) => item.id === selectedCredentialId) || null;
  const selectedStory = trustActivityStories.find((item) => item.id === selectedStoryId) || null;
  const editingCredential = editingCredentialId
    ? trustCredentials.find((item) => item.id === editingCredentialId) || null
    : null;
  const editingStory = editingStoryId ? trustActivityStories.find((item) => item.id === editingStoryId) || null : null;

  useEffect(() => {
    if (selectedCredential) {
      return;
    }

    if (trustCredentials[0]) {
      setSelectedCredentialId(trustCredentials[0].id);
      return;
    }

    setSelectedCredentialId('');
  }, [selectedCredential, trustCredentials]);

  useEffect(() => {
    if (selectedStory) {
      return;
    }

    if (trustActivityStories[0]) {
      setSelectedStoryId(trustActivityStories[0].id);
      return;
    }

    setSelectedStoryId('');
  }, [selectedStory, trustActivityStories]);

  const closeCredentialEditor = () => {
    setCredentialDraft(editingCredential ? toCredentialDraft(editingCredential) : emptyCredentialDraft);
    setEditingCredentialId(null);
    setIsCredentialEditorOpen(false);
  };

  const closeStoryEditor = () => {
    setStoryDraft(editingStory ? toActivityStoryDraft(editingStory) : emptyActivityStoryDraft);
    setEditingStoryId(null);
    setIsStoryEditorOpen(false);
  };

  useDashboardDialogLifecycle(isCredentialEditorOpen || isStoryEditorOpen, () => {
    if (isStoryEditorOpen) {
      closeStoryEditor();
      return;
    }

    if (isCredentialEditorOpen) {
      closeCredentialEditor();
    }
  });

  return (
    <>
      <ProfessionalDashboardTrustTab
        activeProfessional={activeProfessional}
        galleryCount={galleryCount}
        getServiceLabel={getServiceLabel}
        onAddCredential={() => {
          setEditingCredentialId(null);
          setCredentialDraft(emptyCredentialDraft);
          setIsCredentialEditorOpen(true);
        }}
        onAddStory={() => {
          setEditingStoryId(null);
          setStoryDraft(emptyActivityStoryDraft);
          setIsStoryEditorOpen(true);
        }}
        onEditCredential={(credentialId) => {
          const nextCredential = trustCredentials.find((item) => item.id === credentialId);
          setSelectedCredentialId(credentialId);
          setEditingCredentialId(credentialId);
          setCredentialDraft(nextCredential ? toCredentialDraft(nextCredential) : emptyCredentialDraft);
          setIsCredentialEditorOpen(true);
        }}
        onEditStory={(storyId) => {
          const nextStory = trustActivityStories.find((item) => item.id === storyId);
          setSelectedStoryId(storyId);
          setEditingStoryId(storyId);
          setStoryDraft(nextStory ? toActivityStoryDraft(nextStory) : emptyActivityStoryDraft);
          setIsStoryEditorOpen(true);
        }}
        portfolioCount={portfolioCount}
        responseTimeGoal={responseTimeGoal}
        selectedCredentialId={selectedCredentialId}
        selectedStoryId={selectedStoryId}
        serviceCount={serviceCount}
        trustActivityStories={trustActivityStories}
        trustCredentials={trustCredentials}
      />

      {isCredentialEditorOpen ? (
        <ProfessionalDashboardTrustCredentialEditorDialog
          credentialDraft={credentialDraft}
          onChangeDraft={setCredentialDraft}
          onClose={closeCredentialEditor}
          onDelete={
            editingCredential
              ? () => {
                  onDeleteCredential(editingCredential.id);
                  setEditingCredentialId(null);
                  setIsCredentialEditorOpen(false);
                  onNotice(t('trust.credentialDeleteSuccess'));
                }
              : undefined
          }
          onSave={() => {
            const nextId = onUpsertCredential({
              id: editingCredentialId || undefined,
              ...credentialDraft,
            });
            setSelectedCredentialId(nextId);
            setEditingCredentialId(nextId);
            setIsCredentialEditorOpen(false);
            onNotice(t('trust.credentialSaveSuccess'));
          }}
        />
      ) : null}

      {isStoryEditorOpen ? (
        <ProfessionalDashboardTrustStoryEditorDialog
          onChangeDraft={setStoryDraft}
          onClose={closeStoryEditor}
          onDelete={
            editingStory
              ? () => {
                  onDeleteActivityStory(editingStory.id);
                  setEditingStoryId(null);
                  setIsStoryEditorOpen(false);
                  onNotice(t('trust.storyDeleteSuccess'));
                }
              : undefined
          }
          onSave={() => {
            const nextId = onUpsertActivityStory({
              id: editingStoryId || undefined,
              ...storyDraft,
            });
            setSelectedStoryId(nextId);
            setEditingStoryId(nextId);
            setIsStoryEditorOpen(false);
            onNotice(t('trust.storySaveSuccess'));
          }}
          storyDraft={storyDraft}
        />
      ) : null}
    </>
  );
};
