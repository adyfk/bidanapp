package http

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"bidanapp/apps/backend/internal/config"
)

func TestRouterServesGeneratedOpenAPIV2Contract(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/openapi.json", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusOK)
	}

	body := recorder.Body.String()
	expectedPaths := []string{
		`"/health"`,
		`"/auth/register"`,
		`"/auth/login"`,
		`"/auth/session"`,
		`"/auth/password/forgot"`,
		`"/auth/password/reset"`,
		`"/auth/challenges/sms"`,
		`"/auth/challenges/verify"`,
		`"/auth/sessions"`,
		`"/auth/sessions/{session_id}"`,
		`"/auth/sessions/logout-all"`,
		`"/admin/auth/session"`,
		`"/platforms"`,
		`"/platforms/resolve"`,
		`"/platforms/{platform_id}"`,
		`"/platforms/{platform_id}/professional-schema"`,
		`"/platforms/{platform_id}/professionals/me/onboarding"`,
		`"/platforms/{platform_id}/professionals/me/offerings"`,
		`"/platforms/{platform_id}/offerings"`,
		`"/platforms/{platform_id}/customers/me/orders"`,
		`"/platforms/{platform_id}/orders"`,
		`"/orders/{order_id}/payments/session"`,
		`"/webhooks/payments/{provider}"`,
		`"/admin/platforms/{platform_id}/professional-applications"`,
		`"/admin/platforms/{platform_id}/professional-applications/{application_id}/review"`,
		`"/ws/chat"`,
	}
	for _, expected := range expectedPaths {
		if !strings.Contains(body, expected) {
			t.Fatalf("openapi output missing expected route %s: %s", expected, body)
		}
	}

	unexpectedPaths := []string{
		`"/bootstrap"`,
		`"/app` + `ointments"`,
		`"/customers` + `/auth/register"`,
		`"/customers` + `/auth/session"`,
		`"/professionals` + `/auth/register"`,
		`"/professionals` + `/auth/session"`,
		`"/professionals/portal/session"`,
		`"/professionals/me/profile"`,
		`"/customers/support/tickets"`,
		`"/professionals/support/tickets"`,
	}
	for _, unexpected := range unexpectedPaths {
		if strings.Contains(body, unexpected) {
			t.Fatalf("openapi output unexpectedly exposes legacy route %s: %s", unexpected, body)
		}
	}
}

func TestRouterReturnsManifestPlatformsWithoutDatabase(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/platforms", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusOK)
	}

	body := recorder.Body.String()
	if !strings.Contains(body, `"platforms"`) || !strings.Contains(body, `"bidan"`) {
		t.Fatalf("unexpected response: %s", body)
	}
}

func TestRouterReturnsAnonymousViewerSessionWithoutCookie(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/auth/session", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusOK)
	}

	body := recorder.Body.String()
	if !strings.Contains(body, `"isAuthenticated":false`) {
		t.Fatalf("unexpected response: %s", body)
	}
}

func TestRouterRejectsUnauthorizedAdminRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/admin/platforms/bidan/professional-applications", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_admin_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsUnauthorizedViewerProfessionalRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/platforms/bidan/professionals/me/onboarding", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_viewer_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsUnauthorizedViewerOrderRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/platforms/bidan/customers/me/orders", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_viewer_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsCookieAuthenticatedMutationWithoutTrustedOrigin(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodPost, "/api/v1/platforms/bidan/orders", strings.NewReader(`{"offeringId":"off-1"}`))
	request.AddCookie(&http.Cookie{Name: cfg.ViewerAuth.Cookie.Name, Value: "seed-cookie"})
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusForbidden)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"invalid_request_origin"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterAllowsBearerMutationWithoutOriginGuard(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodPost, "/api/v1/platforms/bidan/orders", strings.NewReader(`{"offeringId":"off-1"}`))
	request.Header.Set("Authorization", "Bearer invalid-token")
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if strings.Contains(recorder.Body.String(), `"code":"invalid_request_origin"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func testConfig(t *testing.T) config.Config {
	t.Helper()

	dataDir := t.TempDir()

	return config.Config{
		App: config.AppConfig{
			Name:        "bidanapp-backend",
			Version:     "0.1.0",
			Environment: "test",
		},
		HTTP: config.HTTPConfig{
			Host: "127.0.0.1",
			Port: 8080,
		},
		CORS: config.CORSConfig{
			AllowedOrigins: []string{"http://bidan.lvh.me:3002"},
		},
		AuthRateLimit: config.AuthRateLimitConfig{
			MaxAttempts: 5,
			Window:      time.Minute,
		},
		AdminAuth: config.AdminAuthConfig{
			Cookie: config.SessionCookieConfig{
				Name:     "bidanapp_admin_session",
				Path:     "/api/v1",
				SameSite: "lax",
			},
			SessionTTL: 24 * time.Hour,
		},
		ViewerAuth: config.ViewerAuthConfig{
			Cookie: config.SessionCookieConfig{
				Name:     "bidanapp_viewer_session",
				Path:     "/api/v1",
				SameSite: "lax",
			},
			SessionTTL: 24 * time.Hour,
		},
		SeedData: config.SeedDataConfig{
			DataDir: dataDir,
		},
	}
}
