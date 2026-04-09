package viewerauth

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/platform/web"
)

type viewerAuthSessionInput struct {
	Body ViewerAuthCreateSessionRequest
}

type viewerAuthRegisterInput struct {
	Body ViewerAuthRegisterRequest
}

type viewerCustomerProfileInput struct {
	Body UpdateViewerCustomerProfileRequest
}

type viewerForgotPasswordInput struct {
	Body ViewerAuthForgotPasswordRequest
}

type viewerResetPasswordInput struct {
	Body ViewerAuthResetPasswordRequest
}

type viewerCreateChallengeInput struct {
	Body ViewerAuthCreateChallengeRequest
}

type viewerVerifyChallengeInput struct {
	Body ViewerAuthVerifyChallengeRequest
}

type viewerRevokeSessionInput struct {
	SessionID string `path:"session_id"`
}

type viewerAuthSessionResponseBody struct {
	Data ViewerAuthSessionData `json:"data"`
}

type viewerAuthSessionResponse struct {
	Body viewerAuthSessionResponseBody
}

type viewerAuthSessionCookieResponse struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Body      viewerAuthSessionResponseBody
}

type viewerAuthChallengeResponseBody struct {
	Data AuthChallenge `json:"data"`
}

type viewerAuthChallengeResponse struct {
	Body viewerAuthChallengeResponseBody
}

type viewerAuthRecoveryResponseBody struct {
	Data AuthRecoveryRequest `json:"data"`
}

type viewerAuthRecoveryResponse struct {
	Body viewerAuthRecoveryResponseBody
}

type viewerAuthSessionListResponseBody struct {
	Data AuthSessionList `json:"data"`
}

type viewerAuthSessionListResponse struct {
	Body viewerAuthSessionListResponseBody
}

type viewerAuthSessionMutationResponseBody struct {
	Data AuthSessionMutationResult `json:"data"`
}

type viewerAuthSessionMutationResponse struct {
	Body viewerAuthSessionMutationResponseBody
}

