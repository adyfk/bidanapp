package config

import (
	"encoding/json"
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
	defaultAppName             = "bidanapp-backend"
	defaultAppVersion          = "dev"
	defaultEnvironment         = "development"
	defaultFrontendOrigin      = "http://localhost:3000"
	defaultAuthCookiePath      = "/api/v1"
	defaultAuthCookieSameSite  = "lax"
	defaultAuthRateLimitWindow = 5 * time.Minute
	defaultAuthRateLimitMax    = 10
	defaultAdminAuthTTL        = 24 * time.Hour
	defaultCustomerAuthTTL     = 24 * time.Hour
	defaultProfessionalAuthTTL = 24 * time.Hour
	defaultPaymentCurrency     = "IDR"
	defaultAdminPassword       = "$2a$12$VUpiMPsu6djn6JDj.a0a8OACtyvGtGninz4/ZwTsPGGQOK0CL./1C"
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
	seedDataDir, err := resolveDir(
		appRoot,
		envOrDefault("SEED_DATA_DIR", filepath.Join(appRoot, "seeddata")),
	)
	if err != nil {
		return Config{}, fmt.Errorf("resolve seed data dir: %w", err)
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
	authCookieDomain := envOrDefault("AUTH_COOKIE_DOMAIN", "")
	authCookiePath := envOrDefault("AUTH_COOKIE_PATH", defaultAuthCookiePath)
	authCookieSameSite := strings.ToLower(envOrDefault("AUTH_COOKIE_SAME_SITE", defaultAuthCookieSameSite))
	authCookieSecure, err := envBoolOrDefault("AUTH_COOKIE_SECURE", defaultAuthCookieSecure(environment))
	if err != nil {
		return Config{}, err
	}
	authRateLimitWindow, err := envDurationOrDefault("AUTH_RATE_LIMIT_WINDOW", defaultAuthRateLimitWindow)
	if err != nil {
		return Config{}, err
	}
	authRateLimitMaxAttempts, err := envIntOrDefault("AUTH_RATE_LIMIT_MAX_ATTEMPTS", defaultAuthRateLimitMax)
	if err != nil {
		return Config{}, err
	}
	adminSessionTTL, err := envDurationOrDefault("ADMIN_AUTH_SESSION_TTL", defaultAdminAuthTTL)
	if err != nil {
		return Config{}, err
	}
	customerSessionTTL, err := envDurationOrDefault("CUSTOMER_AUTH_SESSION_TTL", defaultCustomerAuthTTL)
	if err != nil {
		return Config{}, err
	}
	professionalSessionTTL, err := envDurationOrDefault("PROFESSIONAL_AUTH_SESSION_TTL", defaultProfessionalAuthTTL)
	if err != nil {
		return Config{}, err
	}
	paymentProvider := envOrDefault("PAYMENT_PROVIDER", defaultPaymentProvider(environment))
	paymentCurrency := strings.ToUpper(envOrDefault("PAYMENT_CURRENCY", defaultPaymentCurrency))
	xenditSecretKey := strings.TrimSpace(os.Getenv("XENDIT_SECRET_KEY"))
	xenditWebhookToken := strings.TrimSpace(os.Getenv("XENDIT_WEBHOOK_TOKEN"))
	webPushSubject := strings.TrimSpace(os.Getenv("WEB_PUSH_SUBJECT"))
	webPushPublicKey := strings.TrimSpace(os.Getenv("WEB_PUSH_PUBLIC_KEY"))
	webPushPrivateKey := strings.TrimSpace(os.Getenv("WEB_PUSH_PRIVATE_KEY"))

	adminCredentials, err := loadAdminCredentials(environment)
	if err != nil {
		return Config{}, err
	}

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
		SeedData: SeedDataConfig{
			DataDir: seedDataDir,
		},
		Database: DatabaseConfig{
			URL: envOrDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/bidanapp?sslmode=disable"),
		},
		AuthRateLimit: AuthRateLimitConfig{
			MaxAttempts: authRateLimitMaxAttempts,
			Window:      authRateLimitWindow,
		},
		AdminAuth: AdminAuthConfig{
			Credentials: adminCredentials,
			Cookie: SessionCookieConfig{
				Domain:   authCookieDomain,
				Name:     envOrDefault("ADMIN_AUTH_COOKIE_NAME", "bidanapp_admin_session"),
				Path:     authCookiePath,
				SameSite: authCookieSameSite,
				Secure:   authCookieSecure,
			},
			SessionTTL: adminSessionTTL,
		},
		CustomerAuth: CustomerAuthConfig{
			Cookie: SessionCookieConfig{
				Domain:   authCookieDomain,
				Name:     envOrDefault("CUSTOMER_AUTH_COOKIE_NAME", "bidanapp_customer_session"),
				Path:     authCookiePath,
				SameSite: authCookieSameSite,
				Secure:   authCookieSecure,
			},
			SessionTTL: customerSessionTTL,
		},
		ProfessionalAuth: ProfessionalAuthConfig{
			Cookie: SessionCookieConfig{
				Domain:   authCookieDomain,
				Name:     envOrDefault("PROFESSIONAL_AUTH_COOKIE_NAME", "bidanapp_professional_session"),
				Path:     authCookiePath,
				SameSite: authCookieSameSite,
				Secure:   authCookieSecure,
			},
			SessionTTL: professionalSessionTTL,
		},
		Payment: PaymentConfig{
			Provider: paymentProvider,
			Currency: paymentCurrency,
			Xendit: XenditConfig{
				SecretKey:    xenditSecretKey,
				WebhookToken: xenditWebhookToken,
			},
		},
		WebPush: WebPushConfig{
			Subject:    webPushSubject,
			PublicKey:  webPushPublicKey,
			PrivateKey: webPushPrivateKey,
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
		if origin == "*" {
			issues = append(issues, "CORS_ALLOWED_ORIGINS must not contain * when cookie-authenticated sessions are enabled")
			continue
		}

		normalized, err := normalizeOrigin(origin)
		if err != nil {
			issues = append(issues, fmt.Sprintf("CORS_ALLOWED_ORIGINS[%d] %v", index, err))
			continue
		}

		c.CORS.AllowedOrigins[index] = normalized
		if isProductionLike(c.App.Environment) && !strings.HasPrefix(normalized, "https://") {
			issues = append(issues, fmt.Sprintf("CORS_ALLOWED_ORIGINS[%d] must use https in %s (got %q)", index, c.App.Environment, normalized))
		}
	}

	if info, err := os.Stat(c.SeedData.DataDir); err != nil {
		issues = append(issues, fmt.Sprintf("SEED_DATA_DIR must point to an existing directory (got %q)", c.SeedData.DataDir))
	} else if !info.IsDir() {
		issues = append(issues, fmt.Sprintf("SEED_DATA_DIR must be a directory (got %q)", c.SeedData.DataDir))
	}

	if err := validateURL("DATABASE_URL", c.Database.URL); err != nil {
		issues = append(issues, err.Error())
	}

	if c.AdminAuth.SessionTTL <= 0 {
		issues = append(issues, "ADMIN_AUTH_SESSION_TTL must be greater than 0")
	}
	if c.CustomerAuth.SessionTTL <= 0 {
		issues = append(issues, "CUSTOMER_AUTH_SESSION_TTL must be greater than 0")
	}
	if c.ProfessionalAuth.SessionTTL <= 0 {
		issues = append(issues, "PROFESSIONAL_AUTH_SESSION_TTL must be greater than 0")
	}
	if c.AuthRateLimit.Window <= 0 {
		issues = append(issues, "AUTH_RATE_LIMIT_WINDOW must be greater than 0")
	}
	if c.AuthRateLimit.MaxAttempts <= 0 {
		issues = append(issues, "AUTH_RATE_LIMIT_MAX_ATTEMPTS must be greater than 0")
	}
	c.Payment.Provider = strings.ToLower(strings.TrimSpace(c.Payment.Provider))
	c.Payment.Currency = strings.ToUpper(strings.TrimSpace(c.Payment.Currency))
	c.Payment.Xendit.SecretKey = strings.TrimSpace(c.Payment.Xendit.SecretKey)
	c.Payment.Xendit.WebhookToken = strings.TrimSpace(c.Payment.Xendit.WebhookToken)

	if !oneOf(c.Payment.Provider, "manual_test", "xendit") {
		issues = append(issues, fmt.Sprintf("PAYMENT_PROVIDER must be one of manual_test, xendit (got %q)", c.Payment.Provider))
	}
	if strings.TrimSpace(c.Payment.Currency) == "" {
		issues = append(issues, "PAYMENT_CURRENCY must not be empty")
	}
	if c.Payment.Provider == "xendit" {
		if c.Payment.Xendit.SecretKey == "" {
			issues = append(issues, "XENDIT_SECRET_KEY must not be empty when PAYMENT_PROVIDER=xendit")
		}
		if c.Payment.Xendit.WebhookToken == "" {
			issues = append(issues, "XENDIT_WEBHOOK_TOKEN must not be empty when PAYMENT_PROVIDER=xendit")
		}
	}
	if isProductionLike(c.App.Environment) && c.Payment.Provider != "xendit" {
		issues = append(issues, fmt.Sprintf("PAYMENT_PROVIDER must be xendit in %s", c.App.Environment))
	}
	issues = append(issues, validateSessionCookieConfig("ADMIN_AUTH", c.AdminAuth.Cookie, c.App.Environment)...)
	issues = append(issues, validateSessionCookieConfig("CUSTOMER_AUTH", c.CustomerAuth.Cookie, c.App.Environment)...)
	issues = append(issues, validateSessionCookieConfig("PROFESSIONAL_AUTH", c.ProfessionalAuth.Cookie, c.App.Environment)...)
	issues = append(issues, validateWebPushConfig(c.WebPush)...)

	if len(c.AdminAuth.Credentials) == 0 {
		issues = append(issues, "ADMIN_CONSOLE_CREDENTIALS_JSON must contain at least one credential")
	}

	seenAdminIDs := map[string]struct{}{}
	seenEmails := map[string]struct{}{}
	for index, credential := range c.AdminAuth.Credentials {
		credential.AdminID = strings.TrimSpace(credential.AdminID)
		credential.Email = strings.ToLower(strings.TrimSpace(credential.Email))
		credential.PasswordHash = strings.TrimSpace(credential.PasswordHash)
		credential.FocusArea = strings.TrimSpace(credential.FocusArea)
		c.AdminAuth.Credentials[index] = credential

		if credential.AdminID == "" {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].adminId must not be empty", index))
		} else if _, exists := seenAdminIDs[credential.AdminID]; exists {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].adminId must be unique (got %q)", index, credential.AdminID))
		} else {
			seenAdminIDs[credential.AdminID] = struct{}{}
		}

		if credential.Email == "" {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].email must not be empty", index))
		} else if _, exists := seenEmails[credential.Email]; exists {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].email must be unique (got %q)", index, credential.Email))
		} else {
			seenEmails[credential.Email] = struct{}{}
		}

		if credential.PasswordHash == "" {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].passwordHash must not be empty", index))
		} else if (c.App.Environment == "production" || c.App.Environment == "staging") && credential.PasswordHash == defaultAdminPassword {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].passwordHash must not use the development default in %s", index, c.App.Environment))
		}

		if !oneOf(credential.FocusArea, "catalog", "ops", "reviews", "support") {
			issues = append(issues, fmt.Sprintf("ADMIN_CONSOLE_CREDENTIALS_JSON[%d].focusArea must be one of catalog, ops, reviews, support (got %q)", index, credential.FocusArea))
		}
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

