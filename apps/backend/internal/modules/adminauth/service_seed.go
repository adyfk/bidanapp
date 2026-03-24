package adminauth

import (
	"context"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/documentstore"
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

	record := sessionRecord{
		AdminID:          adminID,
		Email:            email,
		FocusArea:        focusArea,
		LastLoginAt:      lastLoginAt.Format(time.RFC3339),
		LastVisitedRoute: strings.TrimSpace(input.LastVisitedRoute),
		ExpiresAt:        expiresAt.Format(time.RFC3339),
	}

	if _, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: sessionNamespace,
		Key:       hashToken(rawToken),
		SavedAt:   lastLoginAt,
		Snapshot:  marshalRecord(record),
	}); err != nil {
		return AdminAuthSessionData{}, err
	}

	return sessionDataFromRecord(record), nil
}
