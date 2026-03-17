'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { validateProfessionalRequestStatusUpdate } from '@/features/professional-portal/lib/request-status';
import { requestStatuses } from './helpers';
import { ProfessionalDashboardRequestStatusDialog } from './ProfessionalDashboardRequestStatusDialog';
import { ProfessionalDashboardRequestsTab } from './ProfessionalDashboardRequestsTab';
import { ProfessionalDashboardShell } from './ProfessionalDashboardShell';
import type { RequestFilter, RequestStatusDraft } from './types';
import { useDashboardDialogLifecycle } from './useDashboardDialogLifecycle';
import { useProfessionalDashboardPageData } from './useProfessionalDashboardPageData';

export const ProfessionalDashboardRequestsScreen = () => {
  const searchParams = useSearchParams();
  const requestedFilterParam = searchParams.get('status');
  const requestedRequestId = searchParams.get('request');
  const requestedFilter = requestStatuses.includes(requestedFilterParam as RequestFilter)
    ? (requestedFilterParam as RequestFilter)
    : 'new';
  const {
    activeCoverageAreas,
    activeProfessional,
    activeReviewState,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    getAreaLabel,
    hasMounted,
    getModeLabel,
    getServiceLabel,
    isPublishedProfessional,
    isProfessional,
    onboardingState,
    publishProfessionalProfile,
    portalState,
    requestStatusCounts,
    simulateProfessionalAdminReview,
    submitProfessionalProfileForReview,
    t,
    updateRequestStatus,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>(requestedFilter);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState(
    requestedRequestId || portalState.requestBoard[0]?.id || '',
  );
  const [statusDraft, setStatusDraft] = useState<RequestStatusDraft | null>(null);
  const priorityRank = {
    high: 0,
    medium: 1,
    low: 2,
  } as const;
  const filteredRequests = [...portalState.requestBoard]
    .filter((request) => request.status === requestFilter)
    .sort((leftRequest, rightRequest) => {
      const priorityDifference = priorityRank[leftRequest.priority] - priorityRank[rightRequest.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const leftUpdatedAt =
        leftRequest.statusHistory[leftRequest.statusHistory.length - 1]?.createdAt || leftRequest.requestedAt;
      const rightUpdatedAt =
        rightRequest.statusHistory[rightRequest.statusHistory.length - 1]?.createdAt || rightRequest.requestedAt;

      return new Date(rightUpdatedAt).getTime() - new Date(leftUpdatedAt).getTime();
    });
  const selectedRequest =
    portalState.requestBoard.find((currentRequest) => currentRequest.id === selectedRequestId) ||
    portalState.requestBoard[0] ||
    null;

  const closeStatusDialog = () => {
    setStatusError(null);
    setStatusDraft(null);
    setIsStatusDialogOpen(false);
  };

  useDashboardDialogLifecycle(isStatusDialogOpen, closeStatusDialog);

  useEffect(() => {
    setRequestFilter(requestedFilter);
  }, [requestedFilter]);

  useEffect(() => {
    if (requestedRequestId) {
      setSelectedRequestId(requestedRequestId);
      return;
    }

    if (!selectedRequestId && portalState.requestBoard[0]?.id) {
      setSelectedRequestId(portalState.requestBoard[0].id);
    }
  }, [portalState.requestBoard, requestedRequestId, selectedRequestId]);

  useEffect(() => {
    if (!requestedRequestId) {
      return;
    }

    const target = document.getElementById(`professional-request-card-${requestedRequestId}`);

    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [requestedRequestId]);

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
      activeTab="requests"
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
      <ProfessionalDashboardRequestsTab
        filteredRequests={filteredRequests}
        getAreaLabel={getAreaLabel}
        getModeLabel={getModeLabel}
        getServiceLabel={getServiceLabel}
        isPublishedProfessional={isPublishedProfessional}
        requestFilter={requestFilter}
        requestStatusCounts={requestStatusCounts}
        selectedRequestId={selectedRequestId}
        setRequestFilter={setRequestFilter}
        onChangeStatus={(requestId, status) => {
          const request = portalState.requestBoard.find((currentRequest) => currentRequest.id === requestId);
          if (!request || request.status === status) {
            return;
          }

          setStatusError(null);
          setSelectedRequestId(requestId);
          setStatusDraft({
            customerSummary: '',
            evidenceNote: '',
            evidenceUrl: '',
            nextStatus: status,
          });
          setIsStatusDialogOpen(true);
        }}
      />

      {isStatusDialogOpen && selectedRequest && statusDraft
        ? (() => {
            const validationError = validateProfessionalRequestStatusUpdate(selectedRequest, statusDraft.nextStatus, {
              customerSummary: statusDraft.customerSummary,
              evidenceNote: statusDraft.evidenceNote,
              evidenceUrl: statusDraft.evidenceUrl,
            });

            return (
              <ProfessionalDashboardRequestStatusDialog
                draft={statusDraft}
                getAreaLabel={getAreaLabel}
                getServiceLabel={getServiceLabel}
                onChangeDraft={(draft) => {
                  setStatusError(null);
                  setStatusDraft(draft);
                }}
                onClose={closeStatusDialog}
                onSave={() => {
                  const result = updateRequestStatus(selectedRequest.id, statusDraft.nextStatus, {
                    customerSummary: statusDraft.customerSummary,
                    evidenceNote: statusDraft.evidenceNote,
                    evidenceUrl: statusDraft.evidenceUrl,
                  });

                  if (!result.ok) {
                    setStatusError(t(`requests.errors.${result.error}`));
                    return;
                  }

                  setNotice(
                    t('requests.saveSuccess', {
                      client: selectedRequest.clientName,
                      status: t(`requests.status.${statusDraft.nextStatus}`),
                    }),
                  );
                  closeStatusDialog();
                }}
                request={selectedRequest}
                saveDisabled={Boolean(validationError)}
                statusLabel={(status) => t(`requests.status.${status}`)}
                validationMessage={statusError || (validationError ? t(`requests.errors.${validationError}`) : null)}
              />
            );
          })()
        : null}
    </ProfessionalDashboardShell>
  );
};
