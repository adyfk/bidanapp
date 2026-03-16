package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

const (
	defaultAppName        = "bidanapp-backend"
	defaultAppVersion     = "dev"
	defaultEnvironment    = "development"
	defaultFrontendOrigin = "http://localhost:3000"
)

func Load() (Config, error) {
	appRoot, err := appRootDir()
	if err != nil {
		return Config{}, err
	}

	return loadFromAppRoot(appRoot)
}

func loadFromAppRoot(appRoot string) (Config, error) {
	if err := loadEnvFiles(appRoot); err != nil {
		return Config{}, fmt.Errorf("load env files: %w", err)
	}

	environment := envOrDefault("APP_ENV", defaultEnvironment)
	mockDBDataDir, err := resolveDir(appRoot, envOrDefault("MOCK_DB_DIR", filepath.Join(appRoot, "../frontend/src/data/mock-db")))
	if err != nil {
		return Config{}, fmt.Errorf("resolve mock db dir: %w", err)
	}

	httpPort, err := envIntOrDefault("HTTP_PORT", 8080)
	if err != nil {
		return Config{}, err
	}

	readHeaderTimeout, err := envDurationOrDefault("HTTP_READ_HEADER_TIMEOUT", 5*time.Second)
	if err != nil {
		return Config{}, err
	}

	readTimeout, err := envDurationOrDefault("HTTP_READ_TIMEOUT", 10*time.Second)
	if err != nil {
		return Config{}, err
	}

	writeTimeout, err := envDurationOrDefault("HTTP_WRITE_TIMEOUT", 30*time.Second)
	if err != nil {
		return Config{}, err
	}

	idleTimeout, err := envDurationOrDefault("HTTP_IDLE_TIMEOUT", 60*time.Second)
	if err != nil {
		return Config{}, err
	}

	shutdownTimeout, err := envDurationOrDefault("HTTP_SHUTDOWN_TIMEOUT", 10*time.Second)
	if err != nil {
		return Config{}, err
	}

	maxHeaderBytes, err := envIntOrDefault("HTTP_MAX_HEADER_BYTES", 1<<20)
	if err != nil {
		return Config{}, err
	}

	allowedOrigins := envCSVOrDefault("CORS_ALLOWED_ORIGINS", []string{envOrDefault("FRONTEND_ORIGIN", defaultFrontendOrigin)})

	cfg := Config{
		App: AppConfig{
			Name:        envOrDefault("APP_NAME", defaultAppName),
			Version:     envOrDefault("APP_VERSION", defaultAppVersion),
			Environment: environment,
		},
		HTTP: HTTPConfig{
			Host:              envOrDefault("HTTP_HOST", "0.0.0.0"),
			Port:              httpPort,
			ReadHeaderTimeout: readHeaderTimeout,
			ReadTimeout:       readTimeout,
			WriteTimeout:      writeTimeout,
			IdleTimeout:       idleTimeout,
			ShutdownTimeout:   shutdownTimeout,
			MaxHeaderBytes:    maxHeaderBytes,
		},
		CORS: CORSConfig{
			AllowedOrigins: allowedOrigins,
		},
		MockDB: MockDBConfig{
			DataDir: mockDBDataDir,
		},
		Database: DatabaseConfig{
			URL: envOrDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable"),
		},
		Redis: RedisConfig{
			URL: envOrDefault("REDIS_URL", "redis://localhost:6379"),
		},
		Observability: ObservabilityConfig{
			LogLevel:  envOrDefault("LOG_LEVEL", defaultLogLevel(environment)),
			LogFormat: envOrDefault("LOG_FORMAT", defaultLogFormat(environment)),
		},
	}

	if err := cfg.validate(); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	var issues []string

	if !oneOf(c.App.Environment, "development", "staging", "production", "test") {
		issues = append(issues, fmt.Sprintf("APP_ENV must be one of development, staging, production, test (got %q)", c.App.Environment))
	}

	if strings.TrimSpace(c.App.Name) == "" {
		issues = append(issues, "APP_NAME must not be empty")
	}

	if strings.TrimSpace(c.App.Version) == "" {
		issues = append(issues, "APP_VERSION must not be empty")
	}

	if strings.TrimSpace(c.HTTP.Host) == "" {
		issues = append(issues, "HTTP_HOST must not be empty")
	}

	if c.HTTP.Port < 1 || c.HTTP.Port > 65535 {
		issues = append(issues, fmt.Sprintf("HTTP_PORT must be between 1 and 65535 (got %d)", c.HTTP.Port))
	}

	if c.HTTP.ReadHeaderTimeout <= 0 {
		issues = append(issues, "HTTP_READ_HEADER_TIMEOUT must be greater than 0")
	}

	if c.HTTP.ReadTimeout <= 0 {
		issues = append(issues, "HTTP_READ_TIMEOUT must be greater than 0")
	}

	if c.HTTP.WriteTimeout <= 0 {
		issues = append(issues, "HTTP_WRITE_TIMEOUT must be greater than 0")
	}

	if c.HTTP.IdleTimeout <= 0 {
		issues = append(issues, "HTTP_IDLE_TIMEOUT must be greater than 0")
	}

	if c.HTTP.ShutdownTimeout <= 0 {
		issues = append(issues, "HTTP_SHUTDOWN_TIMEOUT must be greater than 0")
	}

	if c.HTTP.MaxHeaderBytes < 1024 {
		issues = append(issues, "HTTP_MAX_HEADER_BYTES must be at least 1024")
	}

	if len(c.CORS.AllowedOrigins) == 0 {
		issues = append(issues, "CORS_ALLOWED_ORIGINS must contain at least one origin")
	}

	for index, origin := range c.CORS.AllowedOrigins {
		normalized, err := normalizeOrigin(origin)
		if err != nil {
			issues = append(issues, fmt.Sprintf("CORS_ALLOWED_ORIGINS[%d] %v", index, err))
			continue
		}

		c.CORS.AllowedOrigins[index] = normalized
	}

	if info, err := os.Stat(c.MockDB.DataDir); err != nil {
		issues = append(issues, fmt.Sprintf("MOCK_DB_DIR must point to an existing directory (got %q)", c.MockDB.DataDir))
	} else if !info.IsDir() {
		issues = append(issues, fmt.Sprintf("MOCK_DB_DIR must be a directory (got %q)", c.MockDB.DataDir))
	}

	if err := validateURL("DATABASE_URL", c.Database.URL); err != nil {
		issues = append(issues, err.Error())
	}

	if err := validateURL("REDIS_URL", c.Redis.URL); err != nil {
		issues = append(issues, err.Error())
	}

	if !oneOf(strings.ToLower(c.Observability.LogLevel), "debug", "info", "warn", "error") {
		issues = append(issues, fmt.Sprintf("LOG_LEVEL must be one of debug, info, warn, error (got %q)", c.Observability.LogLevel))
	}

	if !oneOf(strings.ToLower(c.Observability.LogFormat), "text", "json") {
		issues = append(issues, fmt.Sprintf("LOG_FORMAT must be one of text, json (got %q)", c.Observability.LogFormat))
	}

	if len(issues) > 0 {
		return errors.New("invalid config:\n - " + strings.Join(issues, "\n - "))
	}

	return nil
}

