package portalstore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
)

var ErrNilDB = errors.New("portalstore requires a database connection")

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) Read(ctx context.Context) (State, error) {
	if err := ctx.Err(); err != nil {
		return State{}, err
	}
	if s.db == nil {
		return State{}, ErrNilDB
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT professional_id, saved_at, snapshot, is_last_active
		FROM professional_portal_sessions
		ORDER BY professional_id ASC
	`)
	if err != nil {
		return State{}, err
	}
	defer rows.Close()

	state := State{
		Sessions: make(map[string]Record),
	}

	for rows.Next() {
		var record Record
		var snapshotBytes []byte
		var isLastActive bool
		if err := rows.Scan(&record.ProfessionalID, &record.SavedAt, &snapshotBytes, &isLastActive); err != nil {
			return State{}, err
		}

		if len(snapshotBytes) > 0 {
			if err := json.Unmarshal(snapshotBytes, &record.Snapshot); err != nil {
				return State{}, err
			}
		}
		if record.Snapshot == nil {
			record.Snapshot = map[string]any{}
		}

		if isLastActive {
			state.LastActiveProfessionalID = record.ProfessionalID
		}

		state.Sessions[record.ProfessionalID] = record
	}

	if err := rows.Err(); err != nil {
		return State{}, err
	}

	return state, nil
}

func (s *PostgresStore) Upsert(ctx context.Context, record Record, lastActiveProfessionalID string) (State, error) {
	if err := ctx.Err(); err != nil {
		return State{}, err
	}
	if s.db == nil {
		return State{}, ErrNilDB
	}

	snapshotBytes, err := json.Marshal(record.Snapshot)
	if err != nil {
		return State{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return State{}, err
	}

	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		UPDATE professional_portal_sessions
		SET is_last_active = FALSE
		WHERE is_last_active = TRUE
	`); err != nil {
		return State{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_portal_sessions (
			professional_id,
			saved_at,
			snapshot,
			is_last_active
		) VALUES ($1, $2, $3, TRUE)
		ON CONFLICT (professional_id) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    snapshot = EXCLUDED.snapshot,
		    is_last_active = TRUE
	`, record.ProfessionalID, record.SavedAt, snapshotBytes); err != nil {
		return State{}, err
	}

	if err := tx.Commit(); err != nil {
		return State{}, err
	}

	return s.Read(ctx)
}
