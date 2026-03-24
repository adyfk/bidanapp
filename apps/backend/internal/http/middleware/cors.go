package middleware

import (
	"net/http"
	"strings"
)

func CORS(allowedOrigins []string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := strings.TrimSpace(r.Header.Get("Origin"))
			if origin != "" {
				if match, ok := allowedOrigin(origin, allowedOrigins); ok {
					w.Header().Set("Access-Control-Allow-Origin", match)
					w.Header().Set("Vary", "Origin")
					w.Header().Set("Access-Control-Allow-Credentials", "true")
					w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
					w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
					w.Header().Set("Access-Control-Max-Age", "600")
				}
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func allowedOrigin(origin string, allowedOrigins []string) (string, bool) {
	for _, allowedOrigin := range allowedOrigins {
		if allowedOrigin == "*" {
			return origin, true
		}

		if allowedOrigin == origin {
			return allowedOrigin, true
		}
	}

	return "", false
}
