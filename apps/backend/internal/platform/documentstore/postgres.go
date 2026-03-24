package documentstore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
)

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) Read(ctx context.Context, namespace string, key string) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}
	if s.db == nil {
		return Record{}, ErrNilDB
	}

	var record Record
	var snapshotBytes []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT namespace, document_key, saved_at, snapshot
		FROM app_state_documents
		WHERE namespace = $1 AND document_key = $2
	`, namespace, key).Scan(&record.Namespace, &record.Key, &record.SavedAt, &snapshotBytes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	if len(snapshotBytes) > 0 {
		if err := json.Unmarshal(snapshotBytes, &record.Snapshot); err != nil {
			return Record{}, err
		}
	}
	if record.Snapshot == nil {
		record.Snapshot = map[string]any{}
	}

	return record, nil
}

func (s *PostgresStore) Upsert(ctx context.Context, record Record) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}
	if s.db == nil {
		return Record{}, ErrNilDB
	}

	snapshotBytes, err := json.Marshal(record.Snapshot)
	if err != nil {
		return Record{}, err
	}

	if err := s.db.QueryRowContext(ctx, `
		INSERT INTO app_state_documents (
			namespace,
			document_key,
			saved_at,
			snapshot
		) VALUES ($1, $2, $3, $4)
		ON CONFLICT (namespace, document_key) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    snapshot = EXCLUDED.snapshot
		RETURNING namespace, document_key, saved_at, snapshot
	`, record.Namespace, record.Key, record.SavedAt, snapshotBytes).Scan(
		&record.Namespace,
		&record.Key,
		&record.SavedAt,
		&snapshotBytes,
	); err != nil {
		return Record{}, err
	}

	if len(snapshotBytes) > 0 {
		if err := json.Unmarshal(snapshotBytes, &record.Snapshot); err != nil {
			return Record{}, err
		}
	}
	if record.Snapshot == nil {
		record.Snapshot = map[string]any{}
	}

	return record, nil
}
