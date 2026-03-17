import type { ProfessionalManagedRequest, ProfessionalRequestStatus, UpdateRequestStatusInput } from './contracts';

export const PROFESSIONAL_REQUEST_STATUS_ORDER: ProfessionalRequestStatus[] = [
  'new',
  'quoted',
  'scheduled',
  'completed',
];

export type RequestStatusValidationError =
  | 'customerSummaryRequired'
  | 'evidenceNoteRequired'
  | 'evidenceRequired'
  | 'invalidTransition'
  | 'paymentPending';

export interface ProfessionalRequestTransitionMeta {
  allowedStatuses: ProfessionalRequestStatus[];
  customerSummaryRequired: boolean;
  evidenceNoteRequired: boolean;
  evidenceRequired: boolean;
  isAllowed: boolean;
  nextStatus: ProfessionalRequestStatus | null;
}

export const getNextProfessionalRequestStatus = (
  status: ProfessionalRequestStatus,
): ProfessionalRequestStatus | null => {
  const statusIndex = PROFESSIONAL_REQUEST_STATUS_ORDER.indexOf(status);

  if (statusIndex === -1 || statusIndex === PROFESSIONAL_REQUEST_STATUS_ORDER.length - 1) {
    return null;
  }

  return PROFESSIONAL_REQUEST_STATUS_ORDER[statusIndex + 1] || null;
};

export const getProfessionalRequestTransitionMeta = (
  currentStatus: ProfessionalRequestStatus,
  nextStatus: ProfessionalRequestStatus,
): ProfessionalRequestTransitionMeta => {
  const computedNextStatus = getNextProfessionalRequestStatus(currentStatus);
  const isAllowed = computedNextStatus === nextStatus;

  return {
    allowedStatuses: computedNextStatus ? [computedNextStatus] : [],
    customerSummaryRequired: isAllowed,
    evidenceNoteRequired: isAllowed && nextStatus === 'completed',
    evidenceRequired: isAllowed && nextStatus !== 'new',
    isAllowed,
    nextStatus: computedNextStatus,
  };
};

export const validateProfessionalRequestStatusUpdate = (
  request: ProfessionalManagedRequest,
  nextStatus: ProfessionalRequestStatus,
  input?: UpdateRequestStatusInput,
): RequestStatusValidationError | null => {
  const transition = getProfessionalRequestTransitionMeta(request.status, nextStatus);

  if (!transition.isAllowed) {
    return 'invalidTransition';
  }

  if (
    request.status === 'quoted' &&
    nextStatus === 'scheduled' &&
    request.customerStatus === 'approved_waiting_payment'
  ) {
    return 'paymentPending';
  }

  if (transition.customerSummaryRequired && !input?.customerSummary?.trim()) {
    return 'customerSummaryRequired';
  }

  if (transition.evidenceNoteRequired && !input?.evidenceNote?.trim()) {
    return 'evidenceNoteRequired';
  }

  if (transition.evidenceRequired && !input?.evidenceNote?.trim() && !input?.evidenceUrl?.trim()) {
    return 'evidenceRequired';
  }

  return null;
};
