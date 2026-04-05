package portalstore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
)

var ErrNilDB = errors.New("portalstore requires a database connection")

const portalSnapshotSchemaVersion = 10

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
		SELECT professional_id, saved_at, state, review_state, appointment_records
		FROM professional_portal_states
		ORDER BY professional_id ASC
	`)
	if err != nil {
		return State{}, err
	}
	defer rows.Close()

	state := State{
		Sessions: make(map[string]Record),
	}
	found := false

	for rows.Next() {
		found = true

		var (
			record                  Record
			stateBytes              []byte
			reviewStateBytes        []byte
			appointmentRecordsBytes []byte
		)
		if err := rows.Scan(
			&record.ProfessionalID,
			&record.SavedAt,
			&stateBytes,
			&reviewStateBytes,
			&appointmentRecordsBytes,
		); err != nil {
			return State{}, err
		}

		snapshot, err := buildPortalSnapshot(record.ProfessionalID, stateBytes, reviewStateBytes, appointmentRecordsBytes)
		if err != nil {
			return State{}, err
		}
		record.Snapshot = snapshot

		state.Sessions[record.ProfessionalID] = record
	}

	if err := rows.Err(); err != nil {
		return State{}, err
	}
	if !found {
		state.LastActiveProfessionalID, err = s.ReadLastActiveProfessionalID(ctx)
		if err != nil {
			return State{}, err
		}
		return state, nil
	}

	state.LastActiveProfessionalID, err = s.ReadLastActiveProfessionalID(ctx)
	if err != nil {
		return State{}, err
	}

	return state, nil
}

func (s *PostgresStore) ReadRecord(ctx context.Context, professionalID string) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}
	if s.db == nil {
		return Record{}, ErrNilDB
	}

	record := Record{ProfessionalID: professionalID}
	var (
		stateBytes              []byte
		reviewStateBytes        []byte
		appointmentRecordsBytes []byte
	)
	err := s.db.QueryRowContext(ctx, `
		SELECT professional_id, saved_at, state, review_state, appointment_records
		FROM professional_portal_states
		WHERE professional_id = $1
	`, professionalID).Scan(
		&record.ProfessionalID,
		&record.SavedAt,
		&stateBytes,
		&reviewStateBytes,
		&appointmentRecordsBytes,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	snapshot, err := buildPortalSnapshot(record.ProfessionalID, stateBytes, reviewStateBytes, appointmentRecordsBytes)
	if err != nil {
		return Record{}, err
	}
	record.Snapshot = snapshot
	return record, nil
}

func (s *PostgresStore) Upsert(ctx context.Context, record Record, lastActiveProfessionalID string) (State, error) {
	if _, err := s.UpsertRecord(ctx, record, lastActiveProfessionalID); err != nil {
		return State{}, err
	}

	return s.Read(ctx)
}

func (s *PostgresStore) UpsertRecord(ctx context.Context, record Record, lastActiveProfessionalID string) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}
	if s.db == nil {
		return Record{}, ErrNilDB
	}

	stateSnapshot := mapValue(record.Snapshot["state"])
	reviewState := nestedMapValue(record.Snapshot, "reviewStatesByProfessionalId", record.ProfessionalID)
	appointmentRecords := nestedSliceValue(record.Snapshot, "appointmentRecordsByProfessionalId", record.ProfessionalID)
	activeProfessionalID := lastActiveProfessionalID
	if activeProfessionalID == "" {
		activeProfessionalID = record.ProfessionalID
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Record{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_portal_states (
			professional_id,
			saved_at,
			schema_version,
			state,
			review_state,
			appointment_records
		) VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (professional_id) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    schema_version = EXCLUDED.schema_version,
		    state = EXCLUDED.state,
		    review_state = EXCLUDED.review_state,
		    appointment_records = EXCLUDED.appointment_records
	`,
		record.ProfessionalID,
		record.SavedAt,
		portalSnapshotSchemaVersion,
		marshalOrEmptyObject(stateSnapshot),
		marshalOrEmptyObject(reviewState),
		marshalOrEmptyArray(appointmentRecords),
	); err != nil {
		return Record{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_portal_runtime_state (
			document_key,
			last_active_professional_id
		) VALUES ('default', $1)
		ON CONFLICT (document_key) DO UPDATE
		SET last_active_professional_id = EXCLUDED.last_active_professional_id
	`, nullableProfessionalID(activeProfessionalID)); err != nil {
		return Record{}, err
	}

	if err := tx.Commit(); err != nil {
		return Record{}, err
	}

	return s.ReadRecord(ctx, record.ProfessionalID)
}

func (s *PostgresStore) ReadLastActiveProfessionalID(ctx context.Context) (string, error) {
	if s.db == nil {
		return "", ErrNilDB
	}

	var lastActiveProfessionalID sql.NullString
	err := s.db.QueryRowContext(ctx, `
		SELECT last_active_professional_id
		FROM professional_portal_runtime_state
		WHERE document_key = 'default'
	`).Scan(&lastActiveProfessionalID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}

	if !lastActiveProfessionalID.Valid {
		return "", nil
	}
	return lastActiveProfessionalID.String, nil
}

func buildPortalSnapshot(
	professionalID string,
	stateBytes []byte,
	reviewStateBytes []byte,
	appointmentRecordsBytes []byte,
) (map[string]any, error) {
	stateSnapshot, err := decodeMap(stateBytes)
	if err != nil {
		return nil, err
	}
	reviewState, err := decodeMap(reviewStateBytes)
	if err != nil {
		return nil, err
	}
	appointmentRecords, err := decodeSlice(appointmentRecordsBytes)
	if err != nil {
		return nil, err
	}

	snapshot := map[string]any{
		"appointmentRecordsByProfessionalId": map[string]any{
			professionalID: appointmentRecords,
		},
		"reviewStatesByProfessionalId": map[string]any{
			professionalID: reviewState,
		},
		"schemaVersion": portalSnapshotSchemaVersion,
		"state":         stateSnapshot,
	}

	return snapshot, nil
}

func nestedMapValue(snapshot map[string]any, key string, nestedKey string) map[string]any {
	parent := mapValue(snapshot[key])
	return mapValue(parent[nestedKey])
}

func nestedSliceValue(snapshot map[string]any, key string, nestedKey string) []any {
	parent := mapValue(snapshot[key])
	return sliceValue(parent[nestedKey])
}

func nullableProfessionalID(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func mapValue(value any) map[string]any {
	return decodeValue(value, map[string]any{})
}

func sliceValue(value any) []any {
	return decodeValue(value, []any{})
}

func decodeValue[T any](value any, fallback T) T {
	if value == nil {
		return fallback
	}

	raw, err := json.Marshal(value)
	if err != nil {
		return fallback
	}

	var decoded T
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return fallback
	}

	return decoded
}

func decodeMap(raw []byte) (map[string]any, error) {
	if len(raw) == 0 {
		return map[string]any{}, nil
	}

	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil, err
	}
	if decoded == nil {
		return map[string]any{}, nil
	}
	return decoded, nil
}

func decodeSlice(raw []byte) ([]any, error) {
	if len(raw) == 0 {
		return []any{}, nil
	}

	var decoded []any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil, err
	}
	if decoded == nil {
		return []any{}, nil
	}
	return decoded, nil
}

func marshalOrEmptyObject(value any) []byte {
	if value == nil {
		return []byte(`{}`)
	}

	raw, err := json.Marshal(value)
	if err != nil || len(raw) == 0 {
		return []byte(`{}`)
	}

	return raw
}

func marshalOrEmptyArray(value any) []byte {
	if value == nil {
		return []byte(`[]`)
	}

	raw, err := json.Marshal(value)
	if err != nil || len(raw) == 0 {
		return []byte(`[]`)
	}

	return raw
}
