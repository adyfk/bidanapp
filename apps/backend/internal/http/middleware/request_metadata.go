package middleware

import (
	"net/http"

	platformweb "bidanapp/apps/backend/internal/platform/web"
)

func RequestMetadata() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			metadata := platformweb.NewRequestMetadata(r)
			next.ServeHTTP(w, r.WithContext(platformweb.WithRequestMetadata(r.Context(), metadata)))
		})
	}
}
