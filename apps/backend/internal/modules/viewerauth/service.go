package viewerauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/sms"
	"bidanapp/apps/backend/internal/platform/web"
)

const (
	sessionRole = "viewer"
	tokenPrefix = "bview_"
)

var (
	ErrAccountNotFound       = errors.New("viewer account not found")
	ErrChallengeConsumed     = errors.New("viewer challenge already consumed")
	ErrChallengeExpired      = errors.New("viewer challenge expired")
	ErrChallengeNotFound     = errors.New("viewer challenge not found")
	ErrChallengeRateLimited  = errors.New("viewer challenge max attempts reached")
	ErrChallengeUnverified   = errors.New("viewer challenge not verified")
	ErrDatabaseUnavailable   = errors.New("viewer auth requires a database connection")
	ErrInvalidAuthorization  = errors.New("invalid viewer authenticated session")
	ErrInvalidChallenge      = errors.New("invalid viewer challenge")
	ErrInvalidChallengeCode  = errors.New("invalid viewer challenge code")
	ErrInvalidChallengeType  = errors.New("invalid viewer challenge type")
	ErrInvalidCredentials    = errors.New("invalid viewer credentials")
	ErrInvalidDisplayName    = errors.New("viewer display name is required")
	ErrInvalidPhone          = errors.New("viewer phone is required")
	ErrInvalidSessionPayload = errors.New("invalid viewer session payload")
	ErrMissingAuthorization  = errors.New("missing viewer authenticated session")
	ErrPhoneAlreadyInUse     = errors.New("viewer phone is already in use")
	ErrResetRequiresPhone    = errors.New("password reset requires a phone identity")
	ErrSessionExpired        = errors.New("viewer session expired")
	ErrSessionNotFound       = errors.New("viewer session not found")
	ErrSessionRevoked        = errors.New("viewer session revoked")
	ErrUnsupportedSMS        = errors.New("viewer sms delivery is not configured")
	ErrWeakPassword          = errors.New("viewer password does not meet security requirements")
)

type Service struct {
	challenge  config.ChallengeConfig
	cookie     config.SessionCookieConfig
	db         *sql.DB
	sessionTTL time.Duration
	sms        sms.Sender
	store      authstore.Store
	mu         sync.Mutex
}

type AuthenticatedSession struct {
	SessionID string
	TokenHash string
	Session   ViewerAuthSessionData
}

type issuedSession struct {
	RawToken string
	Session  ViewerAuthSessionData
}

func NewService(cfg config.ViewerAuthConfig, db *sql.DB, store authstore.Store, sender sms.Sender) *Service {
	return &Service{
		challenge:  cfg.Challenge,
		cookie:     cfg.Cookie,
		db:         db,
		sessionTTL: cfg.SessionTTL,
		sms:        sender,
		store:      store,
	}
}

func AnonymousSession() ViewerAuthSessionData {
	return ViewerAuthSessionData{
		AdminGrants:         []string{},
		Identities:          []ViewerIdentity{},
		IsAuthenticated:     false,
		PlatformMemberships: []ViewerPlatformMembership{},
	}
}

