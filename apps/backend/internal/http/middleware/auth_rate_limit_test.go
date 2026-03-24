package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/ratelimit"
)

func TestAuthRateLimitRejectsAfterConfiguredAttempts(t *testing.T) {
	limiter := ratelimit.NewMemoryLimiter(config.AuthRateLimitConfig{
		MaxAttempts: 2,
		Window:      time.Minute,
	})
	handler := AuthRateLimit(limiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	for attempt := 1; attempt <= 3; attempt++ {
		request := httptest.NewRequest(http.MethodPost, "/api/v1/customers/auth/session", nil)
		request.RemoteAddr = "127.0.0.1:12345"
		recorder := httptest.NewRecorder()

		handler.ServeHTTP(recorder, request)

		if attempt < 3 && recorder.Code != http.StatusNoContent {
			t.Fatalf("attempt %d: unexpected status: got %d want %d", attempt, recorder.Code, http.StatusNoContent)
		}

		if attempt == 3 {
			if recorder.Code != http.StatusTooManyRequests {
				t.Fatalf("attempt %d: unexpected status: got %d want %d", attempt, recorder.Code, http.StatusTooManyRequests)
			}

			if !strings.Contains(recorder.Body.String(), `"code":"auth_rate_limited"`) {
				t.Fatalf("attempt %d: unexpected body: %s", attempt, recorder.Body.String())
			}

			if recorder.Header().Get("Retry-After") == "" {
				t.Fatalf("attempt %d: expected retry-after header", attempt)
			}
		}
	}
}

func TestAuthRateLimitSkipsNonAuthRoutes(t *testing.T) {
	limiter := ratelimit.NewMemoryLimiter(config.AuthRateLimitConfig{
		MaxAttempts: 1,
		Window:      time.Minute,
	})
	handler := AuthRateLimit(limiter)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodGet, "/api/v1/bootstrap", nil)
	request.RemoteAddr = "127.0.0.1:12345"
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusNoContent)
	}
}
