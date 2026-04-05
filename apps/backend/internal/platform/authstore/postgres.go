package authstore

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) CreateCustomerAccount(ctx context.Context, account CustomerAccount) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}
	if s.db == nil {
		return CustomerAccount{}, ErrNilDB
	}

	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = time.Now().UTC()
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CustomerAccount{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := upsertUser(ctx, tx, account.UserID, "customer", account.RegisteredAt); err != nil {
		return CustomerAccount{}, mapWriteError(err)
	}

	created, err := scanCustomerAccount(tx.QueryRowContext(ctx, `
		INSERT INTO customer_auth_accounts (
			user_id,
			consumer_id,
			display_name,
			city,
			phone,
			phone_normalized,
			password_hash,
			registered_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		RETURNING user_id, consumer_id, display_name, city, phone, phone_normalized, password_hash, registered_at
	`, account.UserID, account.ConsumerID, account.DisplayName, account.City, account.Phone, account.PhoneNormalized, account.PasswordHash, account.RegisteredAt))
	if err != nil {
		return CustomerAccount{}, mapWriteError(err)
	}

	if err := tx.Commit(); err != nil {
		return CustomerAccount{}, err
	}

	return created, nil
}

func (s *PostgresStore) CustomerAccountByConsumerID(ctx context.Context, consumerID string) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}
	if s.db == nil {
		return CustomerAccount{}, ErrNilDB
	}

	account, err := scanCustomerAccount(s.db.QueryRowContext(ctx, `
		SELECT user_id, consumer_id, display_name, city, phone, phone_normalized, password_hash, registered_at
		FROM customer_auth_accounts
		WHERE consumer_id = $1
	`, consumerID))
	if err != nil {
		return CustomerAccount{}, mapReadError(err)
	}

	return account, nil
}

func (s *PostgresStore) CustomerAccountByPhone(ctx context.Context, phoneNormalized string) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}
	if s.db == nil {
		return CustomerAccount{}, ErrNilDB
	}

	account, err := scanCustomerAccount(s.db.QueryRowContext(ctx, `
		SELECT user_id, consumer_id, display_name, city, phone, phone_normalized, password_hash, registered_at
		FROM customer_auth_accounts
		WHERE phone_normalized = $1
	`, phoneNormalized))
	if err != nil {
		return CustomerAccount{}, mapReadError(err)
	}

	return account, nil
}

func (s *PostgresStore) UpdateCustomerAccount(ctx context.Context, account CustomerAccount) (CustomerAccount, error) {
	if err := ctx.Err(); err != nil {
		return CustomerAccount{}, err
	}
	if s.db == nil {
		return CustomerAccount{}, ErrNilDB
	}

	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = time.Now().UTC()
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CustomerAccount{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := upsertUser(ctx, tx, account.UserID, "customer", time.Now().UTC()); err != nil {
		return CustomerAccount{}, mapWriteError(err)
	}

	updated, err := scanCustomerAccount(tx.QueryRowContext(ctx, `
		UPDATE customer_auth_accounts
		SET user_id = $2,
		    display_name = $3,
		    city = $4,
		    phone = $5,
		    phone_normalized = $6,
		    password_hash = $7,
		    registered_at = $8,
		    updated_at = $9
		WHERE consumer_id = $1
		RETURNING user_id, consumer_id, display_name, city, phone, phone_normalized, password_hash, registered_at
	`, account.ConsumerID, account.UserID, account.DisplayName, account.City, account.Phone, account.PhoneNormalized, account.PasswordHash, account.RegisteredAt, time.Now().UTC()))
	if err != nil {
		return CustomerAccount{}, mapWriteError(err)
	}

	if err := tx.Commit(); err != nil {
		return CustomerAccount{}, err
	}

	return updated, nil
}

func (s *PostgresStore) CreateProfessionalAccount(ctx context.Context, account ProfessionalAccount) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}
	if s.db == nil {
		return ProfessionalAccount{}, ErrNilDB
	}

	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = time.Now().UTC()
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalAccount{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := upsertUser(ctx, tx, account.UserID, "professional", account.RegisteredAt); err != nil {
		return ProfessionalAccount{}, mapWriteError(err)
	}

	created, err := scanProfessionalAccount(tx.QueryRowContext(ctx, `
		INSERT INTO professional_auth_accounts (
			user_id,
			professional_id,
			display_name,
			city,
			phone,
			phone_normalized,
			credential_number,
			password_hash,
			registered_at,
			recovery_requested_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $9)
		RETURNING user_id, professional_id, display_name, city, phone, phone_normalized, credential_number, password_hash, registered_at, recovery_requested_at
	`, account.UserID, account.ProfessionalID, account.DisplayName, account.City, account.Phone, account.PhoneNormalized, account.CredentialNumber, account.PasswordHash, account.RegisteredAt, account.RecoveryRequestedAt))
	if err != nil {
		return ProfessionalAccount{}, mapWriteError(err)
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalAccount{}, err
	}

	return created, nil
}