func (s *Service) Register(ctx context.Context, input ViewerAuthRegisterRequest) (issuedSession, error) {
	if err := ctx.Err(); err != nil {
		return issuedSession{}, err
	}
	if s.db == nil {
		return issuedSession{}, ErrDatabaseUnavailable
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

	userID, err := authstore.NewUserID()
	if err != nil {
		return issuedSession{}, err
	}
	identityID, err := newID("ident_")
	if err != nil {
		return issuedSession{}, err
	}

	now := time.Now().UTC()

	s.mu.Lock()
	defer s.mu.Unlock()

	exists, err := s.identityExists(ctx, phone)
	if err != nil {
		return issuedSession{}, err
	}
	if exists {
		return issuedSession{}, ErrPhoneAlreadyInUse
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return issuedSession{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO auth_users (
			id,
			role,
			status,
			retention_state,
			created_at,
			updated_at
		) VALUES ($1, 'end_user', 'active', 'active', $2, $2)
	`, userID, now); err != nil {
		return issuedSession{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO auth_identities (
			id,
			user_id,
			provider,
			provider_subject,
			identity_type,
			identity_value,
			identity_value_normalized,
			secret_hash,
			created_at,
			updated_at
		) VALUES ($1, $2, 'phone_password', $3, 'phone', $4, $3, $5, $6, $6)
	`, identityID, userID, phone, phone, string(passwordHash), now); err != nil {
		return issuedSession{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO customer_profiles (
			user_id,
			display_name,
			city,
			primary_phone,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $5)
	`, userID, displayName, strings.TrimSpace(input.City), phone, now); err != nil {
		return issuedSession{}, err
	}

	if err := tx.Commit(); err != nil {
		return issuedSession{}, err
	}

	return s.createSession(ctx, userID, now)
}

func (s *Service) Login(ctx context.Context, input ViewerAuthCreateSessionRequest) (issuedSession, error) {
	if err := ctx.Err(); err != nil {
		return issuedSession{}, err
	}
	if s.db == nil {
		return issuedSession{}, ErrDatabaseUnavailable
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

	identity, err := s.identityByPhone(ctx, phone)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return issuedSession{}, ErrInvalidCredentials
		}
		return issuedSession{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(identity.SecretHash), []byte(password)); err != nil {
		return issuedSession{}, ErrInvalidCredentials
	}

	return s.createSession(ctx, identity.UserID, time.Now().UTC())
}

func (s *Service) Logout(ctx context.Context, tokenHash string) (ViewerAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ViewerAuthSessionData{}, err
	}
	if s.store == nil {
		return ViewerAuthSessionData{}, ErrDatabaseUnavailable
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	session, err := s.store.SessionByTokenHash(ctx, sessionRole, tokenHash)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return AnonymousSession(), nil
		}
		return ViewerAuthSessionData{}, err
	}

	now := time.Now().UTC()
	session.RevokedAt = &now
	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return ViewerAuthSessionData{}, err
	}

	return AnonymousSession(), nil
}

func (s *Service) UpdateCustomerProfile(
	ctx context.Context,
	userID string,
	input UpdateViewerCustomerProfileRequest,
) (ViewerAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ViewerAuthSessionData{}, err
	}
	if s.db == nil {
		return ViewerAuthSessionData{}, ErrDatabaseUnavailable
	}
	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return ViewerAuthSessionData{}, ErrInvalidDisplayName
	}

	_, err := s.db.ExecContext(ctx, `
		UPDATE customer_profiles
		SET display_name = $2,
		    city = $3,
		    updated_at = now()
		WHERE user_id = $1
	`, userID, displayName, strings.TrimSpace(input.City))
	if err != nil {
		return ViewerAuthSessionData{}, err
	}

	return s.buildSessionData(ctx, userID, nil)
}

func (s *Service) CreateSMSChallenge(ctx context.Context, input ViewerAuthCreateChallengeRequest) (AuthChallenge, error) {
	if err := ctx.Err(); err != nil {
		return AuthChallenge{}, err
	}
	if s.db == nil {
		return AuthChallenge{}, ErrDatabaseUnavailable
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return AuthChallenge{}, err
	}
	purpose, err := challengePurpose(input.Purpose)
	if err != nil {
		return AuthChallenge{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, _, err := s.issueChallenge(ctx, purpose, phone, purpose != "password_reset")
	if err != nil {
		return AuthChallenge{}, err
	}

	return authChallengeFromRecord(record), nil
}

func (s *Service) VerifyChallenge(ctx context.Context, input ViewerAuthVerifyChallengeRequest) (AuthChallenge, error) {
	if err := ctx.Err(); err != nil {
		return AuthChallenge{}, err
	}
	if s.db == nil {
		return AuthChallenge{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.ChallengeID) == "" {
		return AuthChallenge{}, ErrInvalidChallenge
	}
	if strings.TrimSpace(input.Code) == "" {
		return AuthChallenge{}, ErrInvalidChallengeCode
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, err := s.challengeByID(ctx, strings.TrimSpace(input.ChallengeID))
	if err != nil {
		return AuthChallenge{}, err
	}

	record, err = s.verifyChallengeCode(ctx, record, input.Code)
	if err != nil {
		return AuthChallenge{}, err
	}

	return authChallengeFromRecord(record), nil
}

func (s *Service) ForgotPassword(ctx context.Context, input ViewerAuthForgotPasswordRequest) (AuthRecoveryRequest, error) {
	if err := ctx.Err(); err != nil {
		return AuthRecoveryRequest{}, err
	}
	if s.db == nil {
		return AuthRecoveryRequest{}, ErrDatabaseUnavailable
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return AuthRecoveryRequest{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, _, err := s.issueChallenge(ctx, "password_reset", phone, false)
	if err != nil {
		return AuthRecoveryRequest{}, err
	}

	return AuthRecoveryRequest{
		Challenge: authChallengeFromRecord(record),
		Message:   "Jika nomor terdaftar, kami telah mengirim kode reset kata sandi melalui SMS.",
	}, nil
}

func (s *Service) ResetPassword(ctx context.Context, input ViewerAuthResetPasswordRequest) (AuthRecoveryRequest, error) {
	if err := ctx.Err(); err != nil {
		return AuthRecoveryRequest{}, err
	}
	if s.db == nil {
		return AuthRecoveryRequest{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.ChallengeID) == "" {
		return AuthRecoveryRequest{}, ErrInvalidChallenge
	}
	if strings.TrimSpace(input.Code) == "" {
		return AuthRecoveryRequest{}, ErrInvalidChallengeCode
	}
	if !passwordMeetsPolicy(strings.TrimSpace(input.NewPassword)) {
		return AuthRecoveryRequest{}, ErrWeakPassword
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, err := s.challengeByID(ctx, strings.TrimSpace(input.ChallengeID))
	if err != nil {
		return AuthRecoveryRequest{}, err
	}
	if record.ChallengeType != "password_reset" {
		return AuthRecoveryRequest{}, ErrInvalidChallengeType
	}

	record, err = s.verifyChallengeCode(ctx, record, input.Code)
	if err != nil {
		return AuthRecoveryRequest{}, err
	}
	if !record.IdentityID.Valid || !record.UserID.Valid {
		return AuthRecoveryRequest{}, ErrResetRequiresPhone
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(strings.TrimSpace(input.NewPassword)), bcrypt.DefaultCost)
	if err != nil {
		return AuthRecoveryRequest{}, err
	}

	now := time.Now().UTC()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return AuthRecoveryRequest{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		UPDATE auth_identities
		SET secret_hash = $2,
		    verified_at = COALESCE(verified_at, $3),
		    updated_at = $3
		WHERE id = $1
	`, record.IdentityID.String, string(passwordHash), now); err != nil {
		return AuthRecoveryRequest{}, err
	}

	record.Status = "consumed"
	record.ConsumedAt = sql.NullTime{Time: now, Valid: true}
	record.VerifiedAt = sql.NullTime{Time: now, Valid: true}
	record.UpdatedAt = now
	if err := saveChallengeTx(ctx, tx, record); err != nil {
		return AuthRecoveryRequest{}, err
	}

	if err := tx.Commit(); err != nil {
		return AuthRecoveryRequest{}, err
	}

	return AuthRecoveryRequest{
		Challenge: authChallengeFromRecord(record),
		Message:   "Kata sandi berhasil diperbarui.",
	}, nil
}

func (s *Service) ListSessions(ctx context.Context, currentTokenHash string, userID string) (AuthSessionList, error) {
	if err := ctx.Err(); err != nil {
		return AuthSessionList{}, err
	}
	if s.store == nil {
		return AuthSessionList{}, ErrDatabaseUnavailable
	}

	currentSessionID := ""
	if strings.TrimSpace(currentTokenHash) != "" {
		currentSession, err := s.store.SessionByTokenHash(ctx, sessionRole, currentTokenHash)
		if err == nil {
			currentSessionID = currentSession.ID
		} else if !errors.Is(err, authstore.ErrNotFound) {
			return AuthSessionList{}, err
		}
	}

	sessions, err := s.store.SessionsBySubject(ctx, sessionRole, userID)
	if err != nil {
		return AuthSessionList{}, err
	}

	items := make([]AuthDeviceSession, 0, len(sessions))
	for _, session := range sessions {
		items = append(items, deviceSessionFromStore(session, session.ID == currentSessionID || session.TokenHash == currentTokenHash))
	}

	return AuthSessionList{Items: items}, nil
}

func (s *Service) RevokeSessionByID(ctx context.Context, currentTokenHash string, userID string, sessionID string) (AuthSessionMutationResult, bool, error) {
	if err := ctx.Err(); err != nil {
		return AuthSessionMutationResult{}, false, err
	}
	if s.store == nil {
		return AuthSessionMutationResult{}, false, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(sessionID) == "" {
		return AuthSessionMutationResult{}, false, ErrSessionNotFound
	}

	currentSession, err := s.store.SessionByTokenHash(ctx, sessionRole, currentTokenHash)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return AuthSessionMutationResult{}, false, ErrSessionNotFound
		}
		return AuthSessionMutationResult{}, false, err
	}

	revoked, err := s.store.RevokeSession(ctx, sessionRole, userID, strings.TrimSpace(sessionID), time.Now().UTC())
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return AuthSessionMutationResult{}, false, ErrSessionNotFound
		}
		return AuthSessionMutationResult{}, false, err
	}

	currentExpired := revoked.ID == currentSession.ID
	return AuthSessionMutationResult{
		CurrentSessionExpired: currentExpired,
		RevokedCount:          1,
	}, currentExpired, nil
}

