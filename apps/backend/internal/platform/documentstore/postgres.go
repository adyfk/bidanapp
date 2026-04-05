package documentstore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	viewerSessionNamespace             = "viewer_session"
	customerNotificationsNamespace     = "customer_notifications"
	professionalNotificationsNamespace = "professional_notifications"
	consumerPreferencesNamespace       = "consumer_preferences"
	adminSessionNamespace              = "admin_session"
	adminSupportDeskNamespace          = "admin_support_desk"
	adminConsoleNamespace              = "admin_console"
	adminConsoleTableNamespace         = "admin_console_table"
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

	switch namespace {
	case viewerSessionNamespace:
		return s.readJSONState(ctx, namespace, key, "viewer_session_states", "document_key")
	case customerNotificationsNamespace:
		return s.readJSONState(ctx, namespace, key, "customer_notification_states", "consumer_id")
	case professionalNotificationsNamespace:
		return s.readJSONState(ctx, namespace, key, "professional_notification_states", "professional_id")
	case consumerPreferencesNamespace:
		return s.readJSONState(ctx, namespace, key, "consumer_preference_states", "consumer_id")
	case adminSessionNamespace:
		return s.readJSONState(ctx, namespace, key, "admin_session_states", "document_key")
	case adminSupportDeskNamespace:
		return s.readSupportDesk(ctx, key)
	case adminConsoleNamespace:
		return s.readAdminConsole(ctx, key)
	case adminConsoleTableNamespace:
		return s.readAdminConsoleTable(ctx, key)
	default:
		return Record{}, ErrNotFound
	}
}

func (s *PostgresStore) Upsert(ctx context.Context, record Record) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}
	if s.db == nil {
		return Record{}, ErrNilDB
	}
	if record.SavedAt.IsZero() {
		record.SavedAt = time.Now().UTC()
	}
	if record.Snapshot == nil {
		record.Snapshot = map[string]any{}
	}

	switch record.Namespace {
	case viewerSessionNamespace:
		return s.upsertJSONState(ctx, record, "viewer_session_states", "document_key")
	case customerNotificationsNamespace:
		return s.upsertJSONState(ctx, record, "customer_notification_states", "consumer_id")
	case professionalNotificationsNamespace:
		return s.upsertJSONState(ctx, record, "professional_notification_states", "professional_id")
	case consumerPreferencesNamespace:
		return s.upsertJSONState(ctx, record, "consumer_preference_states", "consumer_id")
	case adminSessionNamespace:
		return s.upsertJSONState(ctx, record, "admin_session_states", "document_key")
	case adminSupportDeskNamespace:
		return s.upsertSupportDesk(ctx, record)
	case adminConsoleNamespace:
		return s.upsertAdminConsole(ctx, record)
	case adminConsoleTableNamespace:
		return s.upsertAdminConsoleTable(ctx, record)
	default:
		return Record{}, ErrNotFound
	}
}

