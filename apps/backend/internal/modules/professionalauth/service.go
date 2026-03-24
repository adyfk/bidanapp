package professionalauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/web"
)

const (
	accountRegistryNamespace = "professional_auth_account"
	accountRegistryKey       = "registry"
	sessionNamespace         = "professional_auth_session"
	tokenPrefix              = "bpro_"
)

var (
	ErrInvalidCredentials    = errors.New("invalid professional credentials")
	ErrInvalidPhone          = errors.New("professional phone is required")
	ErrInvalidProfessionalID = errors.New("professional id is required")
	ErrInvalidDisplayName    = errors.New("professional display name is required")
	ErrInvalidCredential     = errors.New("professional credential number is required")
	ErrMissingAuthorization  = errors.New("missing professional authenticated session")
	ErrInvalidAuthorization  = errors.New("invalid professional authenticated session")
	ErrSessionNotFound       = errors.New("professional session not found")
	ErrSessionExpired        = errors.New("professional session expired")
	ErrSessionRevoked        = errors.New("professional session revoked")
	ErrAccountNotFound       = errors.New("professional account not found")
	ErrProfessionalNotFound  = errors.New("professional profile not found")
	ErrAccountAlreadyExists  = errors.New("professional account already exists")
	ErrPhoneAlreadyInUse     = errors.New("professional phone is already in use")
	ErrWeakPassword          = errors.New("professional password does not meet security requirements")
	ErrInvalidSessionPayload = errors.New("invalid professional session payload")
	ErrInvalidAccountPayload = errors.New("invalid professional account payload")
)

type CatalogReader interface {
	Catalog(ctx context.Context) (readmodel.CatalogData, error)
}

type Service struct {
	mu            sync.Mutex
	catalogReader CatalogReader
	cookie        config.SessionCookieConfig
	sessionTTL    time.Duration
	store         documentstore.Store
}

type AuthenticatedSession struct {
	TokenHash string
	Session   ProfessionalAuthSessionData
}

type issuedSession struct {
	RawToken string
	Session  ProfessionalAuthSessionData
}

type accountRegistry struct {
	AccountsByProfessionalID map[string]accountRecord `json:"accountsByProfessionalId,omitempty"`
}

type accountRecord struct {
	City                string `json:"city,omitempty"`
	CredentialNumber    string `json:"credentialNumber"`
	DisplayName         string `json:"displayName"`
	PasswordHash        string `json:"passwordHash"`
	Phone               string `json:"phone"`
	PhoneNormalized     string `json:"phoneNormalized"`
	ProfessionalID      string `json:"professionalId"`
	RecoveryRequestedAt string `json:"recoveryRequestedAt,omitempty"`
	RegisteredAt        string `json:"registeredAt"`
}

type sessionRecord struct {
	ExpiresAt      string `json:"expiresAt"`
	LastLoginAt    string `json:"lastLoginAt"`
	ProfessionalID string `json:"professionalId"`
	RevokedAt      string `json:"revokedAt,omitempty"`
}

func NewService(cfg config.ProfessionalAuthConfig, catalogReader CatalogReader, store documentstore.Store) *Service {
	return &Service{
		catalogReader: catalogReader,
		cookie:        cfg.Cookie,
		sessionTTL:    cfg.SessionTTL,
		store:         store,
	}
}

