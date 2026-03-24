package adminauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/web"
)

const (
	sessionNamespace = "admin_auth_session"
	tokenPrefix      = "badm_"
)

var (
	ErrInvalidCredentials    = errors.New("invalid admin email or password")
	ErrMissingAuthorization  = errors.New("missing admin authenticated session")
	ErrInvalidAuthorization  = errors.New("invalid admin authenticated session")
	ErrSessionNotFound       = errors.New("admin session not found")
	ErrSessionExpired        = errors.New("admin session expired")
	ErrSessionRevoked        = errors.New("admin session revoked")
	ErrInvalidSessionPayload = errors.New("invalid admin session payload")
)

type Service struct {
	credentialsByEmail map[string]config.AdminCredentialConfig
	cookie             config.SessionCookieConfig
	sessionTTL         time.Duration
	store              documentstore.Store
}

type AuthenticatedSession struct {
	TokenHash string
	Session   AdminAuthSessionData
}

type issuedSession struct {
	RawToken string
	Session  AdminAuthSessionData
}

type sessionRecord struct {
	AdminID          string `json:"adminId"`
	Email            string `json:"email"`
	FocusArea        string `json:"focusArea"`
	LastLoginAt      string `json:"lastLoginAt,omitempty"`
	LastVisitedRoute string `json:"lastVisitedRoute,omitempty"`
	ExpiresAt        string `json:"expiresAt,omitempty"`
	RevokedAt        string `json:"revokedAt,omitempty"`
}

func NewService(cfg config.AdminAuthConfig, store documentstore.Store) *Service {
	credentialsByEmail := make(map[string]config.AdminCredentialConfig, len(cfg.Credentials))
	for _, credential := range cfg.Credentials {
		normalizedEmail := normalizeEmail(credential.Email)
		if normalizedEmail == "" {
			continue
		}

		credential.Email = normalizedEmail
		credentialsByEmail[normalizedEmail] = credential
	}

	return &Service{
		credentialsByEmail: credentialsByEmail,
		cookie:             cfg.Cookie,
		sessionTTL:         cfg.SessionTTL,
		store:              store,
	}
}

func (s *Service) Login(ctx context.Context, input AdminAuthCreateSessionRequest) (issuedSession, error) {
	email := normalizeEmail(input.Email)
	password := strings.TrimSpace(input.Password)
	credential, ok := s.credentialsByEmail[email]
	if !ok || password == "" {
		return issuedSession{}, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(credential.PasswordHash), []byte(password)); err != nil {
		return issuedSession{}, ErrInvalidCredentials
	}

	rawToken, err := generateToken()
	if err != nil {
		return issuedSession{}, err
	}

	now := time.Now().UTC()
	expiresAt := now.Add(s.sessionTTL)
	record := sessionRecord{
		AdminID:     credential.AdminID,
		Email:       credential.Email,
		FocusArea:   credential.FocusArea,
		LastLoginAt: now.Format(time.RFC3339),
		ExpiresAt:   expiresAt.Format(time.RFC3339),
	}
	if _, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: sessionNamespace,
		Key:       hashToken(rawToken),
		SavedAt:   now,
		Snapshot:  marshalRecord(record),
	}); err != nil {
		return issuedSession{}, err
	}

	return issuedSession{
		RawToken: rawToken,
		Session: AdminAuthSessionData{
			AdminID:         record.AdminID,
			Email:           record.Email,
			FocusArea:       record.FocusArea,
			IsAuthenticated: true,
			LastLoginAt:     record.LastLoginAt,
			ExpiresAt:       record.ExpiresAt,
		},
	}, nil
}

func (s *Service) AuthenticateRequest(
	ctx context.Context,
	authorizationHeader string,
	cookieToken string,
) (AuthenticatedSession, error) {
	rawToken, err := resolveRawSessionToken(cookieToken, authorizationHeader)
	if err != nil {
		return AuthenticatedSession{}, err
	}

	return s.authenticateToken(ctx, rawToken)
}

func (s *Service) SessionCookie(rawToken string, expiresAt string) (http.Cookie, error) {
	parsedExpiresAt, err := time.Parse(time.RFC3339, expiresAt)
	if err != nil {
		return http.Cookie{}, ErrInvalidSessionPayload
	}

	return web.NewSessionCookie(s.cookie, rawToken, parsedExpiresAt), nil
}

func (s *Service) ExpiredSessionCookie() http.Cookie {
	return web.ExpireSessionCookie(s.cookie)
}

func (s *Service) CookieName() string {
	return s.cookie.Name
}