func (s *PostgresStore) readJSONState(
	ctx context.Context,
	namespace string,
	key string,
	tableName string,
	keyColumn string,
) (Record, error) {
	query := fmt.Sprintf(`
		SELECT saved_at, snapshot
		FROM %s
		WHERE %s = $1
	`, tableName, keyColumn)

	record := Record{
		Namespace: namespace,
		Key:       key,
	}

	var snapshotBytes []byte
	err := s.db.QueryRowContext(ctx, query, key).Scan(&record.SavedAt, &snapshotBytes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	snapshot, err := decodeMap(snapshotBytes)
	if err != nil {
		return Record{}, err
	}
	record.Snapshot = snapshot
	return record, nil
}

func (s *PostgresStore) upsertJSONState(
	ctx context.Context,
	record Record,
	tableName string,
	keyColumn string,
) (Record, error) {
	snapshotBytes, err := json.Marshal(record.Snapshot)
	if err != nil {
		return Record{}, err
	}

	query := fmt.Sprintf(`
		INSERT INTO %s (
			%s,
			saved_at,
			snapshot
		) VALUES ($1, $2, $3)
		ON CONFLICT (%s) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    snapshot = EXCLUDED.snapshot
		RETURNING saved_at, snapshot
	`, tableName, keyColumn, keyColumn)

	var returnedSnapshot []byte
	if err := s.db.QueryRowContext(ctx, query, record.Key, record.SavedAt, snapshotBytes).Scan(
		&record.SavedAt,
		&returnedSnapshot,
	); err != nil {
		return Record{}, err
	}

	record.Snapshot, err = decodeMap(returnedSnapshot)
	if err != nil {
		return Record{}, err
	}
	return record, nil
}

func (s *PostgresStore) readSupportDesk(ctx context.Context, key string) (Record, error) {
	record := Record{
		Namespace: adminSupportDeskNamespace,
		Key:       key,
	}

	var schemaVersion int
	var commandCenterBytes []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT saved_at, schema_version, command_center
		FROM admin_support_desk_states
		WHERE document_key = $1
	`, key).Scan(&record.SavedAt, &schemaVersion, &commandCenterBytes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	commandCenter, err := decodeMap(commandCenterBytes)
	if err != nil {
		return Record{}, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			id,
			assigned_admin_id,
			category_id,
			contact_value,
			created_at,
			details,
			eta_key,
			preferred_channel,
			reference_code,
			related_appointment_id,
			related_professional_id,
			reporter_name,
			reporter_phone,
			reporter_role,
			source_surface,
			status,
			summary,
			updated_at,
			urgency
		FROM support_tickets
		ORDER BY sort_index ASC, id ASC
	`)
	if err != nil {
		return Record{}, err
	}
	defer rows.Close()

	tickets := make([]map[string]any, 0)
	for rows.Next() {
		var (
			id                    string
			assignedAdminID       sql.NullString
			categoryID            string
			contactValue          string
			createdAt             time.Time
			details               string
			etaKey                string
			preferredChannel      string
			referenceCode         string
			relatedAppointmentID  string
			relatedProfessionalID sql.NullString
			reporterName          string
			reporterPhone         string
			reporterRole          string
			sourceSurface         string
			status                string
			summary               string
			updatedAt             time.Time
			urgency               string
		)
		if err := rows.Scan(
			&id,
			&assignedAdminID,
			&categoryID,
			&contactValue,
			&createdAt,
			&details,
			&etaKey,
			&preferredChannel,
			&referenceCode,
			&relatedAppointmentID,
			&relatedProfessionalID,
			&reporterName,
			&reporterPhone,
			&reporterRole,
			&sourceSurface,
			&status,
			&summary,
			&updatedAt,
			&urgency,
		); err != nil {
			return Record{}, err
		}

		tickets = append(tickets, map[string]any{
			"id":                    id,
			"assignedAdminId":       nullStringValue(assignedAdminID),
			"categoryId":            categoryID,
			"contactValue":          contactValue,
			"createdAt":             createdAt.UTC().Format(time.RFC3339),
			"details":               details,
			"etaKey":                etaKey,
			"preferredChannel":      preferredChannel,
			"referenceCode":         referenceCode,
			"relatedAppointmentId":  relatedAppointmentID,
			"relatedProfessionalId": nullStringValue(relatedProfessionalID),
			"reporterName":          reporterName,
			"reporterPhone":         reporterPhone,
			"reporterRole":          reporterRole,
			"sourceSurface":         sourceSurface,
			"status":                status,
			"summary":               summary,
			"updatedAt":             updatedAt.UTC().Format(time.RFC3339),
			"urgency":               urgency,
		})
	}
	if err := rows.Err(); err != nil {
		return Record{}, err
	}

	record.Snapshot = map[string]any{
		"savedAt":       record.SavedAt.UTC().Format(time.RFC3339),
		"schemaVersion": schemaVersion,
		"commandCenter": commandCenter,
		"tickets":       tickets,
	}
	return record, nil
}