func (s *PostgresStore) ProfessionalAccountByPhone(ctx context.Context, phoneNormalized string) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}
	if s.db == nil {
		return ProfessionalAccount{}, ErrNilDB
	}

	account, err := scanProfessionalAccount(s.db.QueryRowContext(ctx, `
		SELECT user_id, professional_id, display_name, city, phone, phone_normalized, credential_number, password_hash, registered_at, recovery_requested_at
		FROM professional_auth_accounts
		WHERE phone_normalized = $1
	`, phoneNormalized))
	if err != nil {
		return ProfessionalAccount{}, mapReadError(err)
	}

	return account, nil
}

func (s *PostgresStore) ProfessionalAccountByProfessionalID(ctx context.Context, professionalID string) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}
	if s.db == nil {
		return ProfessionalAccount{}, ErrNilDB
	}

	account, err := scanProfessionalAccount(s.db.QueryRowContext(ctx, `
		SELECT user_id, professional_id, display_name, city, phone, phone_normalized, credential_number, password_hash, registered_at, recovery_requested_at
		FROM professional_auth_accounts
		WHERE professional_id = $1
	`, professionalID))
	if err != nil {
		return ProfessionalAccount{}, mapReadError(err)
	}

	return account, nil
}

func (s *PostgresStore) UpdateProfessionalAccount(ctx context.Context, account ProfessionalAccount) (ProfessionalAccount, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalAccount{}, err
	}
	if s.db == nil {
		return ProfessionalAccount{}, ErrNilDB
	}

	if account.RegisteredAt.IsZero() {
		account.RegisteredAt = time.Now().UTC()
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalAccount{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := upsertUser(ctx, tx, account.UserID, "professional", time.Now().UTC()); err != nil {
		return ProfessionalAccount{}, mapWriteError(err)
	}

	updated, err := scanProfessionalAccount(tx.QueryRowContext(ctx, `
		UPDATE professional_auth_accounts
		SET user_id = $2,
		    display_name = $3,
		    city = $4,
		    phone = $5,
		    phone_normalized = $6,
		    credential_number = $7,
		    password_hash = $8,
		    registered_at = $9,
		    recovery_requested_at = $10,
		    updated_at = $11
		WHERE professional_id = $1
		RETURNING user_id, professional_id, display_name, city, phone, phone_normalized, credential_number, password_hash, registered_at, recovery_requested_at
	`, account.ProfessionalID, account.UserID, account.DisplayName, account.City, account.Phone, account.PhoneNormalized, account.CredentialNumber, account.PasswordHash, account.RegisteredAt, account.RecoveryRequestedAt, time.Now().UTC()))
	if err != nil {
		return ProfessionalAccount{}, mapWriteError(err)
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalAccount{}, err
	}

	return updated, nil
}

func (s *PostgresStore) CreateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}
	if s.db == nil {
		return AdminAccount{}, ErrNilDB
	}

	if account.CreatedAt.IsZero() {
		account.CreatedAt = time.Now().UTC()
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return AdminAccount{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := upsertUser(ctx, tx, account.UserID, "admin", account.CreatedAt); err != nil {
		return AdminAccount{}, mapWriteError(err)
	}

	created, err := scanAdminAccount(tx.QueryRowContext(ctx, `
		INSERT INTO admin_auth_accounts (
			user_id,
			admin_id,
			email,
			password_hash,
			focus_area,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $6)
		RETURNING user_id, admin_id, email, password_hash, focus_area, created_at
	`, account.UserID, account.AdminID, account.Email, account.PasswordHash, account.FocusArea, account.CreatedAt))
	if err != nil {
		return AdminAccount{}, mapWriteError(err)
	}

	if err := tx.Commit(); err != nil {
		return AdminAccount{}, err
	}

	return created, nil
}

func (s *PostgresStore) AdminAccountByAdminID(ctx context.Context, adminID string) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}
	if s.db == nil {
		return AdminAccount{}, ErrNilDB
	}

	account, err := scanAdminAccount(s.db.QueryRowContext(ctx, `
		SELECT user_id, admin_id, email, password_hash, focus_area, created_at
		FROM admin_auth_accounts
		WHERE admin_id = $1
	`, adminID))
	if err != nil {
		return AdminAccount{}, mapReadError(err)
	}

	return account, nil
}

