import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type ViewerAuthCreateSessionInput = MarketplaceComponents['schemas']['ViewerAuthCreateSessionRequest'];
export type ViewerAuthCreateChallengeInput = MarketplaceComponents['schemas']['ViewerAuthCreateChallengeRequest'];
export type ViewerAuthForgotPasswordInput = MarketplaceComponents['schemas']['ViewerAuthForgotPasswordRequest'];
export type ViewerAuthRegisterInput = MarketplaceComponents['schemas']['ViewerAuthRegisterRequest'];
export type ViewerAuthResetPasswordInput = MarketplaceComponents['schemas']['ViewerAuthResetPasswordRequest'];
export type ViewerAuthVerifyChallengeInput = MarketplaceComponents['schemas']['ViewerAuthVerifyChallengeRequest'];
export type ViewerAuthChallenge = MarketplaceComponents['schemas']['AuthChallenge'];
export type ViewerAuthRecoveryRequest = MarketplaceComponents['schemas']['AuthRecoveryRequest'];
export type ViewerDeviceSession = MarketplaceComponents['schemas']['AuthDeviceSession'];
export type ViewerSessionList = MarketplaceComponents['schemas']['AuthSessionList'];
export type ViewerSessionMutationResult = MarketplaceComponents['schemas']['AuthSessionMutationResult'];
export type ViewerCustomerProfileUpdateInput = MarketplaceComponents['schemas']['UpdateViewerCustomerProfileRequest'];
export type ViewerSession = MarketplaceComponents['schemas']['ViewerAuthSessionData'];

function resolveAPIErrorMessage(result: { error?: unknown }, fallbackMessage: string) {
  const payload = result.error as
    | {
        error?: {
          message?: string;
        };
        message?: string;
      }
    | undefined;

  return payload?.error?.message || payload?.message || fallbackMessage;
}

export async function createViewerAuthSession(
  client: MarketplaceApiClient,
  input: ViewerAuthCreateSessionInput,
): Promise<ViewerSession> {
  const result = await client.POST('/auth/login', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to create viewer auth session'));
  }

  return result.data.data;
}

export async function registerViewerAuthAccount(
  client: MarketplaceApiClient,
  input: ViewerAuthRegisterInput,
): Promise<ViewerSession> {
  const result = await client.POST('/auth/register', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to register viewer auth account'));
  }

  return result.data.data;
}

export async function fetchViewerAuthSession(client: MarketplaceApiClient): Promise<ViewerSession> {
  const result = await client.GET('/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to load viewer auth session'));
  }

  return result.data.data;
}

export async function deleteViewerAuthSession(client: MarketplaceApiClient): Promise<ViewerSession> {
  const result = await client.DELETE('/auth/session');

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to delete viewer auth session'));
  }

  return result.data.data;
}

export async function updateViewerCustomerProfile(
  client: MarketplaceApiClient,
  input: ViewerCustomerProfileUpdateInput,
): Promise<ViewerSession> {
  const result = await client.PUT('/auth/profile', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to update viewer customer profile'));
  }

  return result.data.data;
}

export async function requestViewerPasswordReset(
  client: MarketplaceApiClient,
  input: ViewerAuthForgotPasswordInput,
): Promise<ViewerAuthRecoveryRequest> {
  const result = await client.POST('/auth/password/forgot', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to request viewer password reset'));
  }

  return result.data.data;
}

export async function resetViewerPassword(
  client: MarketplaceApiClient,
  input: ViewerAuthResetPasswordInput,
): Promise<ViewerAuthRecoveryRequest> {
  const result = await client.POST('/auth/password/reset', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to reset viewer password'));
  }

  return result.data.data;
}

export async function createViewerSMSChallenge(
  client: MarketplaceApiClient,
  input: ViewerAuthCreateChallengeInput,
): Promise<ViewerAuthChallenge> {
  const result = await client.POST('/auth/challenges/sms', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to create viewer SMS challenge'));
  }

  return result.data.data;
}

export async function verifyViewerAuthChallenge(
  client: MarketplaceApiClient,
  input: ViewerAuthVerifyChallengeInput,
): Promise<ViewerAuthChallenge> {
  const result = await client.POST('/auth/challenges/verify', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to verify viewer auth challenge'));
  }

  return result.data.data;
}

export async function fetchViewerSessions(client: MarketplaceApiClient): Promise<ViewerSessionList> {
  const result = await client.GET('/auth/sessions');

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to load viewer sessions'));
  }

  return result.data.data;
}

export async function revokeViewerSession(
  client: MarketplaceApiClient,
  sessionId: string,
): Promise<ViewerSessionMutationResult> {
  const result = await client.DELETE('/auth/sessions/{session_id}', {
    params: {
      path: {
        session_id: sessionId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to revoke viewer session'));
  }

  return result.data.data;
}

export async function logoutOtherViewerSessions(client: MarketplaceApiClient): Promise<ViewerSessionMutationResult> {
  const result = await client.POST('/auth/sessions/logout-all');

  if (result.error || !result.data?.data) {
    throw new Error(resolveAPIErrorMessage(result, 'Failed to revoke other viewer sessions'));
  }

  return result.data.data;
}
