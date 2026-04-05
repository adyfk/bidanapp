package middleware

import (
	"net/http"
	"strings"

	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

func CustomerAuth(service *customerauth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if service == nil || !requiresCustomerAuth(r) {
				next.ServeHTTP(w, r)
				return
			}

			session, err := service.AuthenticateRequest(
				r.Context(),
				r.Header.Get("Authorization"),
				readCookieValue(r, service.CookieName()),
			)
			if err != nil {
				writeCustomerAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(customerauth.WithSession(r.Context(), session)))
		})
	}
}

func requiresCustomerAuth(r *http.Request) bool {
	if strings.HasPrefix(r.URL.Path, "/api/v1/customers/auth/") {
		return !(r.URL.Path == "/api/v1/customers/auth/session" && r.Method == http.MethodPost ||
			r.URL.Path == "/api/v1/customers/auth/register" && r.Method == http.MethodPost)
	}

	if r.URL.Path == "/api/v1/customers/appointments" || strings.HasPrefix(r.URL.Path, "/api/v1/customers/appointments/") {
		return true
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/customers/payments/requests/") {
		return true
	}

	return r.URL.Path == "/api/v1/notifications/customer" ||
		r.URL.Path == "/api/v1/notifications/customer/push-subscription" ||
		r.URL.Path == "/api/v1/consumers/preferences"
}

func writeCustomerAuthError(w http.ResponseWriter, err error) {
	switch err {
	case customerauth.ErrMissingAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "missing_customer_session", "missing customer authenticated session")
	case customerauth.ErrInvalidAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "invalid_customer_session", "invalid customer authenticated session")
	case customerauth.ErrSessionExpired:
		web.WriteError(w, http.StatusUnauthorized, "customer_session_expired", "customer session expired")
	case customerauth.ErrSessionRevoked:
		web.WriteError(w, http.StatusUnauthorized, "customer_session_revoked", "customer session revoked")
	case customerauth.ErrSessionNotFound, customerauth.ErrAccountNotFound:
		web.WriteError(w, http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
	default:
		web.WriteError(w, http.StatusUnauthorized, "invalid_customer_session", "invalid customer authenticated session")
	}
}
