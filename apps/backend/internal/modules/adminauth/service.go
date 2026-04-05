package adminauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/web"
)

const (
	sessionRole = "admin"
	tokenPrefix = "badm_"
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
	bootstrapCredentials []config.AdminCredentialConfig
	cookie               config.SessionCookieConfig
	sessionTTL           time.Duration
	store                authstore.Store
}

type AuthenticatedSession struct {
	TokenHash string
	Session   AdminAuthSessionData
}

type issuedSession struct {
	RawToken string
	Session  AdminAuthSessionData
}

func NewService(cfg config.AdminAuthConfig, store authstore.Store) *Service {
	credentials := make([]config.AdminCredentialConfig, 0, len(cfg.Credentials))
	for _, credential := range cfg.Credentials {
		credential.Email = normalizeEmail(credential.Email)
		if credential.Email == "" || strings.TrimSpace(credential.AdminID) == "" {
			continue
		}
		credentials = append(credentials, credential)
	}

	return &Service{
		bootstrapCredentials: credentials,
		cookie:               cfg.Cookie,
		sessionTTL:           cfg.SessionTTL,
		store:                store,
	}
}

func (s *Service) Bootstrap(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if s.store == nil {
		return nil
	}

	now := time.Now().UTC()
	for _, credential := range s.bootstrapCredentials {
		account, err := s.store.AdminAccountByAdminID(ctx, credential.AdminID)
		switch {
		case errors.Is(err, authstore.ErrNotFound):
			userID, idErr := authstore.NewUserID()
			if idErr != nil {
				return idErr
			}

			_, err = s.store.CreateAdminAccount(ctx, authstore.AdminAccount{
				AdminID:      credential.AdminID,
				CreatedAt:    now,
				Email:        credential.Email,
				FocusArea:    credential.FocusArea,
				PasswordHash: credential.PasswordHash,
				UserID:       userID,
			})
		case err != nil:
			return err
		default:
			account.Email = credential.Email
			account.FocusArea = credential.FocusArea
			account.PasswordHash = credential.PasswordHash
			_, err = s.store.UpdateAdminAccount(ctx, account)
		}
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) Login(ctx context.Context, input AdminAuthCreateSessionRequest) (issuedSession, error) {
	email := normalizeEmail(input.Email)
	password := strings.TrimSpace(input.Password)
	if email == "" || password == "" {
		return issuedSession{}, ErrInvalidCredentials
	}

	account, err := s.store.AdminAccountByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return issuedSession{}, ErrInvalidCredentials
		}
		return issuedSession{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(password)); err != nil {
		return issuedSession{}, ErrInvalidCredentials
	}

	rawToken, err := generateToken()
	if err != nil {
		return issuedSession{}, err
	}

	now := time.Now().UTC()
	session := authstore.Session{
		ExpiresAt:   now.Add(s.sessionTTL),
		LastLoginAt: now,
		Role:        sessionRole,
		SavedAt:     now,
		SubjectID:   account.AdminID,
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
	session, account, err := s.readSessionAccount(ctx, tokenHash)
	if err != nil {
		return AdminAuthSessionData{}, err
	}

	session.LastVisitedRoute = strings.TrimSpace(input.LastVisitedRoute)
	session.SavedAt = time.Now().UTC()
	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return AdminAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}

func (s *Service) Logout(ctx context.Context, tokenHash string) (AdminAuthSessionData, error) {
	session, account, err := s.readSessionAccount(ctx, tokenHash)
	if err != nil {
		return AdminAuthSessionData{}, err
	}

	now := time.Now().UTC()
	session.RevokedAt = &now
	session.SavedAt = now
	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return AdminAuthSessionData{}, err
	}

	loggedOut := sessionDataFrom(session, account)
	loggedOut.IsAuthenticated = false
	return loggedOut, nil
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

func (s *Service) readSessionAccount(ctx context.Context, tokenHash string) (authstore.Session, authstore.AdminAccount, error) {
	session, err := s.readSessionRecord(ctx, tokenHash)
	if err != nil {
		return authstore.Session{}, authstore.AdminAccount{}, err
	}

	account, err := s.store.AdminAccountByAdminID(ctx, session.SubjectID)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return authstore.Session{}, authstore.AdminAccount{}, ErrSessionNotFound
		}
		return authstore.Session{}, authstore.AdminAccount{}, err
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

	if session.UserID == "" || session.SubjectID == "" || session.ExpiresAt.IsZero() {
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

func sessionDataFrom(session authstore.Session, account authstore.AdminAccount) AdminAuthSessionData {
	return AdminAuthSessionData{
		AdminID:          account.AdminID,
		Email:            account.Email,
		FocusArea:        account.FocusArea,
		IsAuthenticated:  true,
		LastLoginAt:      session.LastLoginAt.UTC().Format(time.RFC3339),
		LastVisitedRoute: session.LastVisitedRoute,
		ExpiresAt:        session.ExpiresAt.UTC().Format(time.RFC3339),
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