type viewerAuthSessionMutationCookieResponse struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Body      viewerAuthSessionMutationResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "register-viewer-auth-account",
		Method:      http.MethodPost,
		Path:        "/auth/register",
		Summary:     "Register one global viewer identity and issue a shared session",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerAuthRegisterInput) (*viewerAuthSessionCookieResponse, error) {
		payload, err := service.Register(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "request-viewer-password-reset",
		Method:      http.MethodPost,
		Path:        "/auth/password/forgot",
		Summary:     "Request an SMS password reset challenge for a viewer identity",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusServiceUnavailable, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerForgotPasswordInput) (*viewerAuthRecoveryResponse, error) {
		payload, err := service.ForgotPassword(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthRecoveryResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "reset-viewer-password",
		Method:      http.MethodPost,
		Path:        "/auth/password/reset",
		Summary:     "Reset a viewer password by consuming a verified SMS challenge",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusServiceUnavailable, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerResetPasswordInput) (*viewerAuthRecoveryResponse, error) {
		payload, err := service.ResetPassword(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthRecoveryResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-viewer-auth-sms-challenge",
		Method:      http.MethodPost,
		Path:        "/auth/challenges/sms",
		Summary:     "Issue an SMS challenge for password recovery or identity verification",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusServiceUnavailable, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerCreateChallengeInput) (*viewerAuthChallengeResponse, error) {
		payload, err := service.CreateSMSChallenge(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthChallengeResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "verify-viewer-auth-challenge",
		Method:      http.MethodPost,
		Path:        "/auth/challenges/verify",
		Summary:     "Verify an SMS challenge code",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusTooManyRequests, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerVerifyChallengeInput) (*viewerAuthChallengeResponse, error) {
		payload, err := service.VerifyChallenge(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthChallengeResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-viewer-auth-session",
		Method:      http.MethodPost,
		Path:        "/auth/login",
		Summary:     "Create one global viewer session from a phone identity",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerAuthSessionInput) (*viewerAuthSessionCookieResponse, error) {
		payload, err := service.Login(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-viewer-auth-session",
		Method:      http.MethodGet,
		Path:        "/auth/session",
		Summary:     "Get the active global viewer session if one is available",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*viewerAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			response := &viewerAuthSessionResponse{}
			response.Body.Data = AnonymousSession()
			return response, nil
		}

		response := &viewerAuthSessionResponse{}
		response.Body.Data = authSession.Session
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "update-viewer-customer-profile",
		Method:      http.MethodPut,
		Path:        "/auth/profile",
		Summary:     "Update the global customer profile for the authenticated viewer",
		Tags:        []string{"Viewer Auth"},
		Security: []map[string][]string{
			{SecuritySchemeName: {}},
		},
		Errors: []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerCustomerProfileInput) (*viewerAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.UpdateCustomerProfile(ctx, authSession.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "delete-viewer-auth-session",
		Method:      http.MethodDelete,
		Path:        "/auth/session",
		Summary:     "Revoke the active global viewer session",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*viewerAuthSessionCookieResponse, error) {
		response := &viewerAuthSessionCookieResponse{}
		response.SetCookie = service.ExpiredSessionCookie()

		authSession, ok := ContextSession(ctx)
		if !ok {
			response.Body.Data = AnonymousSession()
			return response, nil
		}

		payload, err := service.Logout(ctx, authSession.TokenHash)
		if err != nil {
			return nil, toAPIError(err)
		}

		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "list-viewer-auth-sessions",
		Method:      http.MethodGet,
		Path:        "/auth/sessions",
		Summary:     "List active and recent viewer sessions for the authenticated user",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*viewerAuthSessionListResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.ListSessions(ctx, authSession.TokenHash, authSession.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthSessionListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "revoke-viewer-auth-session",
		Method:      http.MethodDelete,
		Path:        "/auth/sessions/{session_id}",
		Summary:     "Revoke one viewer session by session id",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *viewerRevokeSessionInput) (*viewerAuthSessionMutationCookieResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, expireCookie, err := service.RevokeSessionByID(ctx, authSession.TokenHash, authSession.Session.UserID, input.SessionID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthSessionMutationCookieResponse{}
		if expireCookie {
			response.SetCookie = service.ExpiredSessionCookie()
		}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "logout-all-other-viewer-auth-sessions",
		Method:      http.MethodPost,
		Path:        "/auth/sessions/logout-all",
		Summary:     "Revoke every other viewer session except the current one",
		Tags:        []string{"Viewer Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*viewerAuthSessionMutationResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.LogoutAllOtherSessions(ctx, authSession)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerAuthSessionMutationResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withViewerSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrInvalidCredentials):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_viewer_credentials", "invalid phone or password")
	case errors.Is(err, ErrInvalidPhone), errors.Is(err, ErrInvalidDisplayName), errors.Is(err, ErrWeakPassword), errors.Is(err, ErrInvalidChallenge), errors.Is(err, ErrInvalidChallengeCode), errors.Is(err, ErrInvalidChallengeType), errors.Is(err, ErrResetRequiresPhone):
		return web.NewAPIError(http.StatusBadRequest, "invalid_viewer_auth_payload", err.Error())
	case errors.Is(err, ErrPhoneAlreadyInUse):
		return web.NewAPIError(http.StatusConflict, "viewer_identity_conflict", "phone is already in use")
	case errors.Is(err, ErrChallengeNotFound):
		return web.NewAPIError(http.StatusNotFound, "viewer_challenge_not_found", "viewer challenge not found")
	case errors.Is(err, ErrChallengeExpired):
		return web.NewAPIError(http.StatusBadRequest, "viewer_challenge_expired", "viewer challenge expired")
	case errors.Is(err, ErrChallengeConsumed):
		return web.NewAPIError(http.StatusBadRequest, "viewer_challenge_consumed", "viewer challenge already consumed")
	case errors.Is(err, ErrChallengeRateLimited):
		return web.NewAPIError(http.StatusTooManyRequests, "viewer_challenge_rate_limited", "too many invalid challenge attempts")
	case errors.Is(err, ErrChallengeUnverified):
		return web.NewAPIError(http.StatusBadRequest, "viewer_challenge_unverified", "viewer challenge has not been verified")
	case errors.Is(err, ErrMissingAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "missing_viewer_session", "missing viewer authenticated session")
	case errors.Is(err, ErrInvalidAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_viewer_session", "invalid viewer authenticated session")
	case errors.Is(err, ErrSessionExpired):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_expired", "viewer session expired")
	case errors.Is(err, ErrSessionRevoked):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_revoked", "viewer session revoked")
	case errors.Is(err, ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_not_found", "viewer session not found")
	case errors.Is(err, ErrUnsupportedSMS):
		return web.NewAPIError(http.StatusServiceUnavailable, "viewer_sms_unavailable", "sms delivery is temporarily unavailable")
	case errors.Is(err, ErrDatabaseUnavailable):
		return web.NewAPIError(http.StatusInternalServerError, "database_unavailable", "database connection is required")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
