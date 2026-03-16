package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadFromAppRootReadsEnvFilesAndNormalizesConfig(t *testing.T) {
	appRoot := t.TempDir()
	mockDBDir := filepath.Join(appRoot, "fixtures", "mock-db")

	if err := os.MkdirAll(mockDBDir, 0o755); err != nil {
		t.Fatalf("create mock db dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_NAME=bidanapp-api",
		"APP_VERSION=1.2.3",
		"APP_ENV=production",
		"HTTP_HOST=127.0.0.1",
		"HTTP_PORT=9090",
		"HTTP_READ_HEADER_TIMEOUT=6s",
		"HTTP_READ_TIMEOUT=11s",
		"HTTP_WRITE_TIMEOUT=31s",
		"HTTP_IDLE_TIMEOUT=61s",
		"HTTP_SHUTDOWN_TIMEOUT=12s",
		"HTTP_MAX_HEADER_BYTES=4096",
		"CORS_ALLOWED_ORIGINS=https://example.com/, https://admin.example.com",
		"MOCK_DB_DIR=./fixtures/mock-db",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"REDIS_URL=redis://localhost:6379",
		"LOG_LEVEL=warn",
		"LOG_FORMAT=json",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv(
		"APP_NAME",
		"APP_VERSION",
		"APP_ENV",
		"HTTP_HOST",
		"HTTP_PORT",
		"HTTP_READ_HEADER_TIMEOUT",
		"HTTP_READ_TIMEOUT",
		"HTTP_WRITE_TIMEOUT",
		"HTTP_IDLE_TIMEOUT",
		"HTTP_SHUTDOWN_TIMEOUT",
		"HTTP_MAX_HEADER_BYTES",
		"CORS_ALLOWED_ORIGINS",
		"MOCK_DB_DIR",
		"DATABASE_URL",
		"REDIS_URL",
		"LOG_LEVEL",
		"LOG_FORMAT",
	)
	defer restore()

	cfg, err := loadFromAppRoot(appRoot)
	if err != nil {
		t.Fatalf("load config: %v", err)
	}

	if cfg.App.Name != "bidanapp-api" {
		t.Fatalf("unexpected app name: %s", cfg.App.Name)
	}

	if cfg.App.Version != "1.2.3" {
		t.Fatalf("unexpected app version: %s", cfg.App.Version)
	}

	if cfg.HTTP.Port != 9090 {
		t.Fatalf("unexpected http port: %d", cfg.HTTP.Port)
	}

	if got, want := cfg.CORS.AllowedOrigins[0], "https://example.com"; got != want {
		t.Fatalf("unexpected normalized origin: got %s want %s", got, want)
	}

	if got, want := cfg.MockDB.DataDir, mockDBDir; got != want {
		t.Fatalf("unexpected mock db dir: got %s want %s", got, want)
	}

	if cfg.Observability.LogFormat != "json" {
		t.Fatalf("unexpected log format: %s", cfg.Observability.LogFormat)
	}
}

func TestLoadFromAppRootFailsForInvalidPort(t *testing.T) {
	appRoot := t.TempDir()
	mockDBDir := filepath.Join(appRoot, "mock-db")

	if err := os.MkdirAll(mockDBDir, 0o755); err != nil {
		t.Fatalf("create mock db dir: %v", err)
	}

	envFile := strings.Join([]string{
		"HTTP_PORT=not-a-number",
		"MOCK_DB_DIR=./mock-db",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("HTTP_PORT", "MOCK_DB_DIR")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "HTTP_PORT must be a valid integer") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func clearEnv(keys ...string) func() {
	snapshot := map[string]struct {
		value   string
		present bool
	}{}

	for _, key := range keys {
		value, present := os.LookupEnv(key)
		snapshot[key] = struct {
			value   string
			present bool
		}{value: value, present: present}
		_ = os.Unsetenv(key)
	}

	return func() {
		for key, item := range snapshot {
			if item.present {
				_ = os.Setenv(key, item.value)
				continue
			}

			_ = os.Unsetenv(key)
		}
	}
}
