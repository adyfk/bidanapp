package middleware

import (
	"net/http"
	"strings"

	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/platform/web"
)

func ProfessionalAuth(service *professionalauth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if service == nil || !requiresProfessionalAuth(r) {
				next.ServeHTTP(w, r)
				return
			}

			session, err := service.AuthenticateRequest(
				r.Context(),
				r.Header.Get("Authorization"),
				readCookieValue(r, service.CookieName()),
			)
			if err != nil {
				writeProfessionalAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(professionalauth.WithSession(r.Context(), session)))
		})
	}
}

func requiresProfessionalAuth(r *http.Request) bool {
	if strings.HasPrefix(r.URL.Path, "/api/v1/professionals/auth/") {
		return !((r.URL.Path == "/api/v1/professionals/auth/session" && r.Method == http.MethodPost) ||
			(r.URL.Path == "/api/v1/professionals/auth/register" && r.Method == http.MethodPost) ||
			(r.URL.Path == "/api/v1/professionals/auth/password-recovery" && r.Method == http.MethodPost))
	}

	if r.URL.Path == "/api/v1/professionals/portal/session" {
		return true
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/professionals/me/") {
		return true
	}

	if r.URL.Path == "/api/v1/professionals/appointments" ||
		strings.HasPrefix(r.URL.Path, "/api/v1/professionals/appointments/") {
		return true
	}

	if r.URL.Path == "/api/v1/notifications/professional" {
		return true
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/appointments/") &&
		(strings.HasSuffix(r.URL.Path, "/depart") || r.Method == http.MethodPut) {
		return true
	}

	return false
}

func writeProfessionalAuthError(w http.ResponseWriter, err error) {
	switch err {
	case professionalauth.ErrMissingAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "missing_professional_session", "missing professional authenticated session")
	case professionalauth.ErrInvalidAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "invalid_professional_session", "invalid professional authenticated session")
	case professionalauth.ErrSessionExpired:
		web.WriteError(w, http.StatusUnauthorized, "professional_session_expired", "professional session expired")
	case professionalauth.ErrSessionRevoked:
		web.WriteError(w, http.StatusUnauthorized, "professional_session_revoked", "professional session revoked")
	case professionalauth.ErrSessionNotFound, professionalauth.ErrAccountNotFound:
		web.WriteError(w, http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
	default:
		web.WriteError(w, http.StatusUnauthorized, "invalid_professional_session", "invalid professional authenticated session")
	}
}
