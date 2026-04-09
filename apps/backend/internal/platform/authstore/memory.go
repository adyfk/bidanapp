package authstore

import (
	"context"
	"sync"
	"time"
)

type MemoryStore struct {
	adminAccounts map[string]AdminAccount
	sessions      map[string]Session
	mu            sync.RWMutex
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		adminAccounts: map[string]AdminAccount{},
		sessions:      map[string]Session{},
	}
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

func (s *MemoryStore) SessionsBySubject(ctx context.Context, role string, subjectID string) ([]Session, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]Session, 0)
	for _, session := range s.sessions {
		if session.Role != role || session.SubjectID != subjectID {
			continue
		}
		sessions = append(sessions, cloneSession(session))
	}

	return sessions, nil
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

func (s *MemoryStore) RevokeSession(ctx context.Context, role string, subjectID string, sessionID string, revokedAt time.Time) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for key, session := range s.sessions {
		if session.Role != role || session.SubjectID != subjectID || session.ID != sessionID {
			continue
		}
		session.RevokedAt = cloneTimePointer(&revokedAt)
		s.sessions[key] = session
		return cloneSession(session), nil
	}

	return Session{}, ErrNotFound
}

func (s *MemoryStore) RevokeAllOtherSessions(
	ctx context.Context,
	role string,
	subjectID string,
	excludedSessionID string,
	revokedAt time.Time,
) (int, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	count := 0
	for key, session := range s.sessions {
		if session.Role != role || session.SubjectID != subjectID || session.ID == excludedSessionID || session.RevokedAt != nil {
			continue
		}
		session.RevokedAt = cloneTimePointer(&revokedAt)
		s.sessions[key] = session
		count++
	}

	return count, nil
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
