package middleware

import (
	"net/http"
	"strings"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type adminAuthMode int

const (
	adminAuthNone adminAuthMode = iota
	adminAuthOptional
	adminAuthRequired
)

func AdminAuth(service *adminauth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if service == nil {
				next.ServeHTTP(w, r)
				return
			}

			mode := adminAuthModeForRequest(r)
			if mode == adminAuthNone {
				next.ServeHTTP(w, r)
				return
			}

			cookieValue := readCookieValue(r, service.CookieName())
			authorizationHeader := r.Header.Get("Authorization")
			if mode == adminAuthOptional && strings.TrimSpace(cookieValue) == "" && strings.TrimSpace(authorizationHeader) == "" {
				next.ServeHTTP(w, r)
				return
			}

			session, err := service.AuthenticateRequest(
				r.Context(),
				authorizationHeader,
				cookieValue,
			)
			if err != nil {
				if mode == adminAuthOptional {
					next.ServeHTTP(w, r)
					return
				}

				writeAdminAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(adminauth.WithSession(r.Context(), session)))
		})
	}
}

func adminAuthModeForRequest(r *http.Request) adminAuthMode {
	if strings.HasPrefix(r.URL.Path, "/api/v1/admin/") {
		if r.URL.Path == "/api/v1/admin/auth/session" && r.Method == http.MethodPost {
			return adminAuthNone
		}

		return adminAuthRequired
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/professional-documents/") && r.Method == http.MethodGet {
		return adminAuthOptional
	}

	return adminAuthNone
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
