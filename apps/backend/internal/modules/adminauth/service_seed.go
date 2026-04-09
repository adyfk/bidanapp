package adminauth

import (
	"context"
	"errors"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/authstore"
)

type SeedSessionInput struct {
	AdminID          string
	Email            string
	ExpiresAt        time.Time
	FocusArea        string
	LastLoginAt      time.Time
	LastVisitedRoute string
	RawToken         string
}

func (s *Service) SeedSession(ctx context.Context, input SeedSessionInput) (AdminAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return AdminAuthSessionData{}, err
	}

	rawToken := strings.TrimSpace(input.RawToken)
	adminID := strings.TrimSpace(input.AdminID)
	email := normalizeEmail(input.Email)
	focusArea := strings.TrimSpace(input.FocusArea)
	if rawToken == "" || adminID == "" || email == "" || focusArea == "" {
		return AdminAuthSessionData{}, ErrInvalidSessionPayload
	}

	lastLoginAt := input.LastLoginAt.UTC()
	if lastLoginAt.IsZero() {
		lastLoginAt = time.Now().UTC()
	}

	expiresAt := input.ExpiresAt.UTC()
	if expiresAt.IsZero() {
		expiresAt = lastLoginAt.Add(s.sessionTTL)
	}

	account, err := s.store.AdminAccountByAdminID(ctx, adminID)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return AdminAuthSessionData{}, ErrSessionNotFound
		}
		return AdminAuthSessionData{}, err
	}
	sessionID, err := newSessionID()
	if err != nil {
		return AdminAuthSessionData{}, err
	}

	session := authstore.Session{
		ID:               sessionID,
		ExpiresAt:        expiresAt,
		LastLoginAt:      lastLoginAt,
		LastVisitedRoute: strings.TrimSpace(input.LastVisitedRoute),
		Role:             sessionRole,
		SavedAt:          lastLoginAt,
		SubjectID:        adminID,
		TokenHash:        hashToken(rawToken),
		UserID:           account.UserID,
	}

	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return AdminAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}