func (s *Service) Register(ctx context.Context, input ProfessionalAuthRegisterRequest) (issuedSession, error) {
	if err := ctx.Err(); err != nil {
		return issuedSession{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return issuedSession{}, ErrInvalidProfessionalID
	}
	if err := s.ensureProfessionalExists(ctx, professionalID); err != nil {
		return issuedSession{}, err
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return issuedSession{}, err
	}
	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return issuedSession{}, ErrInvalidDisplayName
	}
	credentialNumber := strings.TrimSpace(input.CredentialNumber)
	if credentialNumber == "" {
		return issuedSession{}, ErrInvalidCredential
	}
	password := strings.TrimSpace(input.Password)
	if !passwordMeetsPolicy(password) {
		return issuedSession{}, ErrWeakPassword
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return issuedSession{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return issuedSession{}, err
	}

	if _, exists := registry.AccountsByProfessionalID[professionalID]; exists {
		return issuedSession{}, ErrAccountAlreadyExists
	}
	if phoneInUse(registry, phone, "") {
		return issuedSession{}, ErrPhoneAlreadyInUse
	}

	now := time.Now().UTC()
	account := accountRecord{
		City:             strings.TrimSpace(input.City),
		CredentialNumber: credentialNumber,
		DisplayName:      displayName,
		PasswordHash:     string(passwordHash),
		Phone:            phone,
		PhoneNormalized:  phone,
		ProfessionalID:   professionalID,
		RegisteredAt:     now.Format(time.RFC3339),
	}
	registry.AccountsByProfessionalID[professionalID] = account
	if err := s.writeAccountRegistry(ctx, registry, now); err != nil {
		return issuedSession{}, err
	}

	return s.createSession(ctx, account, now)
}

func (s *Service) Login(ctx context.Context, input ProfessionalAuthCreateSessionRequest) (issuedSession, error) {
	if err := ctx.Err(); err != nil {
		return issuedSession{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return issuedSession{}, ErrInvalidProfessionalID
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return issuedSession{}, err
	}

	password := strings.TrimSpace(input.Password)
	if password == "" {
		return issuedSession{}, ErrInvalidCredentials
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return issuedSession{}, err
	}
	account, ok := registry.AccountsByProfessionalID[professionalID]
	if !ok {
		return issuedSession{}, ErrInvalidCredentials
	}
	if account.PhoneNormalized != phone {
		return issuedSession{}, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(password)); err != nil {
		return issuedSession{}, ErrInvalidCredentials
	}

	return s.createSession(ctx, account, time.Now().UTC())
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

	s.mu.Lock()
	defer s.mu.Unlock()

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

func (s *Service) UpdateAccount(ctx context.Context, tokenHash string, input ProfessionalAuthUpdateAccountRequest) (ProfessionalAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return ProfessionalAuthSessionData{}, err
	}
	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return ProfessionalAuthSessionData{}, ErrInvalidDisplayName
	}
	credentialNumber := strings.TrimSpace(input.CredentialNumber)
	if credentialNumber == "" {
		return ProfessionalAuthSessionData{}, ErrInvalidCredential
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, account, registry, err := s.readSessionAccountAndRegistry(ctx, tokenHash)
	if err != nil {
		return ProfessionalAuthSessionData{}, err
	}
	if phoneInUse(registry, phone, account.ProfessionalID) {
		return ProfessionalAuthSessionData{}, ErrPhoneAlreadyInUse
	}

	account.Phone = phone
	account.PhoneNormalized = phone
	account.DisplayName = displayName
	account.City = strings.TrimSpace(input.City)
	account.CredentialNumber = credentialNumber
	registry.AccountsByProfessionalID[account.ProfessionalID] = account

	if err := s.writeAccountRegistry(ctx, registry, time.Now().UTC()); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}

func (s *Service) UpdatePassword(ctx context.Context, tokenHash string, input ProfessionalAuthUpdatePasswordRequest) (ProfessionalAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	currentPassword := strings.TrimSpace(input.CurrentPassword)
	if currentPassword == "" {
		return ProfessionalAuthSessionData{}, ErrInvalidCredentials
	}
	newPassword := strings.TrimSpace(input.NewPassword)
	if !passwordMeetsPolicy(newPassword) {
		return ProfessionalAuthSessionData{}, ErrWeakPassword
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, account, registry, err := s.readSessionAccountAndRegistry(ctx, tokenHash)
	if err != nil {
		return ProfessionalAuthSessionData{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(currentPassword)); err != nil {
		return ProfessionalAuthSessionData{}, ErrInvalidCredentials
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return ProfessionalAuthSessionData{}, err
	}
	account.PasswordHash = string(passwordHash)
	registry.AccountsByProfessionalID[account.ProfessionalID] = account

	if err := s.writeAccountRegistry(ctx, registry, time.Now().UTC()); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}

func (s *Service) RequestPasswordRecovery(
	ctx context.Context,
	input ProfessionalAuthRequestPasswordRecoveryRequest,
) (ProfessionalAuthPasswordRecoveryData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAuthPasswordRecoveryData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalAuthPasswordRecoveryData{}, ErrInvalidProfessionalID
	}
	if err := s.ensureProfessionalExists(ctx, professionalID); err != nil {
		return ProfessionalAuthPasswordRecoveryData{}, err
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return ProfessionalAuthPasswordRecoveryData{}, err
	}

	now := time.Now().UTC()

	s.mu.Lock()
	defer s.mu.Unlock()

	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return ProfessionalAuthPasswordRecoveryData{}, err
	}
	if account, ok := registry.AccountsByProfessionalID[professionalID]; ok && account.PhoneNormalized == phone {
		account.RecoveryRequestedAt = now.Format(time.RFC3339)
		registry.AccountsByProfessionalID[professionalID] = account
		if err := s.writeAccountRegistry(ctx, registry, now); err != nil {
			return ProfessionalAuthPasswordRecoveryData{}, err
		}
	}

	return ProfessionalAuthPasswordRecoveryData{
		Accepted:    true,
		RequestedAt: now.Format(time.RFC3339),
	}, nil
}

func (s *Service) Logout(ctx context.Context, tokenHash string) (ProfessionalAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, account, err := s.readSessionAccount(ctx, tokenHash)
	if err != nil {
		return ProfessionalAuthSessionData{}, err
	}
	session.RevokedAt = time.Now().UTC().Format(time.RFC3339)
	if err := s.writeSessionRecord(ctx, tokenHash, session, time.Now().UTC()); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	payload := sessionDataFrom(session, account)
	payload.IsAuthenticated = false
	return payload, nil
}

func (s *Service) authenticateToken(ctx context.Context, rawToken string) (AuthenticatedSession, error) {
	tokenHash := hashToken(rawToken)
	session, account, err := s.readSessionAccount(ctx, tokenHash)
	if err != nil {
		return AuthenticatedSession{}, err
	}

	return AuthenticatedSession{
		TokenHash: tokenHash,
		Session:   sessionDataFrom(session, account),
	}, nil
}

func (s *Service) createSession(ctx context.Context, account accountRecord, now time.Time) (issuedSession, error) {
	rawToken, err := generateToken()
	if err != nil {
		return issuedSession{}, err
	}

	session := sessionRecord{
		ExpiresAt:      now.Add(s.sessionTTL).Format(time.RFC3339),
		LastLoginAt:    now.Format(time.RFC3339),
		ProfessionalID: account.ProfessionalID,
	}
	if err := s.writeSessionRecord(ctx, hashToken(rawToken), session, now); err != nil {
		return issuedSession{}, err
	}

	return issuedSession{
		RawToken: rawToken,
		Session:  sessionDataFrom(session, account),
	}, nil
}

func (s *Service) readSessionAccountAndRegistry(
	ctx context.Context,
	tokenHash string,
) (sessionRecord, accountRecord, accountRegistry, error) {
	session, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return sessionRecord{}, accountRecord{}, accountRegistry{}, err
	}
	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return sessionRecord{}, accountRecord{}, accountRegistry{}, err
	}
	account, ok := registry.AccountsByProfessionalID[session.ProfessionalID]
	if !ok {
		return sessionRecord{}, accountRecord{}, accountRegistry{}, ErrAccountNotFound
	}
	return session, account, registry, nil
}