func (s *Service) UpdateSession(ctx context.Context, tokenHash string, input AdminAuthSessionUpdateRequest) (AdminAuthSessionData, error) {
	record, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return AdminAuthSessionData{}, err
	}

	record.LastVisitedRoute = strings.TrimSpace(input.LastVisitedRoute)
	if _, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: sessionNamespace,
		Key:       tokenHash,
		SavedAt:   time.Now().UTC(),
		Snapshot:  marshalRecord(record),
	}); err != nil {
		return AdminAuthSessionData{}, err
	}

	return sessionDataFromRecord(record), nil
}

func (s *Service) Logout(ctx context.Context, tokenHash string) (AdminAuthSessionData, error) {
	record, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return AdminAuthSessionData{}, err
	}

	record.RevokedAt = time.Now().UTC().Format(time.RFC3339)
	if _, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: sessionNamespace,
		Key:       tokenHash,
		SavedAt:   time.Now().UTC(),
		Snapshot:  marshalRecord(record),
	}); err != nil {
		return AdminAuthSessionData{}, err
	}

	loggedOut := sessionDataFromRecord(record)
	loggedOut.IsAuthenticated = false
	return loggedOut, nil
}

func (s *Service) authenticateToken(ctx context.Context, rawToken string) (AuthenticatedSession, error) {
	tokenHash := hashToken(rawToken)
	record, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return AuthenticatedSession{}, err
	}

	return AuthenticatedSession{
		TokenHash: tokenHash,
		Session:   sessionDataFromRecord(record),
	}, nil
}

func (s *Service) readSessionRecord(ctx context.Context, tokenHash string) (sessionRecord, error) {
	if s.store == nil {
		return sessionRecord{}, ErrSessionNotFound
	}

	record, err := s.store.Read(ctx, sessionNamespace, tokenHash)
	if err != nil {
		if errors.Is(err, documentstore.ErrNotFound) {
			return sessionRecord{}, ErrSessionNotFound
		}

		return sessionRecord{}, err
	}

	payload, err := decodeSessionRecord(record.Snapshot)
	if err != nil {
		return sessionRecord{}, err
	}

	if strings.TrimSpace(payload.RevokedAt) != "" {
		return sessionRecord{}, ErrSessionRevoked
	}

	expiresAt, err := time.Parse(time.RFC3339, payload.ExpiresAt)
	if err != nil {
		return sessionRecord{}, ErrInvalidSessionPayload
	}

	if time.Now().UTC().After(expiresAt) {
		return sessionRecord{}, ErrSessionExpired
	}

	return payload, nil
}

func sessionDataFromRecord(record sessionRecord) AdminAuthSessionData {
	return AdminAuthSessionData{
		AdminID:          record.AdminID,
		Email:            record.Email,
		FocusArea:        record.FocusArea,
		IsAuthenticated:  true,
		LastLoginAt:      record.LastLoginAt,
		LastVisitedRoute: record.LastVisitedRoute,
		ExpiresAt:        record.ExpiresAt,
	}
}

func decodeSessionRecord(snapshot map[string]any) (sessionRecord, error) {
	if snapshot == nil {
		return sessionRecord{}, ErrInvalidSessionPayload
	}

	payloadBytes, err := json.Marshal(snapshot)
	if err != nil {
		return sessionRecord{}, err
	}

	var payload sessionRecord
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return sessionRecord{}, err
	}

	if payload.AdminID == "" || payload.Email == "" || payload.FocusArea == "" || payload.ExpiresAt == "" {
		return sessionRecord{}, ErrInvalidSessionPayload
	}

	return payload, nil
}

func marshalRecord(record sessionRecord) map[string]any {
	payload := map[string]any{
		"adminId":     record.AdminID,
		"email":       record.Email,
		"focusArea":   record.FocusArea,
		"expiresAt":   record.ExpiresAt,
		"lastLoginAt": record.LastLoginAt,
	}

	if record.LastVisitedRoute != "" {
		payload["lastVisitedRoute"] = record.LastVisitedRoute
	}
	if record.RevokedAt != "" {
		payload["revokedAt"] = record.RevokedAt
	}

	return payload
}

func parseBearerToken(headerValue string) (string, error) {
	value := strings.TrimSpace(headerValue)
	if value == "" {
		return "", ErrMissingAuthorization
	}

	if !strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return "", ErrInvalidAuthorization
	}

	token := strings.TrimSpace(value[len("bearer "):])
	if token == "" {
		return "", ErrInvalidAuthorization
	}

	return token, nil
}

func resolveRawSessionToken(cookieValue string, authorizationHeader string) (string, error) {
	if token, err := parseBearerToken(authorizationHeader); err == nil {
		return token, nil
	}

	if token := strings.TrimSpace(cookieValue); token != "" {
		return token, nil
	}

	return parseBearerToken(authorizationHeader)
}

func normalizeEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func hashToken(rawToken string) string {
	checksum := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(checksum[:])
}

func generateToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return tokenPrefix + hex.EncodeToString(buffer), nil
}