func (s *PostgresStore) upsertSupportDesk(ctx context.Context, record Record) (Record, error) {
	schemaVersion := intValue(record.Snapshot["schemaVersion"], 1)
	commandCenter := mapValue(record.Snapshot["commandCenter"])
	tickets := rowsValue(record.Snapshot["tickets"])

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Record{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO admin_support_desk_states (
			document_key,
			saved_at,
			schema_version,
			command_center
		) VALUES ($1, $2, $3, $4)
		ON CONFLICT (document_key) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    schema_version = EXCLUDED.schema_version,
		    revision = admin_support_desk_states.revision + 1,
		    command_center = EXCLUDED.command_center
		`, record.Key, record.SavedAt, schemaVersion, marshalOrEmptyObject(commandCenter)); err != nil {
		return Record{}, err
	}

	ticketIDs := make([]string, 0, len(tickets))
	for index, ticket := range tickets {
		ticketID := stringValue(ticket["id"])
		if ticketID == "" {
			ticketID = fmt.Sprintf("support-ticket-%d", index+1)
		}
		ticketIDs = append(ticketIDs, ticketID)
	}
	if err := deleteMissingRows(ctx, tx, "support_tickets", "id", ticketIDs); err != nil {
		return Record{}, err
	}

	for index, ticket := range tickets {
		ticketID := stringValue(ticket["id"])
		if ticketID == "" {
			ticketID = fmt.Sprintf("support-ticket-%d", index+1)
		}

		createdAt := parseTimestampOrNow(stringValue(ticket["createdAt"]), record.SavedAt)
		updatedAt := parseTimestampOrNow(stringValue(ticket["updatedAt"]), createdAt)

		if _, err := tx.ExecContext(ctx, `
				INSERT INTO support_tickets (
					id,
					sort_index,
					assigned_admin_id,
				category_id,
				contact_value,
				created_at,
				details,
				eta_key,
				preferred_channel,
				reference_code,
				related_appointment_id,
				related_professional_id,
				reporter_name,
				reporter_phone,
				reporter_role,
				source_surface,
				status,
				summary,
				updated_at,
				urgency
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
					$11, $12, $13, $14, $15, $16, $17, $18, $19, $20
				)
				ON CONFLICT (id) DO UPDATE
				SET sort_index = EXCLUDED.sort_index,
				    assigned_admin_id = EXCLUDED.assigned_admin_id,
				    category_id = EXCLUDED.category_id,
				    contact_value = EXCLUDED.contact_value,
				    created_at = EXCLUDED.created_at,
				    details = EXCLUDED.details,
				    eta_key = EXCLUDED.eta_key,
				    preferred_channel = EXCLUDED.preferred_channel,
				    reference_code = EXCLUDED.reference_code,
				    related_appointment_id = EXCLUDED.related_appointment_id,
				    related_professional_id = EXCLUDED.related_professional_id,
				    reporter_name = EXCLUDED.reporter_name,
				    reporter_phone = EXCLUDED.reporter_phone,
				    reporter_role = EXCLUDED.reporter_role,
				    source_surface = EXCLUDED.source_surface,
				    status = EXCLUDED.status,
				    summary = EXCLUDED.summary,
				    updated_at = EXCLUDED.updated_at,
				    urgency = EXCLUDED.urgency
			`,
			ticketID,
			index,
			nilIfEmpty(stringValue(ticket["assignedAdminId"])),
			stringValue(ticket["categoryId"]),
			stringValue(ticket["contactValue"]),
			createdAt,
			stringValue(ticket["details"]),
			stringValue(ticket["etaKey"]),
			stringValue(ticket["preferredChannel"]),
			stringValue(ticket["referenceCode"]),
			stringValue(ticket["relatedAppointmentId"]),
			nilIfEmpty(stringValue(ticket["relatedProfessionalId"])),
			stringValue(ticket["reporterName"]),
			stringValue(ticket["reporterPhone"]),
			stringValue(ticket["reporterRole"]),
			stringValue(ticket["sourceSurface"]),
			stringValue(ticket["status"]),
			stringValue(ticket["summary"]),
			updatedAt,
			stringValue(ticket["urgency"]),
		); err != nil {
			return Record{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return Record{}, err
	}

	return s.readSupportDesk(ctx, record.Key)
}

func (s *PostgresStore) readAdminConsole(ctx context.Context, key string) (Record, error) {
	record := Record{
		Namespace: adminConsoleNamespace,
		Key:       key,
	}

	var (
		schemaVersion int
		stateFound    bool
	)
	err := s.db.QueryRowContext(ctx, `
		SELECT saved_at, schema_version
		FROM admin_console_states
		WHERE document_key = $1
	`, key).Scan(&record.SavedAt, &schemaVersion)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return Record{}, err
		}
	} else {
		stateFound = true
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			t.table_name,
			t.saved_at,
			t.schema_version,
			r.row_index,
			r.row_payload
		FROM admin_console_tables t
		LEFT JOIN admin_console_table_rows r
			ON r.table_name = t.table_name
		ORDER BY t.table_name ASC, r.row_index ASC
	`)
	if err != nil {
		return Record{}, err
	}
	defer rows.Close()

	tables := make(map[string][]map[string]any)
	tableFound := false
	var lastTableSavedAt time.Time
	for rows.Next() {
		tableFound = true

		var (
			tableName         string
			tableSavedAt      time.Time
			tableSchema       int
			rowIndex          sql.NullInt64
			rowPayloadBytes   []byte
			rowPayload        map[string]any
			rowPayloadPresent bool
		)
		if err := rows.Scan(&tableName, &tableSavedAt, &tableSchema, &rowIndex, &rowPayloadBytes); err != nil {
			return Record{}, err
		}
		if tableSavedAt.After(lastTableSavedAt) {
			lastTableSavedAt = tableSavedAt
		}
		if !stateFound {
			schemaVersion = tableSchema
		}

		if _, ok := tables[tableName]; !ok {
			tables[tableName] = []map[string]any{}
		}
		if rowIndex.Valid {
			decoded, err := decodeMap(rowPayloadBytes)
			if err != nil {
				return Record{}, err
			}
			rowPayload = decoded
			rowPayloadPresent = true
		}
		if rowPayloadPresent {
			tables[tableName] = append(tables[tableName], rowPayload)
		}
	}
	if err := rows.Err(); err != nil {
		return Record{}, err
	}

	if !stateFound && !tableFound {
		return Record{}, ErrNotFound
	}
	if !stateFound {
		record.SavedAt = lastTableSavedAt
		if schemaVersion == 0 {
			schemaVersion = 1
		}
	}

	record.Snapshot = map[string]any{
		"savedAt":       record.SavedAt.UTC().Format(time.RFC3339),
		"schemaVersion": schemaVersion,
		"tables":        tables,
	}
	return record, nil
}