func (s *Service) readSessionAccount(ctx context.Context, tokenHash string) (sessionRecord, accountRecord, error) {
	session, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return sessionRecord{}, accountRecord{}, err
	}
	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return sessionRecord{}, accountRecord{}, err
	}
	account, ok := registry.AccountsByProfessionalID[session.ProfessionalID]
	if !ok {
		return sessionRecord{}, accountRecord{}, ErrAccountNotFound
	}
	return session, account, nil
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

func (s *Service) writeSessionRecord(ctx context.Context, tokenHash string, payload sessionRecord, now time.Time) error {
	if s.store == nil {
		return ErrSessionNotFound
	}

	_, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: sessionNamespace,
		Key:       tokenHash,
		SavedAt:   now,
		Snapshot:  marshalSessionRecord(payload),
	})
	return err
}

func (s *Service) readAccountRegistry(ctx context.Context) (accountRegistry, error) {
	if s.store == nil {
		return accountRegistry{AccountsByProfessionalID: map[string]accountRecord{}}, nil
	}

	record, err := s.store.Read(ctx, accountRegistryNamespace, accountRegistryKey)
	if err != nil {
		if errors.Is(err, documentstore.ErrNotFound) {
			return accountRegistry{AccountsByProfessionalID: map[string]accountRecord{}}, nil
		}
		return accountRegistry{}, err
	}

	payload, err := decodeAccountRegistry(record.Snapshot)
	if err != nil {
		return accountRegistry{}, err
	}
	return payload, nil
}

