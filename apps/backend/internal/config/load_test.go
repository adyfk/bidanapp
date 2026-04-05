package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadFromAppRootReadsEnvFilesAndNormalizesConfig(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "fixtures", "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
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
		"SEED_DATA_DIR=./fixtures/seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CUSTOMER_AUTH_SESSION_TTL=10h",
		"PROFESSIONAL_AUTH_SESSION_TTL=12h",
		"PAYMENT_PROVIDER=xendit",
		"PAYMENT_CURRENCY=IDR",
		"XENDIT_SECRET_KEY=xnd_development_secret_key",
		"XENDIT_WEBHOOK_TOKEN=xnd_webhook_token",
		`ADMIN_CONSOLE_CREDENTIALS_JSON=[{"adminId":"adm-01","email":"naya@ops.bidanapp.id","passwordHash":"$2a$12$9kXq1E5j3H6m7L8n2P4rUeB9tJ0vC1xYzAqR4mTnV7pQwS6dF8gHi","focusArea":"support"}]`,
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
		"SEED_DATA_DIR",
		"DATABASE_URL",
		"CUSTOMER_AUTH_SESSION_TTL",
		"PROFESSIONAL_AUTH_SESSION_TTL",
		"PAYMENT_PROVIDER",
		"PAYMENT_CURRENCY",
		"XENDIT_SECRET_KEY",
		"XENDIT_WEBHOOK_TOKEN",
		"ADMIN_CONSOLE_CREDENTIALS_JSON",
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

	if got, want := cfg.SeedData.DataDir, seedDataDir; got != want {
		t.Fatalf("unexpected seed data dir: got %s want %s", got, want)
	}

	if cfg.Observability.LogFormat != "json" {
		t.Fatalf("unexpected log format: %s", cfg.Observability.LogFormat)
	}

	if got, want := cfg.CustomerAuth.SessionTTL.String(), "10h0m0s"; got != want {
		t.Fatalf("unexpected customer auth ttl: got %s want %s", got, want)
	}

	if got, want := cfg.ProfessionalAuth.SessionTTL.String(), "12h0m0s"; got != want {
		t.Fatalf("unexpected professional auth ttl: got %s want %s", got, want)
	}

	if got, want := cfg.AdminAuth.Cookie.Path, "/api/v1"; got != want {
		t.Fatalf("unexpected auth cookie path: got %s want %s", got, want)
	}

	if !cfg.AdminAuth.Cookie.Secure {
		t.Fatal("expected production auth cookies to default to secure")
	}

	if got, want := cfg.AuthRateLimit.MaxAttempts, 10; got != want {
		t.Fatalf("unexpected auth rate limit max attempts: got %d want %d", got, want)
	}

	if got, want := cfg.Payment.Provider, "xendit"; got != want {
		t.Fatalf("unexpected payment provider: got %s want %s", got, want)
	}

	if got, want := cfg.Payment.Currency, "IDR"; got != want {
		t.Fatalf("unexpected payment currency: got %s want %s", got, want)
	}
}

func TestLoadFromAppRootFailsForInvalidPort(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"HTTP_PORT=not-a-number",
		"SEED_DATA_DIR=./seeddata",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("HTTP_PORT", "SEED_DATA_DIR")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "HTTP_PORT must be a valid integer") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLoadFromAppRootFailsWhenProductionAdminCredentialsAreMissing(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=production",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=https://app.bidanapp.id",
		"PAYMENT_PROVIDER=xendit",
		"XENDIT_SECRET_KEY=xnd_test_key",
		"XENDIT_WEBHOOK_TOKEN=xnd_test_token",
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "PAYMENT_PROVIDER", "XENDIT_SECRET_KEY", "XENDIT_WEBHOOK_TOKEN", "REDIS_URL", "ADMIN_CONSOLE_CREDENTIALS_JSON")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "ADMIN_CONSOLE_CREDENTIALS_JSON must contain at least one credential") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLoadFromAppRootFailsWhenProductionUsesDefaultAdminPasswordHash(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=production",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=https://app.bidanapp.id",
		"PAYMENT_PROVIDER=xendit",
		"XENDIT_SECRET_KEY=xnd_test_key",
		"XENDIT_WEBHOOK_TOKEN=xnd_test_token",
		`ADMIN_CONSOLE_CREDENTIALS_JSON=[{"adminId":"adm-01","email":"ops@bidanapp.id","passwordHash":"` + defaultAdminPassword + `","focusArea":"support"}]`,
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "PAYMENT_PROVIDER", "XENDIT_SECRET_KEY", "XENDIT_WEBHOOK_TOKEN", "REDIS_URL", "ADMIN_CONSOLE_CREDENTIALS_JSON")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "must not use the development default in production") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLoadFromAppRootAllowsDevelopmentDefaultAdminCredentials(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=development",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=http://localhost:3000",
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "REDIS_URL", "ADMIN_CONSOLE_CREDENTIALS_JSON")
	defer restore()

	cfg, err := loadFromAppRoot(appRoot)
	if err != nil {
		t.Fatalf("load config: %v", err)
	}

	if len(cfg.AdminAuth.Credentials) == 0 {
		t.Fatal("expected default development admin credentials")
	}

	if got, want := cfg.Payment.Provider, "manual_test"; got != want {
		t.Fatalf("unexpected development payment provider: got %s want %s", got, want)
	}
}

