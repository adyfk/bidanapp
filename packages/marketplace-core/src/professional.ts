import {
  type CreatePlatformOfferingInput,
  createProfessionalPlatformOffering,
  fetchProfessionalPlatformWorkspace,
  fetchProfessionalWorkspaceOrders,
  fetchProfessionalWorkspaceSnapshot,
  issueProfessionalDocumentUploadToken,
  type ProfessionalDocumentUploadToken,
  type ProfessionalOrderSummary,
  type ProfessionalPlatformWorkspace,
  type ProfessionalWorkspaceSnapshot,
  type ReplaceProfessionalAvailabilityInput,
  type ReplaceProfessionalCoverageInput,
  type ReplaceProfessionalPortfolioInput,
  type ReplaceProfessionalTrustInput,
  replaceProfessionalWorkspaceAvailability,
  replaceProfessionalWorkspaceCoverage,
  replaceProfessionalWorkspacePortfolio,
  replaceProfessionalWorkspaceTrust,
  saveProfessionalPlatformApplication,
  type UpdateProfessionalNotificationPreferencesInput,
  type UpsertProfessionalPlatformApplicationInput,
  type UpsertProfessionalWorkspaceProfileInput,
  updateProfessionalWorkspaceNotifications,
  upsertProfessionalWorkspaceProfile,
} from '@marketplace/sdk';

export interface ProfessionalWorkspaceController {
  createOffering: typeof createProfessionalPlatformOffering;
  fetchPlatformWorkspace: typeof fetchProfessionalPlatformWorkspace;
  fetchOrders: typeof fetchProfessionalWorkspaceOrders;
  fetchSnapshot: typeof fetchProfessionalWorkspaceSnapshot;
  issueDocumentUploadToken: typeof issueProfessionalDocumentUploadToken;
  replaceAvailability: typeof replaceProfessionalWorkspaceAvailability;
  replaceCoverage: typeof replaceProfessionalWorkspaceCoverage;
  replacePortfolio: typeof replaceProfessionalWorkspacePortfolio;
  replaceTrust: typeof replaceProfessionalWorkspaceTrust;
  saveApplication: typeof saveProfessionalPlatformApplication;
  updateNotifications: typeof updateProfessionalWorkspaceNotifications;
  upsertProfile: typeof upsertProfessionalWorkspaceProfile;
}

export interface ProfessionalWorkspaceSummary {
  approvedOfferingCount: number;
  documentCount: number;
  profileCompletionLabel: string;
  reviewStatus: string;
}

function readWorkspaceAttribute(attributes: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = attributes?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function mapProfessionalWorkspaceSummary(
  snapshot: ProfessionalWorkspaceSnapshot | null | undefined,
): ProfessionalWorkspaceSummary {
  const approvedOfferingCount =
    snapshot?.offerings?.filter((item) => item.status === 'published' || item.status === 'active').length ?? 0;
  const documentCount = snapshot?.application?.documents?.length ?? 0;
  const profileAttributes = snapshot?.profile?.attributes;
  const applicationAttributes = snapshot?.application?.attributes;
  const completedFields = [
    snapshot?.profile?.displayName,
    readWorkspaceAttribute(profileAttributes, 'headline'),
    readWorkspaceAttribute(profileAttributes, 'bio'),
    snapshot?.profile?.city,
    readWorkspaceAttribute(applicationAttributes, 'summary'),
  ].filter(Boolean).length;

  return {
    approvedOfferingCount,
    documentCount,
    profileCompletionLabel: `${completedFields}/4`,
    reviewStatus: snapshot?.application?.status ?? snapshot?.profile?.reviewStatus ?? 'draft',
  };
}

export function createProfessionalWorkspaceController(): ProfessionalWorkspaceController {
  return {
    createOffering: createProfessionalPlatformOffering,
    fetchOrders: fetchProfessionalWorkspaceOrders,
    fetchPlatformWorkspace: fetchProfessionalPlatformWorkspace,
    fetchSnapshot: fetchProfessionalWorkspaceSnapshot,
    issueDocumentUploadToken: issueProfessionalDocumentUploadToken,
    replaceAvailability: replaceProfessionalWorkspaceAvailability,
    replaceCoverage: replaceProfessionalWorkspaceCoverage,
    replacePortfolio: replaceProfessionalWorkspacePortfolio,
    replaceTrust: replaceProfessionalWorkspaceTrust,
    saveApplication: saveProfessionalPlatformApplication,
    updateNotifications: updateProfessionalWorkspaceNotifications,
    upsertProfile: upsertProfessionalWorkspaceProfile,
  };
}

export type {
  CreatePlatformOfferingInput,
  ProfessionalDocumentUploadToken,
  ProfessionalOrderSummary,
  ProfessionalPlatformWorkspace,
  ProfessionalWorkspaceSnapshot,
  ReplaceProfessionalAvailabilityInput,
  ReplaceProfessionalCoverageInput,
  ReplaceProfessionalPortfolioInput,
  ReplaceProfessionalTrustInput,
  UpdateProfessionalNotificationPreferencesInput,
  UpsertProfessionalPlatformApplicationInput,
  UpsertProfessionalWorkspaceProfileInput,
};
export {
  createProfessionalPlatformOffering,
  fetchProfessionalPlatformWorkspace,
  fetchProfessionalWorkspaceOrders,
  fetchProfessionalWorkspaceSnapshot,
  issueProfessionalDocumentUploadToken,
  replaceProfessionalWorkspaceAvailability,
  replaceProfessionalWorkspaceCoverage,
  replaceProfessionalWorkspacePortfolio,
  replaceProfessionalWorkspaceTrust,
  saveProfessionalPlatformApplication,
  updateProfessionalWorkspaceNotifications,
  upsertProfessionalWorkspaceProfile,
};
