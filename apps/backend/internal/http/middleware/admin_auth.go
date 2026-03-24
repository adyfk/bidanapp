package middleware

import (
	"net/http"
	"strings"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/platform/web"
)

func AdminAuth(service *adminauth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if service == nil || !requiresAdminAuth(r) {
				next.ServeHTTP(w, r)
				return
			}

			session, err := service.AuthenticateRequest(
				r.Context(),
				r.Header.Get("Authorization"),
				readCookieValue(r, service.CookieName()),
			)
			if err != nil {
				writeAdminAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(adminauth.WithSession(r.Context(), session)))
		})
	}
}

func requiresAdminAuth(r *http.Request) bool {
	if !strings.HasPrefix(r.URL.Path, "/api/v1/admin/") {
		return false
	}

	return !(r.URL.Path == "/api/v1/admin/auth/session" && r.Method == http.MethodPost)
}

func writeAdminAuthError(w http.ResponseWriter, err error) {
	switch err {
	case adminauth.ErrMissingAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "missing_admin_session", "missing admin authenticated session")
	case adminauth.ErrInvalidAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "invalid_admin_session", "invalid admin authenticated session")
	case adminauth.ErrSessionExpired:
		web.WriteError(w, http.StatusUnauthorized, "admin_session_expired", "admin session expired")
	case adminauth.ErrSessionRevoked:
		web.WriteError(w, http.StatusUnauthorized, "admin_session_revoked", "admin session revoked")
	case adminauth.ErrSessionNotFound:
		web.WriteError(w, http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
	default:
		web.WriteError(w, http.StatusUnauthorized, "invalid_admin_session", "invalid admin authenticated session")
	}
}
