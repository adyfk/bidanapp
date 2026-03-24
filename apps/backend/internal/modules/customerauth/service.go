package customerauth

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
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/web"
)

const (
	accountRegistryNamespace = "customer_auth_account"
	accountRegistryKey       = "registry"
	sessionNamespace         = "customer_auth_session"
	tokenPrefix              = "bcus_"
	consumerIDPrefix         = "consumer_"
)

var (
	ErrInvalidCredentials    = errors.New("invalid customer credentials")
	ErrInvalidPhone          = errors.New("customer phone is required")
	ErrInvalidDisplayName    = errors.New("customer display name is required")
	ErrMissingAuthorization  = errors.New("missing customer authenticated session")
	ErrInvalidAuthorization  = errors.New("invalid customer authenticated session")
	ErrSessionNotFound       = errors.New("customer session not found")
	ErrSessionExpired        = errors.New("customer session expired")
	ErrSessionRevoked        = errors.New("customer session revoked")
	ErrAccountNotFound       = errors.New("customer account not found")
	ErrPhoneAlreadyInUse     = errors.New("customer phone is already in use")
	ErrWeakPassword          = errors.New("customer password does not meet security requirements")
	ErrInvalidSessionPayload = errors.New("invalid customer session payload")
	ErrInvalidAccountPayload = errors.New("invalid customer account payload")
)

type Service struct {
	mu         sync.Mutex
	cookie     config.SessionCookieConfig
	sessionTTL time.Duration
	store      documentstore.Store
}

type AuthenticatedSession struct {
	TokenHash string
	Session   CustomerAuthSessionData
}

type issuedSession struct {
	RawToken string
	Session  CustomerAuthSessionData
}

type accountRegistry struct {
	AccountsByConsumerID map[string]accountRecord `json:"accountsByConsumerId,omitempty"`
}

type accountRecord struct {
	City            string `json:"city,omitempty"`
	ConsumerID      string `json:"consumerId"`
	DisplayName     string `json:"displayName"`
	PasswordHash    string `json:"passwordHash"`
	Phone           string `json:"phone"`
	PhoneNormalized string `json:"phoneNormalized"`
	RegisteredAt    string `json:"registeredAt"`
}

type sessionRecord struct {
	ConsumerID  string `json:"consumerId"`
	ExpiresAt   string `json:"expiresAt"`
	LastLoginAt string `json:"lastLoginAt"`
	RevokedAt   string `json:"revokedAt,omitempty"`
}

func NewService(cfg config.CustomerAuthConfig, store documentstore.Store) *Service {
	return &Service{
		cookie:     cfg.Cookie,
		sessionTTL: cfg.SessionTTL,
		store:      store,
	}
}

func (s *Service) Register(ctx context.Context, input CustomerAuthRegisterRequest) (issuedSession, error) {
	if err := ctx.Err(); err != nil {
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
	password := strings.TrimSpace(input.Password)
	if !passwordMeetsPolicy(password) {
		return issuedSession{}, ErrWeakPassword
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return issuedSession{}, err
	}

	now := time.Now().UTC()

	s.mu.Lock()
	defer s.mu.Unlock()

	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return issuedSession{}, err
	}
	if phoneInUse(registry, phone, "") {
		return issuedSession{}, ErrPhoneAlreadyInUse
	}

	consumerID, err := generateConsumerID()
	if err != nil {
		return issuedSession{}, err
	}
	account := accountRecord{
		City:            strings.TrimSpace(input.City),
		ConsumerID:      consumerID,
		DisplayName:     displayName,
		PasswordHash:    string(passwordHash),
		Phone:           phone,
		PhoneNormalized: phone,
		RegisteredAt:    now.Format(time.RFC3339),
	}
	registry.AccountsByConsumerID[consumerID] = account
	if err := s.writeAccountRegistry(ctx, registry, now); err != nil {
		return issuedSession{}, err
	}

	return s.createSession(ctx, account, now)
}