func TestLoadFromAppRootFailsWhenProductionCookiesAreNotSecure(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=production",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=https://app.bidanapp.id",
		"PAYMENT_PROVIDER=xendit",
		"XENDIT_SECRET_KEY=xnd_test_key",
		"XENDIT_WEBHOOK_TOKEN=xnd_test_token",
		"AUTH_COOKIE_SECURE=false",
		`ADMIN_CONSOLE_CREDENTIALS_JSON=[{"adminId":"adm-01","email":"ops@bidanapp.id","passwordHash":"$2a$12$9kXq1E5j3H6m7L8n2P4rUeB9tJ0vC1xYzAqR4mTnV7pQwS6dF8gHi","focusArea":"support"}]`,
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "PAYMENT_PROVIDER", "XENDIT_SECRET_KEY", "XENDIT_WEBHOOK_TOKEN", "AUTH_COOKIE_SECURE", "ADMIN_CONSOLE_CREDENTIALS_JSON", "REDIS_URL")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "cookie secure must be true in production") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLoadFromAppRootFailsWhenProductionOriginIsNotHTTPS(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=production",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=http://app.bidanapp.id",
		"PAYMENT_PROVIDER=xendit",
		"XENDIT_SECRET_KEY=xnd_test_key",
		"XENDIT_WEBHOOK_TOKEN=xnd_test_token",
		`ADMIN_CONSOLE_CREDENTIALS_JSON=[{"adminId":"adm-01","email":"ops@bidanapp.id","passwordHash":"$2a$12$9kXq1E5j3H6m7L8n2P4rUeB9tJ0vC1xYzAqR4mTnV7pQwS6dF8gHi","focusArea":"support"}]`,
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "PAYMENT_PROVIDER", "XENDIT_SECRET_KEY", "XENDIT_WEBHOOK_TOKEN", "ADMIN_CONSOLE_CREDENTIALS_JSON", "REDIS_URL")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "must use https in production") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLoadFromAppRootFailsWhenProductionPaymentProviderIsNotXendit(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=production",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=https://app.bidanapp.id",
		"PAYMENT_PROVIDER=manual_test",
		`ADMIN_CONSOLE_CREDENTIALS_JSON=[{"adminId":"adm-01","email":"ops@bidanapp.id","passwordHash":"$2a$12$9kXq1E5j3H6m7L8n2P4rUeB9tJ0vC1xYzAqR4mTnV7pQwS6dF8gHi","focusArea":"support"}]`,
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "PAYMENT_PROVIDER", "ADMIN_CONSOLE_CREDENTIALS_JSON", "REDIS_URL")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "PAYMENT_PROVIDER must be xendit in production") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLoadFromAppRootFailsWhenXenditSecretsAreMissing(t *testing.T) {
	appRoot := t.TempDir()
	seedDataDir := filepath.Join(appRoot, "seeddata")

	if err := os.MkdirAll(seedDataDir, 0o755); err != nil {
		t.Fatalf("create seed data dir: %v", err)
	}

	envFile := strings.Join([]string{
		"APP_ENV=staging",
		"SEED_DATA_DIR=./seeddata",
		"DATABASE_URL=postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable",
		"CORS_ALLOWED_ORIGINS=https://staging.bidanapp.id",
		"PAYMENT_PROVIDER=xendit",
		`ADMIN_CONSOLE_CREDENTIALS_JSON=[{"adminId":"adm-01","email":"ops@bidanapp.id","passwordHash":"$2a$12$9kXq1E5j3H6m7L8n2P4rUeB9tJ0vC1xYzAqR4mTnV7pQwS6dF8gHi","focusArea":"support"}]`,
		"REDIS_URL=redis://localhost:6379",
	}, "\n")

	if err := os.WriteFile(filepath.Join(appRoot, ".env"), []byte(envFile), 0o644); err != nil {
		t.Fatalf("write env file: %v", err)
	}

	restore := clearEnv("APP_ENV", "SEED_DATA_DIR", "DATABASE_URL", "CORS_ALLOWED_ORIGINS", "PAYMENT_PROVIDER", "ADMIN_CONSOLE_CREDENTIALS_JSON", "REDIS_URL")
	defer restore()

	_, err := loadFromAppRoot(appRoot)
	if err == nil {
		t.Fatal("expected config load error")
	}

	if !strings.Contains(err.Error(), "XENDIT_SECRET_KEY must not be empty when PAYMENT_PROVIDER=xendit") {
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
