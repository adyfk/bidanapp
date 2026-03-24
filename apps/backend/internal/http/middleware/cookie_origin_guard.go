package middleware

import (
	"net/http"
	"net/url"
	"strings"

	"bidanapp/apps/backend/internal/platform/web"
)

func CookieOriginGuard(allowedOrigins []string, protectedCookieNames []string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !requiresCookieOriginGuard(r) ||
				strings.TrimSpace(r.Header.Get("Authorization")) != "" ||
				!hasProtectedAuthCookie(r, protectedCookieNames) {
				next.ServeHTTP(w, r)
				return
			}

			origin, ok := requestOrigin(r)
			if !ok || !isAllowedRequestOrigin(origin, allowedOrigins) {
				web.WriteError(w, http.StatusForbidden, "invalid_request_origin", "cross-site cookie-authenticated request origin is not allowed")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func requiresCookieOriginGuard(r *http.Request) bool {
	if r == nil || !strings.HasPrefix(r.URL.Path, "/api/v1/") {
		return false
	}

	switch r.Method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

func hasProtectedAuthCookie(r *http.Request, protectedCookieNames []string) bool {
	for _, cookieName := range protectedCookieNames {
		if strings.TrimSpace(readCookieValue(r, cookieName)) != "" {
			return true
		}
	}

	return false
}

func requestOrigin(r *http.Request) (string, bool) {
	if origin, ok := normalizeRequestOrigin(r.Header.Get("Origin")); ok {
		return origin, true
	}

	referer := strings.TrimSpace(r.Header.Get("Referer"))
	if referer == "" {
		return "", false
	}

	parsed, err := url.Parse(referer)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", false
	}

	return normalizeRequestOrigin(parsed.Scheme + "://" + parsed.Host)
}

func normalizeRequestOrigin(raw string) (string, bool) {
	value := strings.TrimSpace(raw)
	if value == "" || strings.EqualFold(value, "null") {
		return "", false
	}

	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", false
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", false
	}

	return parsed.Scheme + "://" + parsed.Host, true
}

func isAllowedRequestOrigin(origin string, allowedOrigins []string) bool {
	for _, allowedOrigin := range allowedOrigins {
		if strings.TrimSpace(allowedOrigin) == origin {
			return true
		}
	}

	return false
}
