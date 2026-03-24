package professionalauth

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/platform/web"
)

type professionalAuthCreateSessionInput struct {
	Body ProfessionalAuthCreateSessionRequest
}

type professionalAuthRegisterInput struct {
	Body ProfessionalAuthRegisterRequest
}

type professionalAuthUpdateAccountInput struct {
	Body ProfessionalAuthUpdateAccountRequest
}

type professionalAuthUpdatePasswordInput struct {
	Body ProfessionalAuthUpdatePasswordRequest
}

type professionalAuthPasswordRecoveryInput struct {
	Body ProfessionalAuthRequestPasswordRecoveryRequest
}

type professionalAuthSessionResponseBody struct {
	Data ProfessionalAuthSessionData `json:"data"`
}

type professionalAuthPasswordRecoveryResponseBody struct {
	Data ProfessionalAuthPasswordRecoveryData `json:"data"`
}

type professionalAuthSessionResponse struct {
	Body professionalAuthSessionResponseBody
}

type professionalAuthSessionCookieResponse struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
	Body      professionalAuthSessionResponseBody
}

type professionalAuthPasswordRecoveryResponse struct {
	Body professionalAuthPasswordRecoveryResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "register-professional-auth-account",
		Method:      http.MethodPost,
		Path:        "/professionals/auth/register",
		Summary:     "Register a professional portal account",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusTooManyRequests, http.StatusInternalServerError, http.StatusServiceUnavailable},
	}, func(ctx context.Context, input *professionalAuthRegisterInput) (*professionalAuthSessionCookieResponse, error) {
		payload, err := service.Register(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "create-professional-auth-session",
		Method:      http.MethodPost,
		Path:        "/professionals/auth/session",
		Summary:     "Create an authenticated professional session",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusTooManyRequests, http.StatusInternalServerError, http.StatusServiceUnavailable},
	}, func(ctx context.Context, input *professionalAuthCreateSessionInput) (*professionalAuthSessionCookieResponse, error) {
		payload, err := service.Login(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		cookie, err := service.SessionCookie(payload.RawToken, payload.Session.ExpiresAt)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalAuthSessionCookieResponse{}
		response.SetCookie = cookie
		response.Body.Data = payload.Session
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-auth-session",
		Method:      http.MethodGet,
		Path:        "/professionals/auth/session",
		Summary:     "Get the authenticated professional session",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*professionalAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		response := &professionalAuthSessionResponse{}
		response.Body.Data = authSession.Session
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "delete-professional-auth-session",
		Method:      http.MethodDelete,
		Path:        "/professionals/auth/session",
		Summary:     "Revoke the authenticated professional session",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*professionalAuthSessionCookieResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.Logout(ctx, authSession.TokenHash)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalAuthSessionCookieResponse{}
		response.SetCookie = service.ExpiredSessionCookie()
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "update-professional-auth-account",
		Method:      http.MethodPut,
		Path:        "/professionals/auth/account",
		Summary:     "Update authenticated professional account metadata",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *professionalAuthUpdateAccountInput) (*professionalAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.UpdateAccount(ctx, authSession.TokenHash, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalAuthSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "update-professional-auth-password",
		Method:      http.MethodPut,
		Path:        "/professionals/auth/password",
		Summary:     "Change the authenticated professional password",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *professionalAuthUpdatePasswordInput) (*professionalAuthSessionResponse, error) {
		authSession, ok := ContextSession(ctx)
		if !ok {
			return nil, toAPIError(ErrSessionNotFound)
		}

		payload, err := service.UpdatePassword(ctx, authSession.TokenHash, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalAuthSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "request-professional-password-recovery",
		Method:      http.MethodPost,
		Path:        "/professionals/auth/password-recovery",
		Summary:     "Request a professional password recovery link",
		Tags:        []string{"Professional Auth"},
		Errors:      []int{http.StatusBadRequest, http.StatusInternalServerError},
	}, func(ctx context.Context, input *professionalAuthPasswordRecoveryInput) (*professionalAuthPasswordRecoveryResponse, error) {
		payload, err := service.RequestPasswordRecovery(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalAuthPasswordRecoveryResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withProfessionalSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrInvalidProfessionalID),
		errors.Is(err, ErrInvalidPhone),
		errors.Is(err, ErrInvalidDisplayName),
		errors.Is(err, ErrInvalidCredential),
		errors.Is(err, ErrWeakPassword):
		return web.NewAPIError(http.StatusBadRequest, "invalid_professional_auth_payload", err.Error())
	case errors.Is(err, ErrProfessionalNotFound):
		return web.NewAPIError(http.StatusBadRequest, "professional_not_found", "professional profile not found")
	case errors.Is(err, ErrAccountAlreadyExists):
		return web.NewAPIError(http.StatusConflict, "professional_account_exists", "professional account already exists")
	case errors.Is(err, ErrPhoneAlreadyInUse):
		return web.NewAPIError(http.StatusConflict, "professional_phone_in_use", "professional phone is already in use")
	case errors.Is(err, ErrInvalidCredentials):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_professional_credentials", "invalid professional credentials")
	case errors.Is(err, ErrMissingAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "missing_professional_session", "missing professional authenticated session")
	case errors.Is(err, ErrInvalidAuthorization):
		return web.NewAPIError(http.StatusUnauthorized, "invalid_professional_session", "invalid professional authenticated session")
	case errors.Is(err, ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
	case errors.Is(err, ErrSessionExpired):
		return web.NewAPIError(http.StatusUnauthorized, "professional_session_expired", "professional session expired")
	case errors.Is(err, ErrSessionRevoked):
		return web.NewAPIError(http.StatusUnauthorized, "professional_session_revoked", "professional session revoked")
	case errors.Is(err, ErrAccountNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "professional_account_not_found", "professional account not found")
	case errors.Is(err, ErrInvalidSessionPayload), errors.Is(err, ErrInvalidAccountPayload):
		return web.NewAPIError(http.StatusInternalServerError, "invalid_professional_auth_payload", "invalid professional auth payload")
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
