package http

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"bidanapp/apps/backend/internal/config"
)

func TestRouterServesGeneratedOpenAPI(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/openapi.json", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusOK)
	}

	body := recorder.Body.String()
	if !strings.Contains(body, `"/professionals/{slug}"`) ||
		!strings.Contains(body, `"/chat"`) ||
		!strings.Contains(body, `"/bootstrap"`) ||
		!strings.Contains(body, `"/admin/auth/session"`) ||
		!strings.Contains(body, `"/customers/auth/register"`) ||
		!strings.Contains(body, `"/customers/auth/session"`) ||
		!strings.Contains(body, `"/professionals/auth/register"`) ||
		!strings.Contains(body, `"/professionals/auth/session"`) ||
		!strings.Contains(body, `"/professionals/portal/session"`) ||
		!strings.Contains(body, `"/professionals/me/profile"`) ||
		!strings.Contains(body, `"/professionals/me/coverage"`) ||
		!strings.Contains(body, `"/professionals/me/services"`) ||
		!strings.Contains(body, `"/professionals/me/requests"`) ||
		!strings.Contains(body, `"/professionals/me/portfolio"`) ||
		!strings.Contains(body, `"/professionals/me/gallery"`) ||
		!strings.Contains(body, `"/professionals/me/trust"`) ||
		!strings.Contains(body, `"/appointments/{appointment_id}"`) {
		t.Fatalf("openapi output missing expected routes: %s", body)
	}
}

func TestRouterSanitizesInvalidSlugError(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/professionals/invalid_slug", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusBadRequest)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"invalid_slug"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterSanitizesInternalErrors(t *testing.T) {
	cfg := testConfig(t)
	cfg.SeedData.DataDir = t.TempDir()
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/professionals/bidan-sari", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusInternalServerError)
	}

	body := recorder.Body.String()
	if !strings.Contains(body, `"message":"internal server error"`) {
		t.Fatalf("unexpected response: %s", body)
	}
}

func TestRouterRejectsUnauthorizedAdminConsoleRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/admin/console", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_admin_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsUnauthorizedProfessionalPortalRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/professionals/me/profile", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_professional_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsUnauthorizedProfessionalNotificationRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/notifications/professional", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_professional_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsUnauthorizedCustomerNotificationRequests(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodGet, "/api/v1/notifications/customer", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusUnauthorized)
	}

	if !strings.Contains(recorder.Body.String(), `"code":"missing_customer_session"`) {
		t.Fatalf("unexpected response: %s", recorder.Body.String())
	}
}

func TestRouterRejectsCookieAuthenticatedMutationWithoutTrustedOrigin(t *testing.T) {
	cfg := testConfig(t)
	router := NewRouter(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)))
	request := httptest.NewRequest(http.MethodPut, "/api/v1/notifications/customer", strings.NewReader(`{"readIds":[]}`))
	request.AddCookie(&http.Cookie{Name: cfg.CustomerAuth.Cookie.Name, Value: "seed-cookie"})
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
	request := httptest.NewRequest(http.MethodPut, "/api/v1/notifications/customer", strings.NewReader(`{"readIds":[]}`))
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
	writeCatalogFixture(t, dataDir)

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
			AllowedOrigins: []string{"http://localhost:3000"},
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
		},
		CustomerAuth: config.CustomerAuthConfig{
			Cookie: config.SessionCookieConfig{
				Name:     "bidanapp_customer_session",
				Path:     "/api/v1",
				SameSite: "lax",
			},
		},
		ProfessionalAuth: config.ProfessionalAuthConfig{
			Cookie: config.SessionCookieConfig{
				Name:     "bidanapp_professional_session",
				Path:     "/api/v1",
				SameSite: "lax",
			},
		},
		SeedData: config.SeedDataConfig{
			DataDir: dataDir,
		},
	}
}

func writeCatalogFixture(t *testing.T, dataDir string) {
	t.Helper()

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		t.Fatalf("create data dir: %v", err)
	}

	professionals := `[
  {
    "index": 1,
    "id": "prof-1",
    "slug": "bidan-sari",
    "name": "Bidan Sari",
    "title": "Senior Midwife",
    "location": "Bandung",
    "rating": 4.9,
    "reviews": "120",
    "experience": "8 years",
    "clientsServed": "560",
    "image": "https://images.unsplash.com/photo-1",
    "coverImage": "https://images.unsplash.com/photo-2",
    "isAvailable": true,
    "responseTime": "5 min",
    "about": "Trusted professional"
  }
]`

	if err := os.WriteFile(filepath.Join(dataDir, "professionals.json"), []byte(professionals), 0o644); err != nil {
		t.Fatalf("write professionals fixture: %v", err)
	}
}