func (s *Service) writeAccountRegistry(ctx context.Context, registry accountRegistry, now time.Time) error {
	if s.store == nil {
		return ErrAccountNotFound
	}

	_, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: accountRegistryNamespace,
		Key:       accountRegistryKey,
		SavedAt:   now,
		Snapshot:  marshalAccountRegistry(registry),
	})
	return err
}

func (s *Service) ensureProfessionalExists(ctx context.Context, professionalID string) error {
	if s.catalogReader == nil {
		return nil
	}

	catalog, err := s.catalogReader.Catalog(ctx)
	if err != nil {
		return err
	}
	for _, professional := range catalog.Professionals {
		if professional.ID == professionalID {
			return nil
		}
	}
	return ErrProfessionalNotFound
}

func sessionDataFrom(session sessionRecord, account accountRecord) ProfessionalAuthSessionData {
	return ProfessionalAuthSessionData{
		City:             account.City,
		CredentialNumber: account.CredentialNumber,
		DisplayName:      account.DisplayName,
		ExpiresAt:        session.ExpiresAt,
		IsAuthenticated:  true,
		LastLoginAt:      session.LastLoginAt,
		Phone:            account.Phone,
		ProfessionalID:   account.ProfessionalID,
		RegisteredAt:     account.RegisteredAt,
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
	if payload.ProfessionalID == "" || payload.ExpiresAt == "" || payload.LastLoginAt == "" {
		return sessionRecord{}, ErrInvalidSessionPayload
	}

	return payload, nil
}

func marshalSessionRecord(record sessionRecord) map[string]any {
	payload := map[string]any{
		"expiresAt":      record.ExpiresAt,
		"lastLoginAt":    record.LastLoginAt,
		"professionalId": record.ProfessionalID,
	}
	if record.RevokedAt != "" {
		payload["revokedAt"] = record.RevokedAt
	}
	return payload
}

func decodeAccountRegistry(snapshot map[string]any) (accountRegistry, error) {
	if snapshot == nil {
		return accountRegistry{AccountsByProfessionalID: map[string]accountRecord{}}, nil
	}

	payloadBytes, err := json.Marshal(snapshot)
	if err != nil {
		return accountRegistry{}, err
	}

	var payload accountRegistry
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return accountRegistry{}, err
	}
	if payload.AccountsByProfessionalID == nil {
		payload.AccountsByProfessionalID = map[string]accountRecord{}
	}
	for professionalID, account := range payload.AccountsByProfessionalID {
		if professionalID == "" || account.ProfessionalID == "" || account.PhoneNormalized == "" || account.PasswordHash == "" {
			return accountRegistry{}, ErrInvalidAccountPayload
		}
	}

	return payload, nil
}

func marshalAccountRegistry(registry accountRegistry) map[string]any {
	accountsByProfessionalID := map[string]accountRecord{}
	for professionalID, account := range registry.AccountsByProfessionalID {
		accountsByProfessionalID[professionalID] = account
	}
	return map[string]any{
		"accountsByProfessionalId": accountsByProfessionalID,
	}
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

func phoneInUse(registry accountRegistry, normalizedPhone string, excludedProfessionalID string) bool {
	for professionalID, account := range registry.AccountsByProfessionalID {
		if professionalID == excludedProfessionalID {
			continue
		}
		if account.PhoneNormalized == normalizedPhone {
			return true
		}
	}
	return false
}

func normalizePhone(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", ErrInvalidPhone
	}

	var builder strings.Builder
	for index, runeValue := range trimmed {
		switch {
		case runeValue >= '0' && runeValue <= '9':
			builder.WriteRune(runeValue)
		case runeValue == '+' && index == 0:
			builder.WriteRune(runeValue)
		}
	}

	normalized := builder.String()
	if normalized == "" {
		return "", ErrInvalidPhone
	}

	return normalized, nil
}

func passwordMeetsPolicy(value string) bool {
	if len(value) < 8 {
		return false
	}

	hasUppercase := false
	hasNumber := false
	for _, runeValue := range value {
		if runeValue >= 'A' && runeValue <= 'Z' {
			hasUppercase = true
		}
		if runeValue >= '0' && runeValue <= '9' {
			hasNumber = true
		}
	}

	return hasUppercase && hasNumber
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
