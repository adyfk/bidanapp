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

type CustomerAccount struct {
	City            string
	ConsumerID      string
	DisplayName     string
	PasswordHash    string
	Phone           string
	PhoneNormalized string
	RegisteredAt    time.Time
	UserID          string
}

type ProfessionalAccount struct {
	City                string
	CredentialNumber    string
	DisplayName         string
	PasswordHash        string
	Phone               string
	PhoneNormalized     string
	ProfessionalID      string
	RecoveryRequestedAt *time.Time
	RegisteredAt        time.Time
	UserID              string
}

type AdminAccount struct {
	AdminID      string
	CreatedAt    time.Time
	Email        string
	FocusArea    string
	PasswordHash string
	UserID       string
}

type Session struct {
	ExpiresAt        time.Time
	LastLoginAt      time.Time
	LastVisitedRoute string
	RevokedAt        *time.Time
	Role             string
	SavedAt          time.Time
	SubjectID        string
	TokenHash        string
	UserID           string
}

type Store interface {
	AdminAccountByAdminID(ctx context.Context, adminID string) (AdminAccount, error)
	AdminAccountByEmail(ctx context.Context, email string) (AdminAccount, error)
	CreateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error)
	UpdateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error)

	CreateCustomerAccount(ctx context.Context, account CustomerAccount) (CustomerAccount, error)
	CustomerAccountByConsumerID(ctx context.Context, consumerID string) (CustomerAccount, error)
	CustomerAccountByPhone(ctx context.Context, phoneNormalized string) (CustomerAccount, error)
	UpdateCustomerAccount(ctx context.Context, account CustomerAccount) (CustomerAccount, error)

	CreateProfessionalAccount(ctx context.Context, account ProfessionalAccount) (ProfessionalAccount, error)
	ProfessionalAccountByPhone(ctx context.Context, phoneNormalized string) (ProfessionalAccount, error)
	ProfessionalAccountByProfessionalID(ctx context.Context, professionalID string) (ProfessionalAccount, error)
	UpdateProfessionalAccount(ctx context.Context, account ProfessionalAccount) (ProfessionalAccount, error)

	SaveSession(ctx context.Context, session Session) (Session, error)
	SessionByTokenHash(ctx context.Context, role string, tokenHash string) (Session, error)
}
