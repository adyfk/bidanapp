package authstore

import (
	"context"
	"sync"
	"time"
)

type MemoryStore struct {
	adminAccounts        map[string]AdminAccount
	customerAccounts     map[string]CustomerAccount
	professionalAccounts map[string]ProfessionalAccount
	sessions             map[string]Session
	mu                   sync.RWMutex
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		adminAccounts:        map[string]AdminAccount{},
		customerAccounts:     map[string]CustomerAccount{},
		professionalAccounts: map[string]ProfessionalAccount{},
		sessions:             map[string]Session{},
	}
}

func (s *MemoryStore) CreateCustomerAccount(ctx context.Context, account CustomerAccount) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.customerAccounts[account.ConsumerID]; exists {
		return CustomerAccount{}, ErrConflict
	}
	if s.customerPhoneInUse(account.PhoneNormalized, account.ConsumerID) {
		return CustomerAccount{}, ErrConflict
	}

	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = time.Now().UTC()
	}

	cloned := cloneCustomerAccount(account)
	s.customerAccounts[account.ConsumerID] = cloned
	return cloneCustomerAccount(cloned), nil
}

func (s *MemoryStore) CustomerAccountByConsumerID(ctx context.Context, consumerID string) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	account, ok := s.customerAccounts[consumerID]
	if !ok {
		return CustomerAccount{}, ErrNotFound
	}

	return cloneCustomerAccount(account), nil
}

func (s *MemoryStore) CustomerAccountByPhone(ctx context.Context, phoneNormalized string) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, account := range s.customerAccounts {
		if account.PhoneNormalized == phoneNormalized {
			return cloneCustomerAccount(account), nil
		}
	}

	return CustomerAccount{}, ErrNotFound
}

func (s *MemoryStore) UpdateCustomerAccount(ctx context.Context, account CustomerAccount) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	existing, ok := s.customerAccounts[account.ConsumerID]
	if !ok {
		return CustomerAccount{}, ErrNotFound
	}
	if s.customerPhoneInUse(account.PhoneNormalized, account.ConsumerID) {
		return CustomerAccount{}, ErrConflict
	}

	if account.UserID == "" {
		account.UserID = existing.UserID
	}
	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = existing.RegisteredAt
	}

	cloned := cloneCustomerAccount(account)
	s.customerAccounts[account.ConsumerID] = cloned
	return cloneCustomerAccount(cloned), nil
}

func (s *MemoryStore) CreateProfessionalAccount(ctx context.Context, account ProfessionalAccount) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.professionalAccounts[account.ProfessionalID]; exists {
		return ProfessionalAccount{}, ErrConflict
	}
	if s.professionalPhoneInUse(account.PhoneNormalized, account.ProfessionalID) {
		return ProfessionalAccount{}, ErrConflict
	}

	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = time.Now().UTC()
	}

	cloned := cloneProfessionalAccount(account)
	s.professionalAccounts[account.ProfessionalID] = cloned
	return cloneProfessionalAccount(cloned), nil
}

func (s *MemoryStore) ProfessionalAccountByPhone(ctx context.Context, phoneNormalized string) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, account := range s.professionalAccounts {
		if account.PhoneNormalized == phoneNormalized {
			return cloneProfessionalAccount(account), nil
		}
	}

	return ProfessionalAccount{}, ErrNotFound
}

func (s *MemoryStore) ProfessionalAccountByProfessionalID(ctx context.Context, professionalID string) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	account, ok := s.professionalAccounts[professionalID]
	if !ok {
		return ProfessionalAccount{}, ErrNotFound
	}

	return cloneProfessionalAccount(account), nil
}

func (s *MemoryStore) UpdateProfessionalAccount(ctx context.Context, account ProfessionalAccount) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	existing, ok := s.professionalAccounts[account.ProfessionalID]
	if !ok {
		return ProfessionalAccount{}, ErrNotFound
	}
	if s.professionalPhoneInUse(account.PhoneNormalized, account.ProfessionalID) {
		return ProfessionalAccount{}, ErrConflict
	}

	if account.UserID == "" {
		account.UserID = existing.UserID
	}
	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = existing.RegisteredAt
	}
	if account.RecoveryRequestedAt == nil {
		account.RecoveryRequestedAt = cloneTimePointer(existing.RecoveryRequestedAt)
	}

	cloned := cloneProfessionalAccount(account)
	s.professionalAccounts[account.ProfessionalID] = cloned
	return cloneProfessionalAccount(cloned), nil
}