func appRootDir() (string, error) {
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", errors.New("determine app root: runtime caller unavailable")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(currentFile), "../..")), nil
}

func resolveDir(baseDir string, raw string) (string, error) {
	if strings.TrimSpace(raw) == "" {
		return "", errors.New("path must not be empty")
	}

	if filepath.IsAbs(raw) {
		return filepath.Clean(raw), nil
	}

	return filepath.Abs(filepath.Join(baseDir, raw))
}

func validateURL(name string, raw string) error {
	parsed, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("%s must be a valid URL: %w", name, err)
	}

	if parsed.Scheme == "" || parsed.Host == "" {
		return fmt.Errorf("%s must include a scheme and host (got %q)", name, raw)
	}

	return nil
}

func normalizeOrigin(raw string) (string, error) {
	parsed, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("must be a valid origin: %w", err)
	}

	if parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("must include scheme and host (got %q)", raw)
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", fmt.Errorf("must use http or https (got %q)", raw)
	}

	if parsed.Path != "" && parsed.Path != "/" {
		return "", fmt.Errorf("must not include a path (got %q)", raw)
	}

	return parsed.Scheme + "://" + parsed.Host, nil
}

func envOrDefault(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func envIntOrDefault(key string, fallback int) (int, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a valid integer: %w", key, err)
	}

	return parsed, nil
}

func envDurationOrDefault(key string, fallback time.Duration) (time.Duration, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	parsed, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a valid duration: %w", key, err)
	}

	return parsed, nil
}

func envCSVOrDefault(key string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return append([]string(nil), fallback...)
	}

	parts := strings.Split(value, ",")
	items := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}

		items = append(items, trimmed)
	}

	if len(items) == 0 {
		return append([]string(nil), fallback...)
	}

	return items
}

func defaultLogLevel(environment string) string {
	if environment == "production" {
		return "info"
	}

	return "debug"
}

func defaultLogFormat(environment string) string {
	if environment == "production" {
		return "json"
	}

	return "text"
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}

	return ""
}

func oneOf(value string, expected ...string) bool {
	for _, item := range expected {
		if value == item {
			return true
		}
	}

	return false
}
