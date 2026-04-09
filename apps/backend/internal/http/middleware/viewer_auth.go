package middleware

import (
	"net/http"
	"strings"

	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type viewerAuthMode int

const (
	viewerAuthNone viewerAuthMode = iota
	viewerAuthOptional
	viewerAuthRequired
)

func ViewerAuth(service *viewerauth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if service == nil {
				next.ServeHTTP(w, r)
				return
			}

			mode := viewerAuthModeForRequest(r)
			if mode == viewerAuthNone {
				next.ServeHTTP(w, r)
				return
			}

			cookieValue := readCookieValue(r, service.CookieName())
			authorizationHeader := r.Header.Get("Authorization")

			if mode == viewerAuthOptional && strings.TrimSpace(cookieValue) == "" && strings.TrimSpace(authorizationHeader) == "" {
				next.ServeHTTP(w, r)
				return
			}

			session, err := service.AuthenticateRequest(r.Context(), authorizationHeader, cookieValue)
			if err != nil {
				if mode == viewerAuthOptional {
					next.ServeHTTP(w, r)
					return
				}

				writeViewerAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(viewerauth.WithSession(r.Context(), session)))
		})
	}
}

func viewerAuthModeForRequest(r *http.Request) viewerAuthMode {
	if strings.HasPrefix(r.URL.Path, "/api/v1/auth/") {
		if r.URL.Path == "/api/v1/auth/session" && (r.Method == http.MethodGet || r.Method == http.MethodDelete) {
			return viewerAuthOptional
		}
		if r.URL.Path == "/api/v1/auth/profile" && r.Method == http.MethodPut {
			return viewerAuthRequired
		}
		if r.URL.Path == "/api/v1/auth/sessions" && r.Method == http.MethodGet {
			return viewerAuthRequired
		}
		if r.URL.Path == "/api/v1/auth/sessions/logout-all" && r.Method == http.MethodPost {
			return viewerAuthRequired
		}
		if strings.HasPrefix(r.URL.Path, "/api/v1/auth/sessions/") && r.Method == http.MethodDelete {
			return viewerAuthRequired
		}
		return viewerAuthNone
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/platforms/") {
		if strings.Contains(r.URL.Path, "/professionals/me/") {
			return viewerAuthRequired
		}
		if strings.Contains(r.URL.Path, "/customers/me/orders") {
			return viewerAuthRequired
		}
		if strings.HasSuffix(r.URL.Path, "/notifications") && r.Method == http.MethodGet {
			return viewerAuthRequired
		}
		if strings.HasSuffix(r.URL.Path, "/orders") && r.Method == http.MethodPost {
			return viewerAuthRequired
		}
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/orders/") && strings.HasSuffix(r.URL.Path, "/payments/session") {
		return viewerAuthRequired
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/professional-documents/") && r.Method == http.MethodGet {
		return viewerAuthOptional
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/chat/") {
		return viewerAuthRequired
	}

	if strings.HasPrefix(r.URL.Path, "/api/v1/support/") {
		return viewerAuthRequired
	}

	return viewerAuthNone
}

func writeViewerAuthError(w http.ResponseWriter, err error) {
	switch err {
	case viewerauth.ErrMissingAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "missing_viewer_session", "missing viewer authenticated session")
	case viewerauth.ErrInvalidAuthorization:
		web.WriteError(w, http.StatusUnauthorized, "invalid_viewer_session", "invalid viewer authenticated session")
	case viewerauth.ErrSessionExpired:
		web.WriteError(w, http.StatusUnauthorized, "viewer_session_expired", "viewer session expired")
	case viewerauth.ErrSessionRevoked:
		web.WriteError(w, http.StatusUnauthorized, "viewer_session_revoked", "viewer session revoked")
	case viewerauth.ErrSessionNotFound, viewerauth.ErrAccountNotFound:
		web.WriteError(w, http.StatusUnauthorized, "viewer_session_not_found", "viewer session not found")
	default:
		web.WriteError(w, http.StatusUnauthorized, "invalid_viewer_session", "invalid viewer authenticated session")
	}
}