func validateWebPushConfig(cfg WebPushConfig) []string {
	var issues []string

	if cfg.Subject == "" && cfg.PublicKey == "" && cfg.PrivateKey == "" {
		return issues
	}

	if cfg.Subject == "" {
		issues = append(issues, "WEB_PUSH_SUBJECT must not be empty when web push is configured")
	}
	if cfg.PublicKey == "" {
		issues = append(issues, "WEB_PUSH_PUBLIC_KEY must not be empty when web push is configured")
	}
	if cfg.PrivateKey == "" {
		issues = append(issues, "WEB_PUSH_PRIVATE_KEY must not be empty when web push is configured")
	}

	if cfg.Subject != "" && !strings.HasPrefix(cfg.Subject, "mailto:") {
		parsed, err := url.Parse(cfg.Subject)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			issues = append(issues, fmt.Sprintf("WEB_PUSH_SUBJECT must be a valid https URL or mailto address (got %q)", cfg.Subject))
		}
	}

	return issues
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

func envBoolOrDefault(key string, fallback bool) (bool, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, fmt.Errorf("%s must be a valid boolean: %w", key, err)
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

func defaultPaymentProvider(environment string) string {
	if isProductionLike(environment) {
		return "xendit"
	}

	return "manual_test"
}

func defaultAuthCookieSecure(environment string) bool {
	return environment == "production" || environment == "staging"
}

func validateSessionCookieConfig(prefix string, cfg SessionCookieConfig, environment string) []string {
	var issues []string

	if strings.TrimSpace(cfg.Name) == "" {
		issues = append(issues, fmt.Sprintf("%s cookie name must not be empty", prefix))
	}

	if strings.TrimSpace(cfg.Path) == "" || !strings.HasPrefix(cfg.Path, "/") {
		issues = append(issues, fmt.Sprintf("%s cookie path must start with / (got %q)", prefix, cfg.Path))
	}

	if !oneOf(strings.ToLower(cfg.SameSite), "lax", "strict", "none") {
		issues = append(issues, fmt.Sprintf("%s cookie same-site must be one of lax, strict, none (got %q)", prefix, cfg.SameSite))
	}

	if strings.EqualFold(cfg.SameSite, "none") && !cfg.Secure {
		issues = append(issues, fmt.Sprintf("%s cookie secure must be true when same-site is none", prefix))
	}

	if isProductionLike(environment) && !cfg.Secure {
		issues = append(issues, fmt.Sprintf("%s cookie secure must be true in %s", prefix, environment))
	}

	return issues
}

func loadAdminCredentials(environment string) ([]AdminCredentialConfig, error) {
	rawValue := strings.TrimSpace(os.Getenv("ADMIN_CONSOLE_CREDENTIALS_JSON"))
	if rawValue == "" {
		if environment != "development" && environment != "test" {
			return nil, nil
		}

		return defaultAdminCredentials(), nil
	}

	var credentials []AdminCredentialConfig
	if err := json.Unmarshal([]byte(rawValue), &credentials); err != nil {
		return nil, fmt.Errorf("ADMIN_CONSOLE_CREDENTIALS_JSON must be valid JSON: %w", err)
	}

	return credentials, nil
}

func defaultAdminCredentials() []AdminCredentialConfig {
	return []AdminCredentialConfig{
		{
			AdminID:      "adm-01",
			Email:        "naya@ops.bidanapp.id",
			PasswordHash: defaultAdminPassword,
			FocusArea:    "support",
		},
		{
			AdminID:      "adm-02",
			Email:        "rani@ops.bidanapp.id",
			PasswordHash: defaultAdminPassword,
			FocusArea:    "reviews",
		},
		{
			AdminID:      "adm-03",
			Email:        "dimas@ops.bidanapp.id",
			PasswordHash: defaultAdminPassword,
			FocusArea:    "ops",
		},
		{
			AdminID:      "adm-04",
			Email:        "vina@ops.bidanapp.id",
			PasswordHash: defaultAdminPassword,
			FocusArea:    "catalog",
		},
	}
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

func isProductionLike(environment string) bool {
	return environment == "production" || environment == "staging"
}
