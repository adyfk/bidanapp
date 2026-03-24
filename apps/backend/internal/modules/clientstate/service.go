package clientstate

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"bidanapp/apps/backend/internal/platform/documentstore"
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
	defaultDocumentKey                 = "default"
	adminConsoleSchemaVersion          = 1
)

var (
	errInvalidAdminConsoleTable = errors.New("invalid admin console table")
	adminConsoleTableNames      = []string{
		"admin_staff",
		"app_runtime_selections",
		"appointments",
		"consumers",
		"home_feed_snapshots",
		"professional_service_offerings",
		"professionals",
		"reference_appointment_statuses",
		"service_categories",
		"services",
		"user_contexts",
	}
	adminConsoleTableNameSet = func() map[string]struct{} {
		values := make(map[string]struct{}, len(adminConsoleTableNames))
		for _, tableName := range adminConsoleTableNames {
			values[tableName] = struct{}{}
		}
		return values
	}()
)

type Service struct {
	store documentstore.Store
}

func NewService(store documentstore.Store) *Service {
	return &Service{store: store}
}

func (s *Service) ViewerSession(ctx context.Context) (ViewerSessionData, error) {
	return readSnapshot(ctx, s.store, viewerSessionNamespace, defaultDocumentKey, ViewerSessionData{
		Mode: "visitor",
	})
}

func (s *Service) UpsertViewerSession(ctx context.Context, input ViewerSessionData) (ViewerSessionData, error) {
	if input.Mode == "" {
		input.Mode = "visitor"
	}
	return upsertSnapshot(ctx, s.store, viewerSessionNamespace, defaultDocumentKey, input)
}

func (s *Service) CustomerNotifications(ctx context.Context, consumerID string) (CustomerNotificationStateData, error) {
	return readSnapshot(ctx, s.store, customerNotificationsNamespace, consumerDocumentKey(consumerID), CustomerNotificationStateData{
		ReadIDs: []string{},
	})
}

func (s *Service) UpsertCustomerNotifications(ctx context.Context, input CustomerNotificationStateData, consumerID string) (CustomerNotificationStateData, error) {
	if input.ReadIDs == nil {
		input.ReadIDs = []string{}
	}
	return upsertSnapshot(ctx, s.store, customerNotificationsNamespace, consumerDocumentKey(consumerID), input)
}

func (s *Service) ProfessionalNotifications(ctx context.Context, professionalID string) (ProfessionalNotificationStateData, error) {
	return readSnapshot(ctx, s.store, professionalNotificationsNamespace, professionalDocumentKey(professionalID), ProfessionalNotificationStateData{
		ReadIDsByProfessional: map[string][]string{},
	})
}

func (s *Service) UpsertProfessionalNotifications(ctx context.Context, input ProfessionalNotificationStateData, professionalID string) (ProfessionalNotificationStateData, error) {
	if input.ReadIDsByProfessional == nil {
		input.ReadIDsByProfessional = map[string][]string{}
	}
	return upsertSnapshot(ctx, s.store, professionalNotificationsNamespace, professionalDocumentKey(professionalID), input)
}

func (s *Service) ConsumerPreferences(ctx context.Context, consumerID string) (ConsumerPreferencesData, error) {
	return readSnapshot(ctx, s.store, consumerPreferencesNamespace, consumerDocumentKey(consumerID), ConsumerPreferencesData{
		ConsumerID:              consumerID,
		FavoriteProfessionalIDs: []string{},
	})
}

func (s *Service) UpsertConsumerPreferences(ctx context.Context, input ConsumerPreferencesData, consumerID string) (ConsumerPreferencesData, error) {
	if input.ConsumerID == "" {
		input.ConsumerID = consumerID
	}
	if input.FavoriteProfessionalIDs == nil {
		input.FavoriteProfessionalIDs = []string{}
	}
	return upsertSnapshot(ctx, s.store, consumerPreferencesNamespace, consumerDocumentKey(consumerID), input)
}

func (s *Service) AdminSession(ctx context.Context) (AdminSessionData, error) {
	return readSnapshot(ctx, s.store, adminSessionNamespace, defaultDocumentKey, AdminSessionData{
		FocusArea: "support",
	})
}

func (s *Service) UpsertAdminSession(ctx context.Context, input AdminSessionData) (AdminSessionData, error) {
	if input.FocusArea == "" {
		input.FocusArea = "support"
	}
	return upsertSnapshot(ctx, s.store, adminSessionNamespace, defaultDocumentKey, input)
}