func (s *Service) LogoutAllOtherSessions(ctx context.Context, currentSession AuthenticatedSession) (AuthSessionMutationResult, error) {
	if err := ctx.Err(); err != nil {
		return AuthSessionMutationResult{}, err
	}
	if s.store == nil {
		return AuthSessionMutationResult{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(currentSession.Session.UserID) == "" || strings.TrimSpace(currentSession.SessionID) == "" {
		return AuthSessionMutationResult{}, ErrSessionNotFound
	}

	count, err := s.store.RevokeAllOtherSessions(ctx, sessionRole, currentSession.Session.UserID, currentSession.SessionID, time.Now().UTC())
	if err != nil {
		return AuthSessionMutationResult{}, err
	}

	return AuthSessionMutationResult{
		CurrentSessionExpired: false,
		RevokedCount:          count,
	}, nil
}

func (s *Service) AuthenticateRequest(ctx context.Context, authorizationHeader string, cookieToken string) (AuthenticatedSession, error) {
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

func (s *Service) createSession(ctx context.Context, userID string, issuedAt time.Time) (issuedSession, error) {
	if s.store == nil {
		return issuedSession{}, ErrDatabaseUnavailable
	}

	rawToken, err := generateToken()
	if err != nil {
		return issuedSession{}, err
	}
	sessionID, err := newSessionID()
	if err != nil {
		return issuedSession{}, err
	}

	metadata, _ := web.RequestMetadataFromContext(ctx)

	session := authstore.Session{
		CreatedAt:        issuedAt,
		ExpiresAt:        issuedAt.Add(s.sessionTTL),
		ID:               sessionID,
		IPAddress:        metadata.IPAddress,
		LastLoginAt:      issuedAt,
		LastSeenAt:       issuedAt,
		LastVisitedRoute: metadata.Path,
		Role:             sessionRole,
		SavedAt:          issuedAt,
		SessionLabel:     buildSessionLabel(metadata.UserAgent),
		SubjectID:        userID,
		TokenHash:        hashToken(rawToken),
		UserAgent:        metadata.UserAgent,
		UserID:           userID,
	}
	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return issuedSession{}, err
	}

	payload, err := s.buildSessionData(ctx, userID, &session)
	if err != nil {
		return issuedSession{}, err
	}

	return issuedSession{
		RawToken: rawToken,
		Session:  payload,
	}, nil
}

func (s *Service) authenticateToken(ctx context.Context, rawToken string) (AuthenticatedSession, error) {
	if s.store == nil {
		return AuthenticatedSession{}, ErrDatabaseUnavailable
	}

	tokenHash := hashToken(rawToken)
	session, err := s.store.SessionByTokenHash(ctx, sessionRole, tokenHash)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return AuthenticatedSession{}, ErrSessionNotFound
		}
		return AuthenticatedSession{}, err
	}

	now := time.Now().UTC()
	if session.UserID == "" || session.SubjectID == "" || session.ExpiresAt.IsZero() {
		return AuthenticatedSession{}, ErrInvalidSessionPayload
	}
	if session.RevokedAt != nil {
		return AuthenticatedSession{}, ErrSessionRevoked
	}
	if session.ExpiresAt.Before(now) {
		return AuthenticatedSession{}, ErrSessionExpired
	}

	metadata, _ := web.RequestMetadataFromContext(ctx)
	session.LastSeenAt = now
	session.SavedAt = now
	if metadata.Path != "" {
		session.LastVisitedRoute = metadata.Path
	}
	if metadata.UserAgent != "" {
		session.UserAgent = metadata.UserAgent
		if session.SessionLabel == "" {
			session.SessionLabel = buildSessionLabel(metadata.UserAgent)
		}
	}
	if metadata.IPAddress != "" {
		session.IPAddress = metadata.IPAddress
	}
	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return AuthenticatedSession{}, err
	}

	payload, err := s.buildSessionData(ctx, session.UserID, &session)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return AuthenticatedSession{}, ErrAccountNotFound
		}
		return AuthenticatedSession{}, err
	}

	return AuthenticatedSession{
		SessionID: session.ID,
		TokenHash: tokenHash,
		Session:   payload,
	}, nil
}

