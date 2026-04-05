package contentstore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

const publishedReadModelNamespace = "published_readmodel"

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
	if namespace != publishedReadModelNamespace {
		return Record{}, ErrNotFound
	}

	return s.readPublishedDocument(ctx, key)
}

func (s *PostgresStore) ReadMany(ctx context.Context, namespace string, keys []string) (map[string]Record, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilDB
	}
	if namespace != publishedReadModelNamespace {
		return map[string]Record{}, nil
	}
	if len(keys) == 0 {
		return map[string]Record{}, nil
	}

	args := make([]any, 0, len(keys))
	placeholders := make([]string, 0, len(keys))
	for index, key := range keys {
		args = append(args, key)
		placeholders = append(placeholders, fmt.Sprintf("$%d", index+1))
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT file_name, saved_at, payload
		FROM published_readmodel_documents
		WHERE file_name IN (%s)
	`, strings.Join(placeholders, ", ")), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make(map[string]Record, len(keys))
	for rows.Next() {
		var (
			record       Record
			fileName     string
			payloadBytes []byte
		)
		if err := rows.Scan(&fileName, &record.SavedAt, &payloadBytes); err != nil {
			return nil, err
		}
		record.Namespace = publishedReadModelNamespace
		record.Key = fileName
		record.Payload = normalizePayload(payloadBytes)
		records[fileName] = record
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return records, nil
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
	if record.Namespace != publishedReadModelNamespace {
		return Record{}, ErrNotFound
	}

	return s.upsertPublishedDocument(ctx, record)
}

func (s *PostgresStore) readPublishedDocument(ctx context.Context, key string) (Record, error) {
	record := Record{
		Namespace: publishedReadModelNamespace,
		Key:       key,
	}

	var payloadBytes []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT saved_at, payload
		FROM published_readmodel_documents
		WHERE file_name = $1
	`, key).Scan(&record.SavedAt, &payloadBytes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	record.Payload = normalizePayload(payloadBytes)
	return record, nil
}

func (s *PostgresStore) upsertPublishedDocument(ctx context.Context, record Record) (Record, error) {
	payloadBytes := append([]byte(nil), record.Payload...)

	if err := s.db.QueryRowContext(ctx, `
			INSERT INTO published_readmodel_documents (
				file_name,
				saved_at,
				revision,
				payload
			) VALUES ($1, $2, 1, $3)
			ON CONFLICT (file_name) DO UPDATE
			SET saved_at = EXCLUDED.saved_at,
			    revision = published_readmodel_documents.revision + 1,
			    payload = EXCLUDED.payload
			RETURNING saved_at, payload
	`, record.Key, record.SavedAt, payloadBytes).Scan(
		&record.SavedAt,
		&payloadBytes,
	); err != nil {
		return Record{}, err
	}

	record.Payload = normalizePayload(payloadBytes)
	return record, nil
}

func normalizePayload(payloadBytes []byte) json.RawMessage {
	if len(payloadBytes) == 0 {
		return json.RawMessage("null")
	}

	return append(json.RawMessage(nil), payloadBytes...)
}
