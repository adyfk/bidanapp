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
		SELECT id, token_hash, user_id, role, subject_id, last_login_at, last_seen_at, expires_at, revoked_at, last_visited_route, user_agent, ip_address, session_label, created_at, saved_at
		FROM auth_sessions
		WHERE token_hash = $1 AND role = $2
	`, tokenHash, role))
	if err != nil {
		return Session{}, mapReadError(err)
	}

	return session, nil
}

func (s *PostgresStore) SessionsBySubject(ctx context.Context, role string, subjectID string) ([]Session, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilDB
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, token_hash, user_id, role, subject_id, last_login_at, last_seen_at, expires_at, revoked_at, last_visited_route, user_agent, ip_address, session_label, created_at, saved_at
		FROM auth_sessions
		WHERE role = $1 AND subject_id = $2
		ORDER BY last_seen_at DESC, created_at DESC
	`, role, subjectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sessions := make([]Session, 0)
	for rows.Next() {
		session, err := scanSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	return sessions, rows.Err()
}

func (s *PostgresStore) SaveSession(ctx context.Context, session Session) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}
	if s.db == nil {
		return Session{}, ErrNilDB
	}
	if session.CreatedAt.IsZero() {
		session.CreatedAt = time.Now().UTC()
	}
	if session.SavedAt.IsZero() {
		session.SavedAt = time.Now().UTC()
	}

	saved, err := scanSession(s.db.QueryRowContext(ctx, `
		INSERT INTO auth_sessions (
			id,
			token_hash,
			user_id,
			role,
			subject_id,
			last_login_at,
			last_seen_at,
			expires_at,
			revoked_at,
			last_visited_route,
			user_agent,
			ip_address,
			session_label,
			created_at,
			saved_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		ON CONFLICT (token_hash) DO UPDATE
		SET id = EXCLUDED.id,
		    user_id = EXCLUDED.user_id,
		    role = EXCLUDED.role,
		    subject_id = EXCLUDED.subject_id,
		    last_login_at = EXCLUDED.last_login_at,
		    last_seen_at = EXCLUDED.last_seen_at,
		    expires_at = EXCLUDED.expires_at,
		    revoked_at = EXCLUDED.revoked_at,
		    last_visited_route = EXCLUDED.last_visited_route,
		    user_agent = EXCLUDED.user_agent,
		    ip_address = EXCLUDED.ip_address,
		    session_label = EXCLUDED.session_label,
		    created_at = EXCLUDED.created_at,
		    saved_at = EXCLUDED.saved_at
		RETURNING id, token_hash, user_id, role, subject_id, last_login_at, last_seen_at, expires_at, revoked_at, last_visited_route, user_agent, ip_address, session_label, created_at, saved_at
	`, session.ID, session.TokenHash, session.UserID, session.Role, session.SubjectID, session.LastLoginAt, session.LastSeenAt, session.ExpiresAt, session.RevokedAt, session.LastVisitedRoute, session.UserAgent, session.IPAddress, session.SessionLabel, session.CreatedAt, session.SavedAt))
	if err != nil {
		return Session{}, mapWriteError(err)
	}

	return saved, nil
}

func (s *PostgresStore) RevokeSession(ctx context.Context, role string, subjectID string, sessionID string, revokedAt time.Time) (Session, error) {
	if err := ctx.Err(); err != nil {
		return Session{}, err
	}
	if s.db == nil {
		return Session{}, ErrNilDB
	}

	session, err := scanSession(s.db.QueryRowContext(ctx, `
		UPDATE auth_sessions
		SET revoked_at = $4,
		    saved_at = now()
		WHERE id = $1 AND role = $2 AND subject_id = $3
		RETURNING id, token_hash, user_id, role, subject_id, last_login_at, last_seen_at, expires_at, revoked_at, last_visited_route, user_agent, ip_address, session_label, created_at, saved_at
	`, sessionID, role, subjectID, revokedAt))
	if err != nil {
		return Session{}, mapReadError(err)
	}

	return session, nil
}

func (s *PostgresStore) RevokeAllOtherSessions(
	ctx context.Context,
	role string,
	subjectID string,
	excludedSessionID string,
	revokedAt time.Time,
) (int, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}
	if s.db == nil {
		return 0, ErrNilDB
	}

	result, err := s.db.ExecContext(ctx, `
		UPDATE auth_sessions
		SET revoked_at = $4,
		    saved_at = now()
		WHERE role = $1
		  AND subject_id = $2
		  AND id <> $3
		  AND revoked_at IS NULL
	`, role, subjectID, excludedSessionID, revokedAt)
	if err != nil {
		return 0, err
	}

	count, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}

	return int(count), nil
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
		session      Session
		revokedAt    sql.NullTime
		lastVisited  sql.NullString
		userAgent    sql.NullString
		ipAddress    sql.NullString
		sessionLabel sql.NullString
	)
	err := scanner.Scan(
		&session.ID,
		&session.TokenHash,
		&session.UserID,
		&session.Role,
		&session.SubjectID,
		&session.LastLoginAt,
		&session.LastSeenAt,
		&session.ExpiresAt,
		&revokedAt,
		&lastVisited,
		&userAgent,
		&ipAddress,
		&sessionLabel,
		&session.CreatedAt,
		&session.SavedAt,
	)
	if err != nil {
		return Session{}, err
	}

	session.LastLoginAt = session.LastLoginAt.UTC()
	session.LastSeenAt = session.LastSeenAt.UTC()
	session.ExpiresAt = session.ExpiresAt.UTC()
	session.CreatedAt = session.CreatedAt.UTC()
	session.SavedAt = session.SavedAt.UTC()
	if revokedAt.Valid {
		value := revokedAt.Time.UTC()
		session.RevokedAt = &value
	}
	if lastVisited.Valid {
		session.LastVisitedRoute = lastVisited.String
	}
	if userAgent.Valid {
		session.UserAgent = userAgent.String
	}
	if ipAddress.Valid {
		session.IPAddress = ipAddress.String
	}
	if sessionLabel.Valid {
		session.SessionLabel = sessionLabel.String
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
	return err
}