func (s *Service) buildSessionData(ctx context.Context, userID string, session *authstore.Session) (ViewerAuthSessionData, error) {
	if s.db == nil {
		return ViewerAuthSessionData{}, ErrDatabaseUnavailable
	}

	payload := ViewerAuthSessionData{
		AdminGrants:         []string{},
		Identities:          []ViewerIdentity{},
		IsAuthenticated:     true,
		PlatformMemberships: []ViewerPlatformMembership{},
		UserID:              userID,
	}
	if session != nil {
		payload.ExpiresAt = session.ExpiresAt.UTC().Format(time.RFC3339)
		payload.LastLoginAt = session.LastLoginAt.UTC().Format(time.RFC3339)
	}

	identities, registeredAt, err := s.loadIdentities(ctx, userID)
	if err != nil {
		return ViewerAuthSessionData{}, err
	}
	payload.Identities = identities
	payload.RegisteredAt = registeredAt
	for _, identity := range identities {
		if identity.IdentityType == "phone" && payload.Phone == "" {
			payload.Phone = identity.Value
		}
	}

	profile, err := s.loadCustomerProfile(ctx, userID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return ViewerAuthSessionData{}, err
		}
	} else {
		payload.CustomerProfile = profile
		if payload.Phone == "" {
			payload.Phone = profile.PrimaryPhone
		}
	}

	memberships, err := s.loadPlatformMemberships(ctx, userID)
	if err != nil {
		return ViewerAuthSessionData{}, err
	}
	payload.PlatformMemberships = memberships

	adminGrants, err := s.loadAdminGrants(ctx, userID)
	if err != nil {
		return ViewerAuthSessionData{}, err
	}
	payload.AdminGrants = adminGrants

	return payload, nil
}