func (s *PostgresStore) AdminAccountByEmail(ctx context.Context, email string) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}
	if s.db == nil {
		return AdminAccount{}, ErrNilDB
	}

	account, err := scanAdminAccount(s.db.QueryRowContext(ctx, `
		SELECT user_id, admin_id, email, password_hash, focus_area, created_at
		FROM admin_auth_accounts
		WHERE email = $1
	`, email))
	if err != nil {
		return AdminAccount{}, mapReadError(err)
	}

	return account, nil
}

func (s *PostgresStore) UpdateAdminAccount(ctx context.Context, account AdminAccount) (AdminAccount, error) {
	if err := ctx.Err(); err != nil {
		return AdminAccount{}, err
	}
	if s.db == nil {
		return AdminAccount{}, ErrNilDB
	}

	if account.CreatedAt.IsZero() {
		account.CreatedAt = time.Now().UTC()
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return AdminAccount{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := upsertUser(ctx, tx, account.UserID, "admin", time.Now().UTC()); err != nil {
		return AdminAccount{}, mapWriteError(err)
	}

	updated, err := scanAdminAccount(tx.QueryRowContext(ctx, `
		UPDATE admin_auth_accounts
		SET user_id = $2,
		    email = $3,
		    password_hash = $4,
		    focus_area = $5,
		    created_at = $6,
		    updated_at = $7
		WHERE admin_id = $1
		RETURNING user_id, admin_id, email, password_hash, focus_area, created_at
	`, account.AdminID, account.UserID, account.Email, account.PasswordHash, account.FocusArea, account.CreatedAt, time.Now().UTC()))
	if err != nil {
		return AdminAccount{}, mapWriteError(err)
	}

	if err := tx.Commit(); err != nil {
		return AdminAccount{}, err
	}

	return updated, nil
}

func (s *PostgresStore) SessionByTokenHash(ctx context.Context, role string, tokenHash string) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}
	if s.db == nil {
		return Session{}, ErrNilDB
	}

	session, err := scanSession(s.db.QueryRowContext(ctx, `
		SELECT token_hash, user_id, role, subject_id, last_login_at, expires_at, revoked_at, last_visited_route, saved_at
		FROM auth_sessions
		WHERE token_hash = $1 AND role = $2
	`, tokenHash, role))
	if err != nil {
		return Session{}, mapReadError(err)
	}

	return session, nil
}

