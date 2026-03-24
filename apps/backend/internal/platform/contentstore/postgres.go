package contentstore

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
	var payloadBytes []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT namespace, document_key, saved_at, payload
		FROM content_documents
		WHERE namespace = $1 AND document_key = $2
	`, namespace, key).Scan(&record.Namespace, &record.Key, &record.SavedAt, &payloadBytes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	if len(payloadBytes) == 0 {
		record.Payload = json.RawMessage("null")
	} else {
		record.Payload = append(json.RawMessage(nil), payloadBytes...)
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

	if len(record.Payload) == 0 {
		record.Payload = json.RawMessage("null")
	}

	payloadBytes := append([]byte(nil), record.Payload...)

	if err := s.db.QueryRowContext(ctx, `
		INSERT INTO content_documents (
			namespace,
			document_key,
			saved_at,
			payload
		) VALUES ($1, $2, $3, $4)
		ON CONFLICT (namespace, document_key) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    payload = EXCLUDED.payload
		RETURNING namespace, document_key, saved_at, payload
	`, record.Namespace, record.Key, record.SavedAt, payloadBytes).Scan(
		&record.Namespace,
		&record.Key,
		&record.SavedAt,
		&payloadBytes,
	); err != nil {
		return Record{}, err
	}

	record.Payload = append(json.RawMessage(nil), payloadBytes...)
	return record, nil
}