func (s *Service) identityExists(ctx context.Context, phone string) (bool, error) {
	var exists bool
	err := s.db.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM auth_identities
			WHERE provider = 'phone_password' AND identity_type = 'phone' AND identity_value_normalized = $1
		)
	`, phone).Scan(&exists)
	return exists, err
}

type identityRecord struct {
	ID         string
	Phone      string
	SecretHash string
	UserID     string
}

func (s *Service) identityByPhone(ctx context.Context, phone string) (identityRecord, error) {
	var identity identityRecord
	err := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, identity_value_normalized, secret_hash
		FROM auth_identities
		WHERE provider = 'phone_password' AND identity_type = 'phone' AND identity_value_normalized = $1
		LIMIT 1
	`, phone).Scan(&identity.ID, &identity.UserID, &identity.Phone, &identity.SecretHash)
	return identity, err
}

func (s *Service) loadCustomerProfile(ctx context.Context, userID string) (*ViewerCustomerProfile, error) {
	profile := &ViewerCustomerProfile{}
	err := s.db.QueryRowContext(ctx, `
		SELECT display_name, city, primary_phone
		FROM customer_profiles
		WHERE user_id = $1
	`, userID).Scan(&profile.DisplayName, &profile.City, &profile.PrimaryPhone)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (s *Service) loadIdentities(ctx context.Context, userID string) ([]ViewerIdentity, string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT provider, identity_type, identity_value, verified_at, created_at
		FROM auth_identities
		WHERE user_id = $1
		ORDER BY created_at ASC
	`, userID)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()

	registeredAt := ""
	identities := make([]ViewerIdentity, 0)
	for rows.Next() {
		var identity ViewerIdentity
		var verifiedAt sql.NullTime
		var createdAt time.Time
		if err := rows.Scan(&identity.Provider, &identity.IdentityType, &identity.Value, &verifiedAt, &createdAt); err != nil {
			return nil, "", err
		}
		if registeredAt == "" {
			registeredAt = createdAt.UTC().Format(time.RFC3339)
		}
		if verifiedAt.Valid {
			identity.VerifiedAt = verifiedAt.Time.UTC().Format(time.RFC3339)
		}
		identities = append(identities, identity)
	}
	return identities, registeredAt, rows.Err()
}

func (s *Service) loadPlatformMemberships(ctx context.Context, userID string) ([]ViewerPlatformMembership, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			pp.platform_id,
			pp.id,
			pp.display_name,
			pp.slug,
			pp.status,
			pp.review_status,
			COALESCE(pa.id, ''),
			COALESCE(pa.status, '')
		FROM professional_platform_profiles pp
		LEFT JOIN professional_applications pa
			ON pa.platform_id = pp.platform_id AND pa.user_id = pp.user_id
		WHERE pp.user_id = $1
		ORDER BY pp.platform_id ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	memberships := make([]ViewerPlatformMembership, 0)
	for rows.Next() {
		var membership ViewerPlatformMembership
		if err := rows.Scan(
			&membership.PlatformID,
			&membership.ProfileID,
			&membership.DisplayName,
			&membership.Slug,
			&membership.ProfileStatus,
			&membership.ReviewStatus,
			&membership.ApplicationID,
			&membership.ApplicationStatus,
		); err != nil {
			return nil, err
		}
		memberships = append(memberships, membership)
	}
	return memberships, rows.Err()
}

func (s *Service) loadAdminGrants(ctx context.Context, userID string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT focus_area
		FROM admin_auth_accounts
		WHERE user_id = $1
		ORDER BY focus_area ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	grants := make([]string, 0)
	for rows.Next() {
		var focusArea string
		if err := rows.Scan(&focusArea); err != nil {
			return nil, err
		}
		grants = append(grants, focusArea)
	}
	return grants, rows.Err()
}

type challengeRecord struct {
	AttemptCount      int
	Channel           string
	ChallengeType     string
	CodeHash          string
	ConsumedAt        sql.NullTime
	CreatedAt         time.Time
	Destination       string
	DestinationMasked string
	ExpiresAt         time.Time
	ID                string
	IdentityID        sql.NullString
	MaxAttempts       int
	Status            string
	UpdatedAt         time.Time
	UserID            sql.NullString
	VerifiedAt        sql.NullTime
}

func (s *Service) issueChallenge(ctx context.Context, purpose string, phone string, allowAnonymous bool) (challengeRecord, string, error) {
	purpose, err := challengePurpose(purpose)
	if err != nil {
		return challengeRecord{}, "", err
	}

	identity, err := s.lookupIdentity(ctx, phone)
	if err != nil {
		return challengeRecord{}, "", err
	}

	shouldSendSMS := identity != nil || purpose != "password_reset"
	if shouldSendSMS && s.sms == nil {
		return challengeRecord{}, "", ErrUnsupportedSMS
	}
	if identity == nil && !allowAnonymous && purpose == "password_reset" {
		return challengeRecord{}, "", ErrAccountNotFound
	}

	record, code, err := s.newChallengeRecord(purpose, phone, identity)
	if err != nil {
		return challengeRecord{}, "", err
	}
	if err := s.insertChallenge(ctx, record); err != nil {
		return challengeRecord{}, "", err
	}

	if shouldSendSMS {
		if err := s.sms.SendSMS(ctx, phone, smsMessageForPurpose(purpose, code, s.challenge.CodeTTL)); err != nil {
			record.Status = "cancelled"
			record.UpdatedAt = time.Now().UTC()
			_ = s.saveChallenge(ctx, record)
			return challengeRecord{}, "", err
		}
	}

	return record, code, nil
}

func (s *Service) lookupIdentity(ctx context.Context, phone string) (*identityRecord, error) {
	identity, err := s.identityByPhone(ctx, phone)
	if err == nil {
		return &identity, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return nil, err
}

func (s *Service) newChallengeRecord(purpose string, phone string, identity *identityRecord) (challengeRecord, string, error) {
	now := time.Now().UTC()
	challengeID, err := newID("chal_")
	if err != nil {
		return challengeRecord{}, "", err
	}
	code, err := generateVerificationCode()
	if err != nil {
		return challengeRecord{}, "", err
	}

	record := challengeRecord{
		AttemptCount:      0,
		Channel:           "sms",
		ChallengeType:     purpose,
		CodeHash:          hashChallengeCode(code),
		CreatedAt:         now,
		Destination:       phone,
		DestinationMasked: maskPhone(phone),
		ExpiresAt:         now.Add(s.challenge.CodeTTL),
		ID:                challengeID,
		MaxAttempts:       s.challenge.MaxAttempts,
		Status:            "pending",
		UpdatedAt:         now,
	}
	if identity != nil {
		record.IdentityID = sql.NullString{String: identity.ID, Valid: true}
		record.UserID = sql.NullString{String: identity.UserID, Valid: true}
	}

	return record, code, nil
}

func (s *Service) insertChallenge(ctx context.Context, record challengeRecord) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO auth_challenges (
			id,
			user_id,
			identity_id,
			challenge_type,
			channel,
			destination,
			destination_masked,
			code_hash,
			status,
			attempt_count,
			max_attempts,
			expires_at,
			verified_at,
			consumed_at,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`, record.ID, nullableString(record.UserID), nullableString(record.IdentityID), record.ChallengeType, record.Channel, record.Destination, record.DestinationMasked, record.CodeHash, record.Status, record.AttemptCount, record.MaxAttempts, record.ExpiresAt, nullableTime(record.VerifiedAt), nullableTime(record.ConsumedAt), record.CreatedAt, record.UpdatedAt)
	return err
}

