import type {
  PlatformCopyPack,
  PlatformLocale,
  PlatformTheme,
  ServicePlatformConfig,
  ServicePlatformId,
} from '@marketplace/platform-config';
import type { ViewerSession } from '@marketplace/sdk';

export interface MarketplaceRuntimeContext {
  copy: PlatformCopyPack;
  locale: PlatformLocale;
  platform: ServicePlatformConfig;
  platformId: ServicePlatformId;
  theme: PlatformTheme;
}

export interface ViewerAccessState {
  isAuthenticated: boolean;
  isCustomer: boolean;
  isProfessional: boolean;
  phone?: string;
  platformMembershipIds: string[];
  professionalReviewStatus?: string;
}

export function deriveViewerAccessState(
  session: ViewerSession | null | undefined,
  platformId?: ServicePlatformId,
): ViewerAccessState {
  const membership = platformId
    ? session?.platformMemberships?.find((item) => item.platformId === platformId)
    : undefined;

  return {
    isAuthenticated: Boolean(session?.isAuthenticated),
    isCustomer: Boolean(session?.customerProfile || session?.userId),
    isProfessional: Boolean(membership),
    phone: session?.phone,
    platformMembershipIds: session?.platformMemberships?.map((item) => item.platformId) ?? [],
    professionalReviewStatus: membership?.reviewStatus,
  };
}
