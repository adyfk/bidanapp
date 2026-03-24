package web

import (
	"net/http"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/config"
)

func NewSessionCookie(cfg config.SessionCookieConfig, rawToken string, expiresAt time.Time) http.Cookie {
	return http.Cookie{
		Name:     cfg.Name,
		Value:    rawToken,
		Path:     cfg.Path,
		Domain:   cfg.Domain,
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   cfg.Secure,
		SameSite: ParseSameSite(cfg.SameSite),
	}
}

func ExpireSessionCookie(cfg config.SessionCookieConfig) http.Cookie {
	return http.Cookie{
		Name:     cfg.Name,
		Value:    "",
		Path:     cfg.Path,
		Domain:   cfg.Domain,
		Expires:  time.Unix(0, 0).UTC(),
		HttpOnly: true,
		MaxAge:   -1,
		Secure:   cfg.Secure,
		SameSite: ParseSameSite(cfg.SameSite),
	}
}

func ParseSameSite(value string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}