func (s *Service) challengeByID(ctx context.Context, challengeID string) (challengeRecord, error) {
	record := challengeRecord{}
	err := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, identity_id, challenge_type, channel, destination, destination_masked, code_hash, status, attempt_count, max_attempts, expires_at, verified_at, consumed_at, created_at, updated_at
		FROM auth_challenges
		WHERE id = $1
	`, challengeID).Scan(
		&record.ID,
		&record.UserID,
		&record.IdentityID,
		&record.ChallengeType,
		&record.Channel,
		&record.Destination,
		&record.DestinationMasked,
		&record.CodeHash,
		&record.Status,
		&record.AttemptCount,
		&record.MaxAttempts,
		&record.ExpiresAt,
		&record.VerifiedAt,
		&record.ConsumedAt,
		&record.CreatedAt,
		&record.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return challengeRecord{}, ErrChallengeNotFound
		}
		return challengeRecord{}, err
	}

	return record, nil
}

func (s *Service) verifyChallengeCode(ctx context.Context, record challengeRecord, code string) (challengeRecord, error) {
	record, err := validateChallengeState(ctx, s, record)
	if err != nil {
		return challengeRecord{}, err
	}

	if record.Status == "verified" && record.VerifiedAt.Valid && record.CodeHash == hashChallengeCode(code) {
		return record, nil
	}
	if record.Status != "pending" && record.Status != "verified" {
		return challengeRecord{}, ErrInvalidChallenge
	}

	if record.CodeHash != hashChallengeCode(code) {
		record.AttemptCount++
		if record.AttemptCount >= record.MaxAttempts {
			record.Status = "cancelled"
			record.UpdatedAt = time.Now().UTC()
			if err := s.saveChallenge(ctx, record); err != nil {
				return challengeRecord{}, err
			}
			return challengeRecord{}, ErrChallengeRateLimited
		}
		record.UpdatedAt = time.Now().UTC()
		if err := s.saveChallenge(ctx, record); err != nil {
			return challengeRecord{}, err
		}
		return challengeRecord{}, ErrInvalidChallengeCode
	}

	now := time.Now().UTC()
	record.AttemptCount++
	record.Status = "verified"
	record.VerifiedAt = sql.NullTime{Time: now, Valid: true}
	record.UpdatedAt = now
	if err := s.saveChallenge(ctx, record); err != nil {
		return challengeRecord{}, err
	}

	return record, nil
}

func validateChallengeState(ctx context.Context, service *Service, record challengeRecord) (challengeRecord, error) {
	if record.Status == "consumed" {
		return challengeRecord{}, ErrChallengeConsumed
	}
	if record.Status == "cancelled" {
		return challengeRecord{}, ErrChallengeRateLimited
	}
	if time.Now().UTC().After(record.ExpiresAt.UTC()) {
		record.Status = "expired"
		record.UpdatedAt = time.Now().UTC()
		if err := service.saveChallenge(ctx, record); err != nil {
			return challengeRecord{}, err
		}
		return challengeRecord{}, ErrChallengeExpired
	}
	return record, nil
}

func (s *Service) saveChallenge(ctx context.Context, record challengeRecord) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE auth_challenges
		SET status = $2,
		    attempt_count = $3,
		    max_attempts = $4,
		    expires_at = $5,
		    verified_at = $6,
		    consumed_at = $7,
		    updated_at = $8
		WHERE id = $1
	`, record.ID, record.Status, record.AttemptCount, record.MaxAttempts, record.ExpiresAt, nullableTime(record.VerifiedAt), nullableTime(record.ConsumedAt), record.UpdatedAt)
	return err
}

