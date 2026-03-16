'use client';

import { useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { ProfessionalSetupScreen } from '@/components/screens/ProfessionalSetupScreen';
import { validateProfessionalRequestStatusUpdate } from '@/features/professional-portal/lib/request-status';
import { ProfessionalDashboardRequestStatusDialog } from './ProfessionalDashboardRequestStatusDialog';
import { ProfessionalDashboardRequestsTab } from './ProfessionalDashboardRequestsTab';
import { ProfessionalDashboardShell } from './ProfessionalDashboardShell';
import type { RequestFilter, RequestStatusDraft } from './types';
import { useDashboardDialogLifecycle } from './useDashboardDialogLifecycle';
import { useProfessionalDashboardPageData } from './useProfessionalDashboardPageData';

export const ProfessionalDashboardRequestsScreen = () => {
  const {
    activeCoverageAreas,
    activeProfessional,
    activeServiceConfigurations,
    averageServicePriceLabel,
    clampedCompletionScore,
    dashboardLocationLabel,
    getAreaLabel,
    hasMounted,
    getModeLabel,
    getServiceLabel,
    isProfessional,
    portalState,
    requestStatusCounts,
    t,
    updateRequestStatus,
  } = useProfessionalDashboardPageData();
  const [notice, setNotice] = useState<string | null>(null);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('new');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState(portalState.requestBoard[0]?.id || '');
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
      activeTab="requests"
      averageServicePriceLabel={averageServicePriceLabel}
      clampedCompletionScore={clampedCompletionScore}
      headerLocationLabel={dashboardLocationLabel}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      responseTimeGoal={portalState.responseTimeGoal}
    >
      <ProfessionalDashboardRequestsTab
        filteredRequests={filteredRequests}
        getAreaLabel={getAreaLabel}
        getModeLabel={getModeLabel}
        getServiceLabel={getServiceLabel}
        requestFilter={requestFilter}
        requestStatusCounts={requestStatusCounts}
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