func (s *PostgresStore) upsertAdminConsole(ctx context.Context, record Record) (Record, error) {
	schemaVersion := intValue(record.Snapshot["schemaVersion"], 1)
	tables := tableRowsValue(record.Snapshot["tables"])

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Record{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO admin_console_states (
			document_key,
			saved_at,
			schema_version
		) VALUES ($1, $2, $3)
		ON CONFLICT (document_key) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    schema_version = EXCLUDED.schema_version,
		    revision = admin_console_states.revision + 1
		`, record.Key, record.SavedAt, schemaVersion); err != nil {
		return Record{}, err
	}

	tableNames := make([]string, 0, len(tables))
	for tableName := range tables {
		tableNames = append(tableNames, tableName)
	}
	if err := deleteMissingRows(ctx, tx, "admin_console_tables", "table_name", tableNames); err != nil {
		return Record{}, err
	}

	for tableName, rows := range tables {
		if _, err := tx.ExecContext(ctx, `
				INSERT INTO admin_console_tables (
					table_name,
					saved_at,
					schema_version
				) VALUES ($1, $2, $3)
				ON CONFLICT (table_name) DO UPDATE
				SET saved_at = EXCLUDED.saved_at,
				    schema_version = EXCLUDED.schema_version,
				    revision = admin_console_tables.revision + 1
			`, tableName, record.SavedAt, schemaVersion); err != nil {
			return Record{}, err
		}
		if err := upsertAdminConsoleRows(ctx, tx, tableName, rows); err != nil {
			return Record{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return Record{}, err
	}

	return s.readAdminConsole(ctx, record.Key)
}

func (s *PostgresStore) readAdminConsoleTable(ctx context.Context, key string) (Record, error) {
	record := Record{
		Namespace: adminConsoleTableNamespace,
		Key:       key,
	}

	var schemaVersion int
	err := s.db.QueryRowContext(ctx, `
		SELECT saved_at, schema_version
		FROM admin_console_tables
		WHERE table_name = $1
	`, key).Scan(&record.SavedAt, &schemaVersion)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, ErrNotFound
		}
		return Record{}, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT row_payload
		FROM admin_console_table_rows
		WHERE table_name = $1
		ORDER BY row_index ASC
	`, key)
	if err != nil {
		return Record{}, err
	}
	defer rows.Close()

	payloadRows := make([]map[string]any, 0)
	for rows.Next() {
		var rowPayloadBytes []byte
		if err := rows.Scan(&rowPayloadBytes); err != nil {
			return Record{}, err
		}
		rowPayload, err := decodeMap(rowPayloadBytes)
		if err != nil {
			return Record{}, err
		}
		payloadRows = append(payloadRows, rowPayload)
	}
	if err := rows.Err(); err != nil {
		return Record{}, err
	}

	record.Snapshot = map[string]any{
		"tableName":     key,
		"savedAt":       record.SavedAt.UTC().Format(time.RFC3339),
		"schemaVersion": schemaVersion,
		"rows":          payloadRows,
	}
	return record, nil
}

