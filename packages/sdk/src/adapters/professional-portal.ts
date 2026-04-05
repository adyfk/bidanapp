import type { BidanappApiClient, BidanappComponents } from '../client';

export type ProfessionalPortalSession = BidanappComponents['schemas']['ProfessionalPortalSessionData'];
export type ProfessionalPortalSessionSnapshot = Record<string, unknown>;
export type ProfessionalPortalProfile = BidanappComponents['schemas']['ProfessionalPortalProfileData'];
export type ProfessionalPortalProfileUpsertInput = BidanappComponents['schemas']['UpsertProfessionalPortalProfileData'];
export type ProfessionalPortalCoverage = BidanappComponents['schemas']['ProfessionalPortalCoverageData'];
export type ProfessionalPortalServices = BidanappComponents['schemas']['ProfessionalPortalServicesData'];
export type ProfessionalPortalRequests = BidanappComponents['schemas']['ProfessionalPortalRequestsData'];
export type ProfessionalPortalPortfolio = BidanappComponents['schemas']['ProfessionalPortalPortfolioData'];
export type ProfessionalPortalGallery = BidanappComponents['schemas']['ProfessionalPortalGalleryData'];
export type ProfessionalPortalTrust = BidanappComponents['schemas']['ProfessionalPortalTrustData'];

const professionalQueryParams = (professionalId?: string) => ({
  params: {
    query: professionalId ? { professional_id: professionalId } : {},
  },
});

export async function fetchProfessionalPortalSession(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalSession> {
  const result = await client.GET('/professionals/portal/session', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal session');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalProfile(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalProfile> {
  const result = await client.GET('/professionals/me/profile', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal profile');
  }

  return result.data.data;
}

export async function saveProfessionalPortalProfile(
  client: BidanappApiClient,
  input: ProfessionalPortalProfileUpsertInput,
): Promise<ProfessionalPortalProfile> {
  const result = await client.PUT('/professionals/me/profile', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal profile');
  }

  return result.data.data;
}

export async function submitProfessionalPortalProfileForReview(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalProfile> {
  const result = await client.POST('/professionals/me/profile/submit-review', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to submit professional portal profile for review');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalCoverage(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalCoverage> {
  const result = await client.GET('/professionals/me/coverage', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal coverage');
  }

  return result.data.data;
}

export async function saveProfessionalPortalCoverage(
  client: BidanappApiClient,
  input: ProfessionalPortalCoverage,
): Promise<ProfessionalPortalCoverage> {
  const result = await client.PUT('/professionals/me/coverage', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal coverage');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalServices(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalServices> {
  const result = await client.GET('/professionals/me/services', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal services');
  }

  return result.data.data;
}

export async function saveProfessionalPortalServices(
  client: BidanappApiClient,
  input: ProfessionalPortalServices,
): Promise<ProfessionalPortalServices> {
  const result = await client.PUT('/professionals/me/services', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal services');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalRequests(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalRequests> {
  const result = await client.GET('/professionals/me/requests', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal requests');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalPortfolio(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalPortfolio> {
  const result = await client.GET('/professionals/me/portfolio', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal portfolio');
  }

  return result.data.data;
}

export async function saveProfessionalPortalPortfolio(
  client: BidanappApiClient,
  input: ProfessionalPortalPortfolio,
): Promise<ProfessionalPortalPortfolio> {
  const result = await client.PUT('/professionals/me/portfolio', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal portfolio');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalGallery(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalGallery> {
  const result = await client.GET('/professionals/me/gallery', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal gallery');
  }

  return result.data.data;
}

export async function saveProfessionalPortalGallery(
  client: BidanappApiClient,
  input: ProfessionalPortalGallery,
): Promise<ProfessionalPortalGallery> {
  const result = await client.PUT('/professionals/me/gallery', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal gallery');
  }

  return result.data.data;
}

export async function fetchProfessionalPortalTrust(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalPortalTrust> {
  const result = await client.GET('/professionals/me/trust', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional portal trust');
  }

  return result.data.data;
}

export async function saveProfessionalPortalTrust(
  client: BidanappApiClient,
  input: ProfessionalPortalTrust,
): Promise<ProfessionalPortalTrust> {
  const result = await client.PUT('/professionals/me/trust', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal trust');
  }

  return result.data.data;
}

export async function saveProfessionalPortalRequests(
  client: BidanappApiClient,
  input: ProfessionalPortalRequests,
): Promise<ProfessionalPortalRequests> {
  const result = await client.PUT('/professionals/me/requests', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal requests');
  }

  return result.data.data;
}

export async function saveProfessionalPortalSession(
  client: BidanappApiClient,
  input: {
    professionalId?: string;
    snapshot: ProfessionalPortalSessionSnapshot;
  },
): Promise<ProfessionalPortalSession> {
  const result = await client.PUT('/professionals/portal/session', {
    body: {
      professionalId: input.professionalId,
      snapshot: input.snapshot,
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional portal session');
  }

  return result.data.data;
}
