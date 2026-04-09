package config

import (
	"net"
	"strconv"
	"time"
)

type Config struct {
	App              AppConfig
	HTTP             HTTPConfig
	CORS             CORSConfig
	SeedData         SeedDataConfig
	Assets           AssetStorageConfig
	Database         DatabaseConfig
	AuthRateLimit    AuthRateLimitConfig
	AdminAuth        AdminAuthConfig
	ViewerAuth       ViewerAuthConfig
	Payment          PaymentConfig
	WebPush          WebPushConfig
	Redis            RedisConfig
	Observability    ObservabilityConfig
}

type AppConfig struct {
	Name        string
	Version     string
	Environment string
}

type HTTPConfig struct {
	Host              string
	Port              int
	ReadHeaderTimeout time.Duration
	ReadTimeout       time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
	MaxHeaderBytes    int
}

func (c HTTPConfig) Address() string {
	return net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
}

type CORSConfig struct {
	AllowedOrigins []string
}

func (c CORSConfig) PrimaryOrigin() string {
	if len(c.AllowedOrigins) == 0 {
		return ""
	}

	return c.AllowedOrigins[0]
}

type SeedDataConfig struct {
	DataDir string
}

type AssetStorageConfig struct {
	RootDir string
}

type DatabaseConfig struct {
	URL string
}

type SessionCookieConfig struct {
	Domain   string
	Name     string
	Path     string
	SameSite string
	Secure   bool
}

type AuthRateLimitConfig struct {
	MaxAttempts int
	Window      time.Duration
}

type AdminAuthConfig struct {
	Credentials []AdminCredentialConfig
	Cookie      SessionCookieConfig
	SessionTTL  time.Duration
}

type AdminCredentialConfig struct {
	AdminID      string
	Email        string
	PasswordHash string
	FocusArea    string
}

type ViewerAuthConfig struct {
	Challenge ChallengeConfig
	Cookie    SessionCookieConfig
	SessionTTL time.Duration
	SMS       SMSConfig
}

type ChallengeConfig struct {
	CodeTTL     time.Duration
	MaxAttempts int
}

type SMSConfig struct {
	Provider string
	Twilio   TwilioSMSConfig
}

type TwilioSMSConfig struct {
	AccountSID string
	AuthToken  string
	FromNumber string
}

type PaymentConfig struct {
	Provider string
	Currency string
	Xendit   XenditConfig
}

type XenditConfig struct {
	SecretKey     string
	WebhookToken  string
}

type WebPushConfig struct {
	Subject    string
	PublicKey  string
	PrivateKey string
}

func (c WebPushConfig) Enabled() bool {
	return c.Subject != "" && c.PublicKey != "" && c.PrivateKey != ""
}

type RedisConfig struct {
	URL string
}

type ObservabilityConfig struct {
	LogLevel  string
	LogFormat string
}
