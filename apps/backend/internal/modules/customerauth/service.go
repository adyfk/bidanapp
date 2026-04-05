package customerauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/web"
)

const (
	consumerIDPrefix = "consumer_"
	sessionRole      = "customer"
	tokenPrefix      = "bcus_"
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
	store      authstore.Store
}

type AuthenticatedSession struct {
	TokenHash string
	Session   CustomerAuthSessionData
}

type issuedSession struct {
	RawToken string
	Session  CustomerAuthSessionData
}

func NewService(cfg config.CustomerAuthConfig, store authstore.Store) *Service {
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
	consumerID, err := generateConsumerID()
	if err != nil {
		return issuedSession{}, err
	}
	userID, err := authstore.NewUserID()
	if err != nil {
		return issuedSession{}, err
	}

	account := authstore.CustomerAccount{
		City:            strings.TrimSpace(input.City),
		ConsumerID:      consumerID,
		DisplayName:     displayName,
		PasswordHash:    string(passwordHash),
		Phone:           phone,
		PhoneNormalized: phone,
		RegisteredAt:    now,
		UserID:          userID,
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, err := s.store.CustomerAccountByPhone(ctx, phone); err == nil {
		return issuedSession{}, ErrPhoneAlreadyInUse
	} else if err != nil && !errors.Is(err, authstore.ErrNotFound) {
		return issuedSession{}, err
	}

	created, err := s.store.CreateCustomerAccount(ctx, account)
	if err != nil {
		if errors.Is(err, authstore.ErrConflict) {
			return issuedSession{}, ErrPhoneAlreadyInUse
		}
		return issuedSession{}, err
	}

	return s.createSession(ctx, created, now)
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

	account, err := s.store.CustomerAccountByPhone(ctx, phone)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return issuedSession{}, ErrInvalidCredentials
		}
		return issuedSession{}, err
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

	session, account, err := s.readSessionAccount(ctx, tokenHash)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}
	if existing, err := s.store.CustomerAccountByPhone(ctx, phone); err == nil && existing.ConsumerID != account.ConsumerID {
		return CustomerAuthSessionData{}, ErrPhoneAlreadyInUse
	} else if err != nil && !errors.Is(err, authstore.ErrNotFound) {
		return CustomerAuthSessionData{}, err
	}

	account.Phone = phone
	account.PhoneNormalized = phone
	account.DisplayName = displayName
	account.City = strings.TrimSpace(input.City)

	updated, err := s.store.UpdateCustomerAccount(ctx, account)
	if err != nil {
		if errors.Is(err, authstore.ErrConflict) {
			return CustomerAuthSessionData{}, ErrPhoneAlreadyInUse
		}
		return CustomerAuthSessionData{}, err
	}

	return sessionDataFrom(session, updated), nil
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

	session, account, err := s.readSessionAccount(ctx, tokenHash)
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

	updated, err := s.store.UpdateCustomerAccount(ctx, account)
	if err != nil {
		return CustomerAuthSessionData{}, err
	}

	return sessionDataFrom(session, updated), nil
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
	session.RevokedAt = &now
	session.SavedAt = now
	if _, err := s.store.SaveSession(ctx, session); err != nil {
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

func (s *Service) createSession(ctx context.Context, account authstore.CustomerAccount, now time.Time) (issuedSession, error) {
	rawToken, err := generateToken()
	if err != nil {
		return issuedSession{}, err
	}

	session := authstore.Session{
		ExpiresAt:   now.Add(s.sessionTTL),
		LastLoginAt: now,
		Role:        sessionRole,
		SavedAt:     now,
		SubjectID:   account.ConsumerID,
		TokenHash:   hashToken(rawToken),
		UserID:      account.UserID,
	}
	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return issuedSession{}, err
	}

	return issuedSession{
		RawToken: rawToken,
		Session:  sessionDataFrom(session, account),
	}, nil
}

func (s *Service) readSessionAccount(ctx context.Context, tokenHash string) (authstore.Session, authstore.CustomerAccount, error) {
	session, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return authstore.Session{}, authstore.CustomerAccount{}, err
	}

	account, err := s.store.CustomerAccountByConsumerID(ctx, session.SubjectID)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return authstore.Session{}, authstore.CustomerAccount{}, ErrAccountNotFound
		}
		return authstore.Session{}, authstore.CustomerAccount{}, err
	}

	return session, account, nil
}

func (s *Service) readSessionRecord(ctx context.Context, tokenHash string) (authstore.Session, error) {
	if s.store == nil {
		return authstore.Session{}, ErrSessionNotFound
	}

	session, err := s.store.SessionByTokenHash(ctx, sessionRole, tokenHash)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return authstore.Session{}, ErrSessionNotFound
		}
		return authstore.Session{}, err
	}

	if session.UserID == "" || session.SubjectID == "" || session.ExpiresAt.IsZero() || session.LastLoginAt.IsZero() {
		return authstore.Session{}, ErrInvalidSessionPayload
	}
	if session.RevokedAt != nil && !session.RevokedAt.IsZero() {
		return authstore.Session{}, ErrSessionRevoked
	}
	if time.Now().UTC().After(session.ExpiresAt.UTC()) {
		return authstore.Session{}, ErrSessionExpired
	}

	return session, nil
}

func sessionDataFrom(session authstore.Session, account authstore.CustomerAccount) CustomerAuthSessionData {
	return CustomerAuthSessionData{
		City:            account.City,
		ConsumerID:      account.ConsumerID,
		DisplayName:     account.DisplayName,
		ExpiresAt:       session.ExpiresAt.UTC().Format(time.RFC3339),
		IsAuthenticated: true,
		LastLoginAt:     session.LastLoginAt.UTC().Format(time.RFC3339),
		Phone:           account.Phone,
		RegisteredAt:    account.RegisteredAt.UTC().Format(time.RFC3339),
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
