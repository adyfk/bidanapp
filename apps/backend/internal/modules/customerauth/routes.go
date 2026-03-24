package customerauth

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/platform/web"
)

type customerAuthCreateSessionInput struct {
	Body CustomerAuthCreateSessionRequest
}

type customerAuthRegisterInput struct {
	Body CustomerAuthRegisterRequest
}

type customerAuthUpdateAccountInput struct {
	Body CustomerAuthUpdateAccountRequest
}

type customerAuthUpdatePasswordInput struct {
	Body CustomerAuthUpdatePasswordRequest
}

type customerAuthSessionResponseBody struct {
	Data CustomerAuthSessionData `json:"data"`
}

type customerAuthSessionResponse struct {
	Body customerAuthSessionResponseBody
}

type customerAuthSessionCookieResponse struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Body      customerAuthSessionResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "register-customer-auth-account",
		Method:      http.MethodPost,
		Path:        "/customers/auth/register",
		Summary:     "Register a customer account",
		Tags:        []string{"Customer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusTooManyRequests, http.StatusInternalServerError, http.StatusServiceUnavailable},
	}, func(ctx context.Context, input *customerAuthRegisterInput) (*customerAuthSessionCookieResponse, error) {
		payload, err := service.Register(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-customer-auth-session",
		Method:      http.MethodPost,
		Path:        "/customers/auth/session",
		Summary:     "Create an authenticated customer session",
		Tags:        []string{"Customer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusTooManyRequests, http.StatusInternalServerError, http.StatusServiceUnavailable},
	}, func(ctx context.Context, input *customerAuthCreateSessionInput) (*customerAuthSessionCookieResponse, error) {
		payload, err := service.Login(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "get-customer-auth-session",
		Method:      http.MethodGet,
		Path:        "/customers/auth/session",
		Summary:     "Get the authenticated customer session",
		Tags:        []string{"Customer Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*customerAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		response := &customerAuthSessionResponse{}
		response.Body.Data = authSession.Session
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "delete-customer-auth-session",
		Method:      http.MethodDelete,
		Path:        "/customers/auth/session",
		Summary:     "Revoke the authenticated customer session",
		Tags:        []string{"Customer Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*customerAuthSessionCookieResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.Logout(ctx, authSession.TokenHash)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerAuthSessionCookieResponse{}
		response.SetCookie = service.ExpiredSessionCookie()
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "update-customer-auth-account",
		Method:      http.MethodPut,
		Path:        "/customers/auth/account",
		Summary:     "Update authenticated customer account metadata",
		Tags:        []string{"Customer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerAuthUpdateAccountInput) (*customerAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.UpdateAccount(ctx, authSession.TokenHash, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerAuthSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "update-customer-auth-password",
		Method:      http.MethodPut,
		Path:        "/customers/auth/password",
		Summary:     "Change the authenticated customer password",
		Tags:        []string{"Customer Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerAuthUpdatePasswordInput) (*customerAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.UpdatePassword(ctx, authSession.TokenHash, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerAuthSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withCustomerSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrInvalidPhone),
		errors.Is(err, ErrInvalidDisplayName),
		errors.Is(err, ErrWeakPassword):
		return web.NewAPIError(http.StatusBadRequest, "invalid_customer_auth_payload", err.Error())
	case errors.Is(err, ErrPhoneAlreadyInUse):
		return web.NewAPIError(http.StatusConflict, "customer_phone_in_use", "customer phone is already in use")
	case errors.Is(err, ErrInvalidCredentials):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_customer_credentials", "invalid customer credentials")
	case errors.Is(err, ErrMissingAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "missing_customer_session", "missing customer authenticated session")
	case errors.Is(err, ErrInvalidAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_customer_session", "invalid customer authenticated session")
	case errors.Is(err, ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
	case errors.Is(err, ErrSessionExpired):
		return web.NewAPIError(http.StatusUnauthorized, "customer_session_expired", "customer session expired")
	case errors.Is(err, ErrSessionRevoked):
		return web.NewAPIError(http.StatusUnauthorized, "customer_session_revoked", "customer session revoked")
	case errors.Is(err, ErrAccountNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "customer_account_not_found", "customer account not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
