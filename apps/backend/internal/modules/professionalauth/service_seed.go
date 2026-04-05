package professionalauth

import (
	"context"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/platform/authstore"
)

type SeedAccountInput struct {
	City             string
	CredentialNumber string
	DisplayName      string
	Password         string
	Phone            string
	ProfessionalID   string
	RegisteredAt     time.Time
}

type SeedSessionInput struct {
	ExpiresAt      time.Time
	LastLoginAt    time.Time
	ProfessionalID string
	RawToken       string
}

func (s *Service) SeedAccount(ctx context.Context, input SeedAccountInput) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ErrInvalidProfessionalID
	}
	if err := s.ensureProfessionalExists(ctx, professionalID); err != nil {
		return err
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return err
	}

	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return ErrInvalidDisplayName
	}

	credentialNumber := strings.TrimSpace(input.CredentialNumber)
	if credentialNumber == "" {
		return ErrInvalidCredential
	}

	password := strings.TrimSpace(input.Password)
	if !passwordMeetsPolicy(password) {
		return ErrWeakPassword
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	registeredAt := input.RegisteredAt.UTC()
	if registeredAt.IsZero() {
		registeredAt = time.Now().UTC()
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	existing, lookupErr := s.store.ProfessionalAccountByProfessionalID(ctx, professionalID)
	if lookupErr != nil && !errors.Is(lookupErr, authstore.ErrNotFound) {
		return lookupErr
	}

	account := authstore.ProfessionalAccount{
		City:             strings.TrimSpace(input.City),
		CredentialNumber: credentialNumber,
		DisplayName:      displayName,
		PasswordHash:     string(passwordHash),
		Phone:            phone,
		PhoneNormalized:  phone,
		ProfessionalID:   professionalID,
		RegisteredAt:     registeredAt,
		UserID:           existing.UserID,
	}
	if account.UserID == "" {
		account.UserID, err = authstore.NewUserID()
		if err != nil {
			return err
		}
	}

	if errors.Is(lookupErr, authstore.ErrNotFound) {
		_, err = s.store.CreateProfessionalAccount(ctx, account)
	} else {
		account.RecoveryRequestedAt = existing.RecoveryRequestedAt
		_, err = s.store.UpdateProfessionalAccount(ctx, account)
	}
	if err != nil {
		if errors.Is(err, authstore.ErrConflict) {
			return ErrPhoneAlreadyInUse
		}
		return err
	}

	return nil
}

func (s *Service) SeedSession(ctx context.Context, input SeedSessionInput) (ProfessionalAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	rawToken := strings.TrimSpace(input.RawToken)
	professionalID := strings.TrimSpace(input.ProfessionalID)
	if rawToken == "" || professionalID == "" {
		return ProfessionalAuthSessionData{}, ErrInvalidSessionPayload
	}

	lastLoginAt := input.LastLoginAt.UTC()
	if lastLoginAt.IsZero() {
		lastLoginAt = time.Now().UTC()
	}

	expiresAt := input.ExpiresAt.UTC()
	if expiresAt.IsZero() {
		expiresAt = lastLoginAt.Add(s.sessionTTL)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	account, err := s.store.ProfessionalAccountByProfessionalID(ctx, professionalID)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return ProfessionalAuthSessionData{}, ErrAccountNotFound
		}
		return ProfessionalAuthSessionData{}, err
	}

	session := authstore.Session{
		ExpiresAt:   expiresAt,
		LastLoginAt: lastLoginAt,
		Role:        sessionRole,
		SavedAt:     lastLoginAt,
		SubjectID:   professionalID,
		TokenHash:   hashToken(rawToken),
		UserID:      account.UserID,
	}

	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}