func (s *MemoryStore) CreateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.adminAccounts[account.AdminID]; exists {
		return AdminAccount{}, ErrConflict
	}
	if s.adminEmailInUse(account.Email, account.AdminID) {
		return AdminAccount{}, ErrConflict
	}

	if account.CreatedAt.IsZero() {
		account.CreatedAt = time.Now().UTC()
	}

	cloned := cloneAdminAccount(account)
	s.adminAccounts[account.AdminID] = cloned
	return cloneAdminAccount(cloned), nil
}

func (s *MemoryStore) AdminAccountByAdminID(ctx context.Context, adminID string) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	account, ok := s.adminAccounts[adminID]
	if !ok {
		return AdminAccount{}, ErrNotFound
	}

	return cloneAdminAccount(account), nil
}

func (s *MemoryStore) AdminAccountByEmail(ctx context.Context, email string) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, account := range s.adminAccounts {
		if account.Email == email {
			return cloneAdminAccount(account), nil
		}
	}

	return AdminAccount{}, ErrNotFound
}

func (s *MemoryStore) UpdateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	existing, ok := s.adminAccounts[account.AdminID]
	if !ok {
		return AdminAccount{}, ErrNotFound
	}
	if s.adminEmailInUse(account.Email, account.AdminID) {
		return AdminAccount{}, ErrConflict
	}

	if account.UserID == "" {
		account.UserID = existing.UserID
	}
	if account.CreatedAt.IsZero() {
		account.CreatedAt = existing.CreatedAt
	}

	cloned := cloneAdminAccount(account)
	s.adminAccounts[account.AdminID] = cloned
	return cloneAdminAccount(cloned), nil
}

func (s *MemoryStore) SessionByTokenHash(ctx context.Context, role string, tokenHash string) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	session, ok := s.sessions[buildSessionKey(role, tokenHash)]
	if !ok {
		return Session{}, ErrNotFound
	}

	return cloneSession(session), nil
}

func (s *MemoryStore) SaveSession(ctx context.Context, session Session) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if session.SavedAt.IsZero() {
		session.SavedAt = time.Now().UTC()
	}

	cloned := cloneSession(session)
	s.sessions[buildSessionKey(session.Role, session.TokenHash)] = cloned
	return cloneSession(cloned), nil
}

func (s *MemoryStore) customerPhoneInUse(phoneNormalized string, excludedConsumerID string) bool {
	for consumerID, account := range s.customerAccounts {
		if consumerID == excludedConsumerID {
			continue
		}
		if account.PhoneNormalized == phoneNormalized {
			return true
		}
	}
	return false
}

func (s *MemoryStore) professionalPhoneInUse(phoneNormalized string, excludedProfessionalID string) bool {
	for professionalID, account := range s.professionalAccounts {
		if professionalID == excludedProfessionalID {
			continue
		}
		if account.PhoneNormalized == phoneNormalized {
			return true
		}
	}
	return false
}

func (s *MemoryStore) adminEmailInUse(email string, excludedAdminID string) bool {
	for adminID, account := range s.adminAccounts {
		if adminID == excludedAdminID {
			continue
		}
		if account.Email == email {
			return true
		}
	}
	return false
}

func buildSessionKey(role string, tokenHash string) string {
	return role + "::" + tokenHash
}

func cloneCustomerAccount(account CustomerAccount) CustomerAccount {
	return account
}

func cloneProfessionalAccount(account ProfessionalAccount) ProfessionalAccount {
	cloned := account
	cloned.RecoveryRequestedAt = cloneTimePointer(account.RecoveryRequestedAt)
	return cloned
}

func cloneAdminAccount(account AdminAccount) AdminAccount {
	return account
}

func cloneSession(session Session) Session {
	cloned := session
	cloned.RevokedAt = cloneTimePointer(session.RevokedAt)
	return cloned
}

func cloneTimePointer(value *time.Time) *time.Time {
	if value == nil {
		return nil
	}

	cloned := value.UTC()
	return &cloned
}