func (s *Service) Login(ctx context.Context, input CustomerAuthCreateSessionRequest) (issuedSession, error) {
	if err := ctx.Err(); err != nil {
		return issuedSession{}, err
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
	account, ok := findAccountByPhone(registry, phone)
	if !ok {
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

func (s *Service) UpdateAccount(ctx context.Context, tokenHash string, input CustomerAuthUpdateAccountRequest) (CustomerAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAuthSessionData{}, err
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}
	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return CustomerAuthSessionData{}, ErrInvalidDisplayName
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, account, registry, err := s.readSessionAccountAndRegistry(ctx, tokenHash)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}
	if phoneInUse(registry, phone, account.ConsumerID) {
		return CustomerAuthSessionData{}, ErrPhoneAlreadyInUse
	}

	account.Phone = phone
	account.PhoneNormalized = phone
	account.DisplayName = displayName
	account.City = strings.TrimSpace(input.City)
	registry.AccountsByConsumerID[account.ConsumerID] = account

	if err := s.writeAccountRegistry(ctx, registry, time.Now().UTC()); err != nil {
		return CustomerAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}

func (s *Service) UpdatePassword(ctx context.Context, tokenHash string, input CustomerAuthUpdatePasswordRequest) (CustomerAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAuthSessionData{}, err
	}

	currentPassword := strings.TrimSpace(input.CurrentPassword)
	if currentPassword == "" {
		return CustomerAuthSessionData{}, ErrInvalidCredentials
	}
	newPassword := strings.TrimSpace(input.NewPassword)
	if !passwordMeetsPolicy(newPassword) {
		return CustomerAuthSessionData{}, ErrWeakPassword
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, account, registry, err := s.readSessionAccountAndRegistry(ctx, tokenHash)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(currentPassword)); err != nil {
		return CustomerAuthSessionData{}, ErrInvalidCredentials
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}
	account.PasswordHash = string(passwordHash)
	registry.AccountsByConsumerID[account.ConsumerID] = account

	if err := s.writeAccountRegistry(ctx, registry, time.Now().UTC()); err != nil {
		return CustomerAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}

func (s *Service) Logout(ctx context.Context, tokenHash string) (CustomerAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAuthSessionData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, account, err := s.readSessionAccount(ctx, tokenHash)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}

	now := time.Now().UTC()
	session.RevokedAt = now.Format(time.RFC3339)
	if err := s.writeSessionRecord(ctx, tokenHash, session, now); err != nil {
		return CustomerAuthSessionData{}, err
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
		ConsumerID:  account.ConsumerID,
		ExpiresAt:   now.Add(s.sessionTTL).Format(time.RFC3339),
		LastLoginAt: now.Format(time.RFC3339),
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
	account, ok := registry.AccountsByConsumerID[session.ConsumerID]
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
	account, ok := registry.AccountsByConsumerID[session.ConsumerID]
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
		return accountRegistry{AccountsByConsumerID: map[string]accountRecord{}}, nil
	}

	record, err := s.store.Read(ctx, accountRegistryNamespace, accountRegistryKey)
	if err != nil {
		if errors.Is(err, documentstore.ErrNotFound) {
			return accountRegistry{AccountsByConsumerID: map[string]accountRecord{}}, nil
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

func sessionDataFrom(session sessionRecord, account accountRecord) CustomerAuthSessionData {
	return CustomerAuthSessionData{
		City:            account.City,
		ConsumerID:      account.ConsumerID,
		DisplayName:     account.DisplayName,
		ExpiresAt:       session.ExpiresAt,
		IsAuthenticated: true,
		LastLoginAt:     session.LastLoginAt,
		Phone:           account.Phone,
		RegisteredAt:    account.RegisteredAt,
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
	if payload.ConsumerID == "" || payload.ExpiresAt == "" || payload.LastLoginAt == "" {
		return sessionRecord{}, ErrInvalidSessionPayload
	}

	return payload, nil
}

func marshalSessionRecord(record sessionRecord) map[string]any {
	payload := map[string]any{
		"consumerId":  record.ConsumerID,
		"expiresAt":   record.ExpiresAt,
		"lastLoginAt": record.LastLoginAt,
	}
	if record.RevokedAt != "" {
		payload["revokedAt"] = record.RevokedAt
	}
	return payload
}

func decodeAccountRegistry(snapshot map[string]any) (accountRegistry, error) {
	if snapshot == nil {
		return accountRegistry{AccountsByConsumerID: map[string]accountRecord{}}, nil
	}

	payloadBytes, err := json.Marshal(snapshot)
	if err != nil {
		return accountRegistry{}, err
	}

	var payload accountRegistry
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return accountRegistry{}, err
	}
	if payload.AccountsByConsumerID == nil {
		payload.AccountsByConsumerID = map[string]accountRecord{}
	}
	for consumerID, account := range payload.AccountsByConsumerID {
		if consumerID == "" || account.ConsumerID == "" || account.PhoneNormalized == "" || account.PasswordHash == "" {
			return accountRegistry{}, ErrInvalidAccountPayload
		}
	}

	return payload, nil
}

func marshalAccountRegistry(registry accountRegistry) map[string]any {
	accountsByConsumerID := map[string]accountRecord{}
	for consumerID, account := range registry.AccountsByConsumerID {
		accountsByConsumerID[consumerID] = account
	}
	return map[string]any{
		"accountsByConsumerId": accountsByConsumerID,
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

func findAccountByPhone(registry accountRegistry, normalizedPhone string) (accountRecord, bool) {
	for _, account := range registry.AccountsByConsumerID {
		if account.PhoneNormalized == normalizedPhone {
			return account, true
		}
	}
	return accountRecord{}, false
}

func phoneInUse(registry accountRegistry, normalizedPhone string, excludedConsumerID string) bool {
	for consumerID, account := range registry.AccountsByConsumerID {
		if consumerID == excludedConsumerID {
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

func generateConsumerID() (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return consumerIDPrefix + hex.EncodeToString(buffer), nil
}