func saveChallengeTx(ctx context.Context, tx *sql.Tx, record challengeRecord) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE auth_challenges
		SET status = $2,
		    attempt_count = $3,
		    max_attempts = $4,
		    expires_at = $5,
		    verified_at = $6,
		    consumed_at = $7,
		    updated_at = $8
		WHERE id = $1
	`, record.ID, record.Status, record.AttemptCount, record.MaxAttempts, record.ExpiresAt, nullableTime(record.VerifiedAt), nullableTime(record.ConsumedAt), record.UpdatedAt)
	return err
}

func deviceSessionFromStore(session authstore.Session, current bool) AuthDeviceSession {
	item := AuthDeviceSession{
		CreatedAt:        session.CreatedAt.UTC().Format(time.RFC3339),
		Current:          current,
		ExpiresAt:        session.ExpiresAt.UTC().Format(time.RFC3339),
		ID:               session.ID,
		IPAddress:        session.IPAddress,
		LastLoginAt:      session.LastLoginAt.UTC().Format(time.RFC3339),
		LastSeenAt:       session.LastSeenAt.UTC().Format(time.RFC3339),
		LastVisitedRoute: session.LastVisitedRoute,
		SessionLabel:     session.SessionLabel,
		UserAgent:        session.UserAgent,
	}
	if session.RevokedAt != nil && !session.RevokedAt.IsZero() {
		item.RevokedAt = session.RevokedAt.UTC().Format(time.RFC3339)
	}
	return item
}

func authChallengeFromRecord(record challengeRecord) AuthChallenge {
	challenge := AuthChallenge{
		Channel:           record.Channel,
		ChallengeID:       record.ID,
		DestinationMasked: record.DestinationMasked,
		ExpiresAt:         record.ExpiresAt.UTC().Format(time.RFC3339),
		Purpose:           record.ChallengeType,
		Status:            record.Status,
	}
	if record.VerifiedAt.Valid {
		challenge.VerifiedAt = record.VerifiedAt.Time.UTC().Format(time.RFC3339)
	}
	return challenge
}

func nullableString(value sql.NullString) any {
	if value.Valid {
		return value.String
	}
	return nil
}

func nullableTime(value sql.NullTime) any {
	if value.Valid {
		return value.Time
	}
	return nil
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

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}

func newSessionID() (string, error) {
	return newID("sess_")
}

func challengePurpose(value string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(strings.ReplaceAll(value, "-", "_"))) {
	case "password_reset", "reset_password":
		return "password_reset", nil
	case "step_up", "stepup":
		return "step_up", nil
	case "verify_phone", "phone_verify":
		return "verify_phone", nil
	default:
		return "", ErrInvalidChallengeType
	}
}

func generateVerificationCode() (string, error) {
	buffer := make([]byte, 4)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	number := int(buffer[0])<<24 | int(buffer[1])<<16 | int(buffer[2])<<8 | int(buffer[3])
	if number < 0 {
		number = -number
	}
	return fmt.Sprintf("%06d", number%1000000), nil
}

func hashChallengeCode(code string) string {
	checksum := sha256.Sum256([]byte(strings.TrimSpace(code)))
	return hex.EncodeToString(checksum[:])
}

func maskPhone(phone string) string {
	normalized, err := normalizePhone(phone)
	if err != nil {
		return "***"
	}
	if len(normalized) <= 4 {
		return strings.Repeat("*", len(normalized))
	}
	if len(normalized) <= 8 {
		return normalized[:2] + strings.Repeat("*", len(normalized)-4) + normalized[len(normalized)-2:]
	}
	return normalized[:3] + strings.Repeat("*", len(normalized)-5) + normalized[len(normalized)-2:]
}

func buildSessionLabel(userAgent string) string {
	label := strings.TrimSpace(userAgent)
	if label == "" {
		return "Browser session"
	}
	if len(label) > 96 {
		return label[:96]
	}
	return label
}

func smsMessageForPurpose(purpose string, code string, ttl time.Duration) string {
	minutes := int(ttl.Round(time.Minute).Minutes())
	if minutes < 1 {
		minutes = 1
	}

	switch purpose {
	case "password_reset":
		return fmt.Sprintf("Kode reset kata sandi akun Anda: %s. Berlaku %d menit.", code, minutes)
	case "step_up":
		return fmt.Sprintf("Kode verifikasi keamanan akun Anda: %s. Berlaku %d menit.", code, minutes)
	default:
		return fmt.Sprintf("Kode verifikasi akun Anda: %s. Berlaku %d menit.", code, minutes)
	}
}
