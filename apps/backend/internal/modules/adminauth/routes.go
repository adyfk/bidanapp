package adminauth

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/platform/web"
)

type adminAuthCreateSessionInput struct {
	Body AdminAuthCreateSessionRequest
}

type adminAuthUpdateSessionInput struct {
	Body AdminAuthSessionUpdateRequest
}

type adminAuthSessionResponseBody struct {
	Data AdminAuthSessionData `json:"data"`
}

type adminAuthSessionResponse struct {
	Body adminAuthSessionResponseBody
}

type adminAuthSessionCookieResponse struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Body      adminAuthSessionResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "create-admin-auth-session",
		Method:      http.MethodPost,
		Path:        "/admin/auth/session",
		Summary:     "Create an authenticated admin session",
		Tags:        []string{"Admin Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusTooManyRequests, http.StatusInternalServerError, http.StatusServiceUnavailable},
	}, func(ctx context.Context, input *adminAuthCreateSessionInput) (*adminAuthSessionCookieResponse, error) {
		payload, err := service.Login(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-auth-session",
		Method:      http.MethodGet,
		Path:        "/admin/auth/session",
		Summary:     "Get the authenticated admin session",
		Tags:        []string{"Admin Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*adminAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		response := &adminAuthSessionResponse{}
		response.Body.Data = authSession.Session
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "update-admin-auth-session",
		Method:      http.MethodPut,
		Path:        "/admin/auth/session",
		Summary:     "Update authenticated admin session metadata",
		Tags:        []string{"Admin Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminAuthUpdateSessionInput) (*adminAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.UpdateSession(ctx, authSession.TokenHash, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminAuthSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "delete-admin-auth-session",
		Method:      http.MethodDelete,
		Path:        "/admin/auth/session",
		Summary:     "Revoke the authenticated admin session",
		Tags:        []string{"Admin Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*adminAuthSessionCookieResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.Logout(ctx, authSession.TokenHash)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminAuthSessionCookieResponse{}
		response.SetCookie = service.ExpiredSessionCookie()
		response.Body.Data = payload
		return response, nil
	})
}

func withAdminSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrInvalidCredentials):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_admin_credentials", "invalid admin email or password")
	case errors.Is(err, ErrMissingAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "missing_admin_session", "missing admin authenticated session")
	case errors.Is(err, ErrInvalidAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_admin_session", "invalid admin authenticated session")
	case errors.Is(err, ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
	case errors.Is(err, ErrSessionExpired):
		return web.NewAPIError(http.StatusUnauthorized, "admin_session_expired", "admin session expired")
	case errors.Is(err, ErrSessionRevoked):
		return web.NewAPIError(http.StatusUnauthorized, "admin_session_revoked", "admin session revoked")
	case errors.Is(err, ErrInvalidSessionPayload):
		return web.NewAPIError(http.StatusInternalServerError, "invalid_admin_session_payload", "invalid admin session payload")
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
