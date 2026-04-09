package authstore

import (
	"context"
	"errors"
	"time"
)

var (
	ErrConflict = errors.New("authstore conflict")
	ErrNotFound = errors.New("authstore record not found")
	ErrNilDB    = errors.New("authstore requires a database connection")
)

type AdminAccount struct {
	AdminID      string
	CreatedAt    time.Time
	Email        string
	FocusArea    string
	PasswordHash string
	UserID       string
}

type Session struct {
	CreatedAt        time.Time
	ExpiresAt        time.Time
	ID               string
	IPAddress        string
	LastLoginAt      time.Time
	LastSeenAt       time.Time
	LastVisitedRoute string
	RevokedAt        *time.Time
	Role             string
	SavedAt          time.Time
	SessionLabel     string
	SubjectID        string
	TokenHash        string
	UserAgent        string
	UserID           string
}

type Store interface {
	AdminAccountByAdminID(ctx context.Context, adminID string) (AdminAccount, error)
	AdminAccountByEmail(ctx context.Context, email string) (AdminAccount, error)
	CreateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error)
	UpdateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error)
	RevokeAllOtherSessions(ctx context.Context, role string, subjectID string, excludedSessionID string, revokedAt time.Time) (int, error)
	RevokeSession(ctx context.Context, role string, subjectID string, sessionID string, revokedAt time.Time) (Session, error)
	SaveSession(ctx context.Context, session Session) (Session, error)
	SessionsBySubject(ctx context.Context, role string, subjectID string) ([]Session, error)
	SessionByTokenHash(ctx context.Context, role string, tokenHash string) (Session, error)
}