func (s *Service) SupportDesk(ctx context.Context) (SupportDeskData, error) {
	return readSnapshot(ctx, s.store, adminSupportDeskNamespace, defaultDocumentKey, SupportDeskData{
		Tickets: []SupportTicketData{},
	})
}

func (s *Service) UpsertSupportDesk(ctx context.Context, input SupportDeskData) (SupportDeskData, error) {
	if input.Tickets == nil {
		input.Tickets = []SupportTicketData{}
	}
	if input.SavedAt == "" {
		input.SavedAt = time.Now().UTC().Format(time.RFC3339)
	}
	return upsertSnapshot(ctx, s.store, adminSupportDeskNamespace, defaultDocumentKey, input)
}

func (s *Service) AdminConsole(ctx context.Context) (AdminConsoleData, error) {
	return readSnapshot(ctx, s.store, adminConsoleNamespace, defaultDocumentKey, AdminConsoleData{
		Tables: map[string][]map[string]any{},
	})
}

func (s *Service) UpsertAdminConsole(ctx context.Context, input AdminConsoleData) (AdminConsoleData, error) {
	if input.Tables == nil {
		input.Tables = map[string][]map[string]any{}
	}
	if input.SavedAt == "" {
		input.SavedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if input.SchemaVersion == 0 {
		input.SchemaVersion = adminConsoleSchemaVersion
	}

	payload, err := upsertSnapshot(ctx, s.store, adminConsoleNamespace, defaultDocumentKey, input)
	if err != nil {
		return input, err
	}

	if err := s.syncAdminConsoleTablesFromSnapshot(ctx, payload); err != nil {
		return payload, err
	}

	return payload, nil
}

func (s *Service) AdminConsoleTable(ctx context.Context, tableName string) (AdminConsoleTableData, error) {
	if err := validateAdminConsoleTableName(tableName); err != nil {
		return AdminConsoleTableData{}, err
	}

	fallback := AdminConsoleTableData{
		TableName: tableName,
		Rows:      []map[string]any{},
	}
	if s.store == nil {
		return fallback, nil
	}

	record, err := s.store.Read(ctx, adminConsoleTableNamespace, tableName)
	if err == nil {
		payload, decodeErr := decodeSnapshot[AdminConsoleTableData](record.Snapshot)
		if decodeErr != nil {
			return fallback, decodeErr
		}
		if payload.TableName == "" {
			payload.TableName = tableName
		}
		if payload.Rows == nil {
			payload.Rows = []map[string]any{}
		}
		return payload, nil
	}
	if !errors.Is(err, documentstore.ErrNotFound) {
		return fallback, err
	}

	aggregate, err := s.AdminConsole(ctx)
	if err != nil {
		return fallback, err
	}

	rows := aggregate.Tables[tableName]
	if rows == nil {
		rows = []map[string]any{}
	}

	return AdminConsoleTableData{
		TableName:     tableName,
		SavedAt:       aggregate.SavedAt,
		SchemaVersion: aggregate.SchemaVersion,
		Rows:          rows,
	}, nil
}

func (s *Service) UpsertAdminConsoleTable(
	ctx context.Context,
	tableName string,
	input AdminConsoleTableUpsertData,
) (AdminConsoleTableData, error) {
	if err := validateAdminConsoleTableName(tableName); err != nil {
		return AdminConsoleTableData{}, err
	}

	payload := AdminConsoleTableData{
		TableName:     tableName,
		SavedAt:       input.SavedAt,
		SchemaVersion: input.SchemaVersion,
		Rows:          normalizeAdminConsoleRows(input.Rows),
	}
	if payload.SavedAt == "" {
		payload.SavedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if payload.SchemaVersion == 0 {
		payload.SchemaVersion = adminConsoleSchemaVersion
	}

	if _, err := s.upsertAdminConsoleTableRecord(ctx, payload); err != nil {
		return payload, err
	}

	aggregate, err := s.AdminConsole(ctx)
	if err != nil {
		return payload, err
	}
	if aggregate.Tables == nil {
		aggregate.Tables = map[string][]map[string]any{}
	}
	if aggregate.SchemaVersion == 0 {
		aggregate.SchemaVersion = payload.SchemaVersion
	}
	aggregate.Tables[tableName] = payload.Rows
	aggregate.SavedAt = payload.SavedAt

	if _, err := upsertSnapshot(ctx, s.store, adminConsoleNamespace, defaultDocumentKey, aggregate); err != nil {
		return payload, err
	}

	return payload, nil
}

func consumerDocumentKey(consumerID string) string {
	if consumerID == "" {
		return defaultDocumentKey
	}
	return consumerID
}

func professionalDocumentKey(professionalID string) string {
	if professionalID == "" {
		return defaultDocumentKey
	}
	return professionalID
}

func validateAdminConsoleTableName(tableName string) error {
	if _, ok := adminConsoleTableNameSet[tableName]; !ok {
		return fmt.Errorf("%w: %s", errInvalidAdminConsoleTable, tableName)
	}

	return nil
}

func normalizeAdminConsoleRows(rows []map[string]any) []map[string]any {
	if rows == nil {
		return []map[string]any{}
	}

	return rows
}

func (s *Service) upsertAdminConsoleTableRecord(ctx context.Context, payload AdminConsoleTableData) (AdminConsoleTableData, error) {
	if s.store == nil {
		return payload, nil
	}

	snapshot, err := toSnapshotMap(payload)
	if err != nil {
		return payload, err
	}

	record, err := s.store.Upsert(ctx, documentstore.Record{
		Namespace: adminConsoleTableNamespace,
		Key:       payload.TableName,
		SavedAt:   time.Now().UTC(),
		Snapshot:  snapshot,
	})
	if err != nil {
		return payload, err
	}

	decoded, err := decodeSnapshot[AdminConsoleTableData](record.Snapshot)
	if err != nil {
		return payload, err
	}
	if decoded.TableName == "" {
		decoded.TableName = payload.TableName
	}
	if decoded.Rows == nil {
		decoded.Rows = []map[string]any{}
	}

	return decoded, nil
}

func (s *Service) syncAdminConsoleTablesFromSnapshot(ctx context.Context, snapshot AdminConsoleData) error {
	if s.store == nil {
		return nil
	}

	for _, tableName := range adminConsoleTableNames {
		rows := normalizeAdminConsoleRows(snapshot.Tables[tableName])
		if _, err := s.upsertAdminConsoleTableRecord(ctx, AdminConsoleTableData{
			TableName:     tableName,
			SavedAt:       snapshot.SavedAt,
			SchemaVersion: snapshot.SchemaVersion,
			Rows:          rows,
		}); err != nil {
			return err
		}
	}

	return nil
}

func readSnapshot[T any](ctx context.Context, store documentstore.Store, namespace string, key string, fallback T) (T, error) {
	if store == nil {
		return fallback, nil
	}

	record, err := store.Read(ctx, namespace, key)
	if err != nil {
		if errors.Is(err, documentstore.ErrNotFound) {
			return fallback, nil
		}
		return fallback, err
	}

	rawValue, err := json.Marshal(record.Snapshot)
	if err != nil {
		return fallback, err
	}

	if len(rawValue) == 0 || string(rawValue) == "null" {
		return fallback, nil
	}

	var payload T
	if err := json.Unmarshal(rawValue, &payload); err != nil {
		return fallback, err
	}

	return payload, nil
}

func upsertSnapshot[T any](ctx context.Context, store documentstore.Store, namespace string, key string, input T) (T, error) {
	if store == nil {
		return input, nil
	}

	snapshot, err := toSnapshotMap(input)
	if err != nil {
		return input, err
	}

	_, err = store.Upsert(ctx, documentstore.Record{
		Namespace: namespace,
		Key:       key,
		SavedAt:   time.Now().UTC(),
		Snapshot:  snapshot,
	})
	if err != nil {
		return input, err
	}

	return input, nil
}

func toSnapshotMap(value any) (map[string]any, error) {
	rawValue, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}

	snapshot := map[string]any{}
	if len(rawValue) == 0 || string(rawValue) == "null" {
		return snapshot, nil
	}

	if err := json.Unmarshal(rawValue, &snapshot); err != nil {
		return nil, err
	}

	return snapshot, nil
}

func decodeSnapshot[T any](snapshot map[string]any) (T, error) {
	var payload T

	rawValue, err := json.Marshal(snapshot)
	if err != nil {
		return payload, err
	}

	if len(rawValue) == 0 || string(rawValue) == "null" {
		return payload, nil
	}

	if err := json.Unmarshal(rawValue, &payload); err != nil {
		return payload, err
	}

	return payload, nil
}
