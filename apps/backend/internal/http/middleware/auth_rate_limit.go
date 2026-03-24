package middleware

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/ratelimit"
	"bidanapp/apps/backend/internal/platform/web"
)

func AuthRateLimit(limiter ratelimit.Limiter) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if limiter == nil {
				next.ServeHTTP(w, r)
				return
			}

			bucket, ok := authRateLimitBucket(r)
			if !ok {
				next.ServeHTTP(w, r)
				return
			}

			decision, err := limiter.Allow(r.Context(), bucket, authRateLimitSubject(r))
			if err != nil {
				web.WriteError(w, http.StatusServiceUnavailable, "auth_rate_limit_unavailable", "authentication is temporarily unavailable")
				return
			}

			if !decision.Allowed {
				retryAfterSeconds := int(decision.RetryAfter.Round(time.Second).Seconds())
				if retryAfterSeconds < 1 {
					retryAfterSeconds = 1
				}

				w.Header().Set("Retry-After", strconv.Itoa(retryAfterSeconds))
				web.WriteError(w, http.StatusTooManyRequests, "auth_rate_limited", "too many authentication attempts, try again later")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func authRateLimitBucket(r *http.Request) (string, bool) {
	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/api/v1/admin/auth/session":
		return "admin-session-create", true
	case r.Method == http.MethodPost && r.URL.Path == "/api/v1/customers/auth/register":
		return "customer-register", true
	case r.Method == http.MethodPost && r.URL.Path == "/api/v1/customers/auth/session":
		return "customer-session-create", true
	case r.Method == http.MethodPost && r.URL.Path == "/api/v1/professionals/auth/register":
		return "professional-register", true
	case r.Method == http.MethodPost && r.URL.Path == "/api/v1/professionals/auth/session":
		return "professional-session-create", true
	case r.Method == http.MethodPost && r.URL.Path == "/api/v1/professionals/auth/password-recovery":
		return "professional-password-recovery", true
	default:
		return "", false
	}
}

func authRateLimitSubject(r *http.Request) string {
	for _, headerName := range []string{"CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP"} {
		headerValue := strings.TrimSpace(r.Header.Get(headerName))
		if headerValue == "" {
			continue
		}

		if headerName == "X-Forwarded-For" {
			headerValue = strings.TrimSpace(strings.Split(headerValue, ",")[0])
		}

		if ip := net.ParseIP(headerValue); ip != nil {
			return ip.String()
		}
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil {
		return host
	}

	return strings.TrimSpace(r.RemoteAddr)
}