func (s *PostgresStore) upsertAdminConsoleTable(ctx context.Context, record Record) (Record, error) {
	schemaVersion := intValue(record.Snapshot["schemaVersion"], 1)
	rows := rowsValue(record.Snapshot["rows"])

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Record{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO admin_console_tables (
			table_name,
			saved_at,
			schema_version
		) VALUES ($1, $2, $3)
		ON CONFLICT (table_name) DO UPDATE
		SET saved_at = EXCLUDED.saved_at,
		    schema_version = EXCLUDED.schema_version,
		    revision = admin_console_tables.revision + 1
	`, record.Key, record.SavedAt, schemaVersion); err != nil {
		return Record{}, err
	}

	if err := upsertAdminConsoleRows(ctx, tx, record.Key, rows); err != nil {
		return Record{}, err
	}

	if err := tx.Commit(); err != nil {
		return Record{}, err
	}

	return s.readAdminConsoleTable(ctx, record.Key)
}

func upsertAdminConsoleRows(ctx context.Context, tx *sql.Tx, tableName string, rows []map[string]any) error {
	for index, row := range rows {
		if _, err := tx.ExecContext(ctx, `
				INSERT INTO admin_console_table_rows (
					table_name,
					row_index,
					row_payload
				) VALUES ($1, $2, $3)
				ON CONFLICT (table_name, row_index) DO UPDATE
				SET row_payload = EXCLUDED.row_payload
			`, tableName, index, marshalOrEmptyObject(row)); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, `
			DELETE FROM admin_console_table_rows
			WHERE table_name = $1
			  AND row_index >= $2
		`, tableName, len(rows)); err != nil {
		return err
	}

	return nil
}

func deleteMissingRows(ctx context.Context, tx *sql.Tx, tableName string, keyColumn string, values []string) error {
	if len(values) == 0 {
		_, err := tx.ExecContext(ctx, fmt.Sprintf(`DELETE FROM %s`, tableName))
		return err
	}

	args := make([]any, 0, len(values))
	placeholders := make([]string, 0, len(values))
	for index, value := range values {
		args = append(args, value)
		placeholders = append(placeholders, fmt.Sprintf("$%d", index+1))
	}

	query := fmt.Sprintf(
		`DELETE FROM %s WHERE %s NOT IN (%s)`,
		tableName,
		keyColumn,
		strings.Join(placeholders, ", "),
	)
	_, err := tx.ExecContext(ctx, query, args...)
	return err
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

func mapValue(value any) map[string]any {
	return decodeValue(value, map[string]any{})
}

func rowsValue(value any) []map[string]any {
	return decodeValue(value, []map[string]any{})
}

func tableRowsValue(value any) map[string][]map[string]any {
	return decodeValue(value, map[string][]map[string]any{})
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

func stringValue(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case nil:
		return ""
	default:
		return fmt.Sprint(typed)
	}
}

func intValue(value any, fallback int) int {
	switch typed := value.(type) {
	case int:
		return typed
	case int32:
		return int(typed)
	case int64:
		return int(typed)
	case float32:
		return int(typed)
	case float64:
		return int(typed)
	default:
		return fallback
	}
}

func parseTimestampOrNow(value string, fallback time.Time) time.Time {
	timestamp := strings.TrimSpace(value)
	if timestamp != "" {
		if parsed, err := time.Parse(time.RFC3339, timestamp); err == nil {
			return parsed.UTC()
		}
	}
	if !fallback.IsZero() {
		return fallback.UTC()
	}
	return time.Now().UTC()
}

func nilIfEmpty(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func nullStringValue(value sql.NullString) string {
	if !value.Valid {
		return ""
	}
	return value.String
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