func (s *PostgresStore) SaveSession(ctx context.Context, session Session) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}
	if s.db == nil {
		return Session{}, ErrNilDB
	}

	if session.SavedAt.IsZero() {
		session.SavedAt = time.Now().UTC()
	}

	saved, err := scanSession(s.db.QueryRowContext(ctx, `
		INSERT INTO auth_sessions (
			token_hash,
			user_id,
			role,
			subject_id,
			last_login_at,
			expires_at,
			revoked_at,
			last_visited_route,
			saved_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (token_hash) DO UPDATE
		SET user_id = EXCLUDED.user_id,
		    role = EXCLUDED.role,
		    subject_id = EXCLUDED.subject_id,
		    last_login_at = EXCLUDED.last_login_at,
		    expires_at = EXCLUDED.expires_at,
		    revoked_at = EXCLUDED.revoked_at,
		    last_visited_route = EXCLUDED.last_visited_route,
		    saved_at = EXCLUDED.saved_at
		RETURNING token_hash, user_id, role, subject_id, last_login_at, expires_at, revoked_at, last_visited_route, saved_at
	`, session.TokenHash, session.UserID, session.Role, session.SubjectID, session.LastLoginAt, session.ExpiresAt, session.RevokedAt, session.LastVisitedRoute, session.SavedAt))
	if err != nil {
		return Session{}, mapWriteError(err)
	}

	return saved, nil
}

func upsertUser(ctx context.Context, tx *sql.Tx, userID string, role string, timestamp time.Time) error {
	if tx == nil {
		return ErrNilDB
	}

	_, err := tx.ExecContext(ctx, `
		INSERT INTO auth_users (id, role, created_at, updated_at)
		VALUES ($1, $2, $3, $3)
		ON CONFLICT (id) DO UPDATE
		SET role = EXCLUDED.role,
		    updated_at = EXCLUDED.updated_at
	`, userID, role, timestamp)
	return err
}

func scanCustomerAccount(scanner interface{ Scan(dest ...any) error }) (CustomerAccount, error) {
	var account CustomerAccount
	err := scanner.Scan(
		&account.UserID,
		&account.ConsumerID,
		&account.DisplayName,
		&account.City,
		&account.Phone,
		&account.PhoneNormalized,
		&account.PasswordHash,
		&account.RegisteredAt,
	)
	if err != nil {
		return CustomerAccount{}, err
	}

	account.RegisteredAt = account.RegisteredAt.UTC()
	return account, nil
}

func scanProfessionalAccount(scanner interface{ Scan(dest ...any) error }) (ProfessionalAccount, error) {
	var (
		account      ProfessionalAccount
		recoveryTime sql.NullTime
	)
	err := scanner.Scan(
		&account.UserID,
		&account.ProfessionalID,
		&account.DisplayName,
		&account.City,
		&account.Phone,
		&account.PhoneNormalized,
		&account.CredentialNumber,
		&account.PasswordHash,
		&account.RegisteredAt,
		&recoveryTime,
	)
	if err != nil {
		return ProfessionalAccount{}, err
	}

	account.RegisteredAt = account.RegisteredAt.UTC()
	if recoveryTime.Valid {
		value := recoveryTime.Time.UTC()
		account.RecoveryRequestedAt = &value
	}
	return account, nil
}

func scanAdminAccount(scanner interface{ Scan(dest ...any) error }) (AdminAccount, error) {
	var account AdminAccount
	err := scanner.Scan(
		&account.UserID,
		&account.AdminID,
		&account.Email,
		&account.PasswordHash,
		&account.FocusArea,
		&account.CreatedAt,
	)
	if err != nil {
		return AdminAccount{}, err
	}

	account.CreatedAt = account.CreatedAt.UTC()
	return account, nil
}

func scanSession(scanner interface{ Scan(dest ...any) error }) (Session, error) {
	var (
		session     Session
		revokedAt   sql.NullTime
		lastVisited sql.NullString
	)
	err := scanner.Scan(
		&session.TokenHash,
		&session.UserID,
		&session.Role,
		&session.SubjectID,
		&session.LastLoginAt,
		&session.ExpiresAt,
		&revokedAt,
		&lastVisited,
		&session.SavedAt,
	)
	if err != nil {
		return Session{}, err
	}

	session.LastLoginAt = session.LastLoginAt.UTC()
	session.ExpiresAt = session.ExpiresAt.UTC()
	session.SavedAt = session.SavedAt.UTC()
	if revokedAt.Valid {
		value := revokedAt.Time.UTC()
		session.RevokedAt = &value
	}
	if lastVisited.Valid {
		session.LastVisitedRoute = lastVisited.String
	}
	return session, nil
}

func mapReadError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func mapWriteError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrConflict
	}
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}
