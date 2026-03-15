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
	if !strings.Contains(body, `"/professionals/{slug}"`) || !strings.Contains(body, `"/chat"`) {
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
	cfg.Simulation.DataDir = t.TempDir()
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
		Simulation: config.SimulationConfig{
			DataDir: dataDir,
		},
	}
}

func writeCatalogFixture(t *testing.T, dataDir string) {
	t.Helper()

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		t.Fatalf("create data dir: %v", err)
	}

	catalog := `{
  "categories": [],
  "services": [],
  "professionals": [
    {
      "index": 1,
      "id": "prof-1",
      "slug": "bidan-sari",
      "name": "Bidan Sari",
      "title": "Senior Midwife",
      "categoryId": "cat-1",
      "location": "Bandung",
      "rating": 4.9,
      "reviews": "120",
      "experience": "8 years",
      "clientsServed": "560",
      "image": "https://images.unsplash.com/photo-1",
      "coverImage": "https://images.unsplash.com/photo-2",
      "badgeLabel": "Top Rated",
      "availabilityLabel": "Available today",
      "responseTime": "5 min",
      "specialties": ["ANC"],
      "languages": ["ID"],
      "addressLines": ["Jl. Example 1", "Bandung"],
      "about": "Trusted professional",
      "portfolioStats": [],
      "credentials": [],
      "activityStories": [],
      "portfolioEntries": [],
      "gallery": [],
      "testimonials": [],
      "feedbackSummary": {
        "recommendationRate": "98%",
        "repeatClientRate": "64%"
      },
      "feedbackMetrics": [],
      "feedbackBreakdown": [],
      "recentActivities": [],
      "services": []
    }
  ]
}`

	if err := os.WriteFile(filepath.Join(dataDir, "catalog.json"), []byte(catalog), 0o644); err != nil {
		t.Fatalf("write catalog fixture: %v", err)
	}
}
