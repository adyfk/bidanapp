package customerauth

import (
	"context"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type SeedAccountInput struct {
	City         string
	ConsumerID   string
	DisplayName  string
	Password     string
	Phone        string
	RegisteredAt time.Time
}

type SeedSessionInput struct {
	ConsumerID  string
	ExpiresAt   time.Time
	LastLoginAt time.Time
	RawToken    string
}

func (s *Service) SeedAccount(ctx context.Context, input SeedAccountInput) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	consumerID := strings.TrimSpace(input.ConsumerID)
	if consumerID == "" {
		return ErrInvalidAccountPayload
	}

	phone, err := normalizePhone(input.Phone)
	if err != nil {
		return err
	}

	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return ErrInvalidDisplayName
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

	registry.AccountsByConsumerID[consumerID] = accountRecord{
		City:            strings.TrimSpace(input.City),
		ConsumerID:      consumerID,
		DisplayName:     displayName,
		PasswordHash:    string(passwordHash),
		Phone:           phone,
		PhoneNormalized: phone,
		RegisteredAt:    registeredAt.Format(time.RFC3339),
	}

	return s.writeAccountRegistry(ctx, registry, registeredAt)
}

func (s *Service) SeedSession(ctx context.Context, input SeedSessionInput) (CustomerAuthSessionData, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAuthSessionData{}, err
	}

	rawToken := strings.TrimSpace(input.RawToken)
	consumerID := strings.TrimSpace(input.ConsumerID)
	if rawToken == "" || consumerID == "" {
		return CustomerAuthSessionData{}, ErrInvalidSessionPayload
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
		return CustomerAuthSessionData{}, err
	}

	account, ok := registry.AccountsByConsumerID[consumerID]
	if !ok {
		return CustomerAuthSessionData{}, ErrAccountNotFound
	}

	session := sessionRecord{
		ConsumerID:  consumerID,
		ExpiresAt:   expiresAt.Format(time.RFC3339),
		LastLoginAt: lastLoginAt.Format(time.RFC3339),
	}

	if err := s.writeSessionRecord(ctx, hashToken(rawToken), session, lastLoginAt); err != nil {
		return CustomerAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}
