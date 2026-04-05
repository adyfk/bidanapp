package customerauth

import (
	"context"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/platform/authstore"
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

	existing, lookupErr := s.store.CustomerAccountByConsumerID(ctx, consumerID)
	if lookupErr != nil && !errors.Is(lookupErr, authstore.ErrNotFound) {
		return lookupErr
	}

	account := authstore.CustomerAccount{
		City:            strings.TrimSpace(input.City),
		ConsumerID:      consumerID,
		DisplayName:     displayName,
		PasswordHash:    string(passwordHash),
		Phone:           phone,
		PhoneNormalized: phone,
		RegisteredAt:    registeredAt,
		UserID:          existing.UserID,
	}
	if account.UserID == "" {
		account.UserID, err = authstore.NewUserID()
		if err != nil {
			return err
		}
	}

	if errors.Is(lookupErr, authstore.ErrNotFound) {
		_, err = s.store.CreateCustomerAccount(ctx, account)
	} else {
		_, err = s.store.UpdateCustomerAccount(ctx, account)
	}
	if err != nil {
		if errors.Is(err, authstore.ErrConflict) {
			return ErrPhoneAlreadyInUse
		}
		return err
	}

	return nil
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

	account, err := s.store.CustomerAccountByConsumerID(ctx, consumerID)
	if err != nil {
		if errors.Is(err, authstore.ErrNotFound) {
			return CustomerAuthSessionData{}, ErrAccountNotFound
		}
		return CustomerAuthSessionData{}, err
	}

	session := authstore.Session{
		ExpiresAt:   expiresAt,
		LastLoginAt: lastLoginAt,
		Role:        sessionRole,
		SavedAt:     lastLoginAt,
		SubjectID:   consumerID,
		TokenHash:   hashToken(rawToken),
		UserID:      account.UserID,
	}

	if _, err := s.store.SaveSession(ctx, session); err != nil {
		return CustomerAuthSessionData{}, err
	}

	return sessionDataFrom(session, account), nil
}
