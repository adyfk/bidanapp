package professionalauth

import (
	"context"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
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

	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return err
	}

	registry.AccountsByProfessionalID[professionalID] = accountRecord{
		City:             strings.TrimSpace(input.City),
		CredentialNumber: credentialNumber,
		DisplayName:      displayName,
		PasswordHash:     string(passwordHash),
		Phone:            phone,
		PhoneNormalized:  phone,
		ProfessionalID:   professionalID,
		RegisteredAt:     registeredAt.Format(time.RFC3339),
	}

	return s.writeAccountRegistry(ctx, registry, registeredAt)
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

	registry, err := s.readAccountRegistry(ctx)
	if err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	account, ok := registry.AccountsByProfessionalID[professionalID]
	if !ok {
		return ProfessionalAuthSessionData{}, ErrAccountNotFound
	}

	session := sessionRecord{
		ExpiresAt:      expiresAt.Format(time.RFC3339),
		LastLoginAt:    lastLoginAt.Format(time.RFC3339),
		ProfessionalID: professionalID,
	}

	if err := s.writeSessionRecord(ctx, hashToken(rawToken), session, lastLoginAt); err != nil {
		return ProfessionalAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}
