package clientstate

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/pushstore"
)

const (
	viewerSessionNamespace             = "viewer_session"
	customerNotificationsNamespace     = "customer_notifications"
	professionalNotificationsNamespace = "professional_notifications"
	consumerPreferencesNamespace       = "consumer_preferences"
	adminSessionNamespace              = "admin_session"
	adminSupportDeskNamespace          = "admin_support_desk"
	supportTicketsNamespace            = "support_tickets"
	adminConsoleNamespace              = "admin_console"
	adminConsoleTableNamespace         = "admin_console_table"
	defaultDocumentKey                 = "default"
	adminConsoleSchemaVersion          = 1
	supportDeskSchemaVersion           = 1
	adminConsolePublishedNamespace     = "published_readmodel"
)

var (
	errInvalidAdminConsoleTable = errors.New("invalid admin console table")
	errInvalidCustomerPushSubscription = errors.New("invalid customer push subscription")
	errInvalidSupportDesk       = errors.New("invalid support desk payload")
	errInvalidSupportTicket     = errors.New("invalid support ticket payload")
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
	adminConsoleTableFiles = map[string]string{
		"admin_staff":                    "admin_staff.json",
		"app_runtime_selections":         "app_runtime_selections.json",
		"appointments":                   "appointments.json",
		"consumers":                      "consumers.json",
		"home_feed_snapshots":            "home_feed_snapshots.json",
		"professional_service_offerings": "professional_service_offerings.json",
		"professionals":                  "professionals.json",
		"reference_appointment_statuses": "reference_appointment_statuses.json",
		"service_categories":             "service_categories.json",
		"services":                       "services.json",
		"user_contexts":                  "user_contexts.json",
	}
	supportAllowedReporterRoles = map[string]struct{}{
		"customer":     {},
		"professional": {},
	}
	supportAllowedChannels = map[string]struct{}{
		"call":     {},
		"email":    {},
		"whatsapp": {},
	}
	supportAllowedUrgencies = map[string]struct{}{
		"normal": {},
		"high":   {},
		"urgent": {},
	}
	supportAllowedStatuses = map[string]struct{}{
		"new":       {},
		"triaged":   {},
		"reviewing": {},
		"resolved":  {},
		"refunded":  {},
	}
	supportAllowedSourceSurfaces = map[string]struct{}{
		"admin_manual":         {},
		"profile_customer":     {},
		"profile_professional": {},
	}
	supportAllowedCustomerCategories = map[string]struct{}{
		"accountAccess":      {},
		"other":              {},
		"paymentIssue":       {},
		"refundRequest":      {},
		"reportProfessional": {},
		"serviceComplaint":   {},
	}
	supportAllowedProfessionalCategories = map[string]struct{}{
		"accountAccess":       {},
		"other":               {},
		"refundClarification": {},
		"reportCustomer":      {},
		"serviceDispute":      {},
		"technicalIssue":      {},
	}
)

type Service struct {
	store        documentstore.Store
	contentStore contentstore.Store
	pushStore    pushstore.Store
}

func NewService(store documentstore.Store, pushStore pushstore.Store, contentStores ...contentstore.Store) *Service {
	var readModelContentStore contentstore.Store
	if len(contentStores) > 0 {
		readModelContentStore = contentStores[0]
	}

	return &Service{
		store:        store,
		contentStore: readModelContentStore,
		pushStore:    pushStore,
	}
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

func (s *Service) UpsertCustomerPushSubscription(
	ctx context.Context,
	input CustomerPushSubscriptionData,
	consumerID string,
) (CustomerPushSubscriptionData, error) {
	if s.pushStore == nil {
		return CustomerPushSubscriptionData{}, errInvalidCustomerPushSubscription
	}

	normalized, err := normalizeCustomerPushSubscription(input)
	if err != nil {
		return CustomerPushSubscriptionData{}, err
	}

	_, err = s.pushStore.UpsertCustomerSubscription(ctx, pushstore.CustomerSubscription{
		Endpoint:   normalized.Endpoint,
		ConsumerID: consumerID,
		P256DHKey:  normalized.Keys.P256DH,
		AuthKey:    normalized.Keys.Auth,
		Locale:     normalized.Locale,
		UserAgent:  normalized.UserAgent,
		UpdatedAt:  time.Now().UTC(),
	})
	if err != nil {
		return CustomerPushSubscriptionData{}, err
	}

	return normalized, nil
}

func (s *Service) DeleteCustomerPushSubscription(
	ctx context.Context,
	input CustomerPushSubscriptionData,
	consumerID string,
) error {
	if s.pushStore == nil {
		return errInvalidCustomerPushSubscription
	}

	normalized, err := normalizeCustomerPushSubscription(input)
	if err != nil {
		return err
	}

	err = s.pushStore.DeleteCustomerSubscription(ctx, consumerID, normalized.Endpoint)
	if errors.Is(err, pushstore.ErrNotFound) {
		return nil
	}
	return err
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
	commandCenterState, err := readSnapshot(
		ctx,
		s.store,
		adminSupportDeskNamespace,
		defaultDocumentKey,
		SupportDeskData{
			CommandCenter: defaultSupportCommandCenterState(),
			SchemaVersion: supportDeskSchemaVersion,
			Tickets:       []SupportTicketData{},
		},
	)
	if err != nil {
		return SupportDeskData{}, err
	}

	ticketState, err := s.readSupportTickets(ctx)
	if err != nil {
		return SupportDeskData{}, err
	}

	savedAt := ticketState.SavedAt
	if parseRFC3339OrZero(commandCenterState.SavedAt).After(parseRFC3339OrZero(savedAt)) {
		savedAt = commandCenterState.SavedAt
	}
	if savedAt == "" {
		savedAt = time.Now().UTC().Format(time.RFC3339)
	}

	return SupportDeskData{
		CommandCenter: normalizeSupportCommandCenter(commandCenterState.CommandCenter),
		SavedAt:       savedAt,
		SchemaVersion: supportDeskSchemaVersion,
		Tickets:       sortSupportTickets(ticketState.Tickets),
	}, nil
}

func (s *Service) UpsertSupportDesk(ctx context.Context, input SupportDeskData) (SupportDeskData, error) {
	if input.Tickets == nil {
		input.Tickets = []SupportTicketData{}
	}
	if input.SavedAt == "" {
		input.SavedAt = time.Now().UTC().Format(time.RFC3339)
	}
	normalized, err := normalizeSupportDeskData(input)
	if err != nil {
		return SupportDeskData{}, err
	}

	adminSnapshot := SupportDeskData{
		CommandCenter: normalized.CommandCenter,
		SavedAt:       normalized.SavedAt,
		SchemaVersion: normalized.SchemaVersion,
		Tickets:       []SupportTicketData{},
	}
	if _, err := upsertSnapshot(ctx, s.store, adminSupportDeskNamespace, defaultDocumentKey, adminSnapshot); err != nil {
		return SupportDeskData{}, err
	}

	if _, err := s.upsertSupportTickets(ctx, SupportTicketsData{
		SavedAt:       normalized.SavedAt,
		SchemaVersion: normalized.SchemaVersion,
		Tickets:       normalized.Tickets,
	}); err != nil {
		return SupportDeskData{}, err
	}

	return normalized, nil
}

func (s *Service) SupportTicketsByReporter(
	ctx context.Context,
	reporterRole string,
	reporterID string,
) (SupportTicketsData, error) {
	payload, err := s.readSupportTickets(ctx)
	if err != nil {
		return SupportTicketsData{}, err
	}

	filtered := make([]SupportTicketData, 0, len(payload.Tickets))
	for _, ticket := range payload.Tickets {
		if ticket.ReporterRole == reporterRole && ticket.ReporterID == reporterID {
			filtered = append(filtered, ticket)
		}
	}
	payload.Tickets = sortSupportTickets(filtered)

	return payload, nil
}

func (s *Service) CreateSupportTicket(
	ctx context.Context,
	reporterRole string,
	reporterID string,
	input CreateSupportTicketData,
) (SupportTicketData, error) {
	if _, ok := supportAllowedReporterRoles[reporterRole]; !ok {
		return SupportTicketData{}, errInvalidSupportTicket
	}
	if strings.TrimSpace(reporterID) == "" {
		return SupportTicketData{}, errInvalidSupportTicket
	}

	payload, err := s.readSupportTickets(ctx)
	if err != nil {
		return SupportTicketData{}, err
	}

	now := time.Now().UTC()
	timestamp := now.Format(time.RFC3339)
	ticket, err := normalizeSupportTicket(SupportTicketData{
		CategoryID:            input.CategoryID,
		ContactValue:          input.ContactValue,
		CreatedAt:             timestamp,
		Details:               input.Details,
		EtaKey:                input.Urgency,
		ID:                    nextSupportTicketID(reporterRole, now),
		PreferredChannel:      input.PreferredChannel,
		ReferenceCode:         input.ReferenceCode,
		RelatedAppointmentID:  input.RelatedAppointmentID,
		RelatedProfessionalID: input.RelatedProfessionalID,
		ReporterID:            reporterID,
		ReporterName:          input.ReporterName,
		ReporterPhone:         input.ReporterPhone,
		ReporterRole:          reporterRole,
		SourceSurface:         input.SourceSurface,
		Status:                "new",
		Summary:               input.Summary,
		UpdatedAt:             timestamp,
		Urgency:               input.Urgency,
	}, timestamp)
	if err != nil {
		return SupportTicketData{}, err
	}

	payload.SavedAt = timestamp
	payload.SchemaVersion = supportDeskSchemaVersion
	payload.Tickets = sortSupportTickets(append(payload.Tickets, ticket))
	if _, err := s.upsertSupportTickets(ctx, payload); err != nil {
		return SupportTicketData{}, err
	}

	return ticket, nil
}

func (s *Service) AdminConsole(ctx context.Context) (AdminConsoleData, error) {
	payload, err := readSnapshot(ctx, s.store, adminConsoleNamespace, defaultDocumentKey, AdminConsoleData{
		Tables: map[string][]map[string]any{},
	})
	if err != nil {
		return AdminConsoleData{}, err
	}
	if payload.Tables == nil {
		payload.Tables = map[string][]map[string]any{}
	}
	if payload.SchemaVersion == 0 {
		payload.SchemaVersion = adminConsoleSchemaVersion
	}

	latestSavedAt := payload.SavedAt
	for _, tableName := range adminConsoleTableNames {
		rows, tableSavedAt, found, readErr := s.readAdminConsoleTableRowsFromContentStore(ctx, tableName)
		if readErr != nil {
			return AdminConsoleData{}, readErr
		}
		if !found {
			if _, ok := payload.Tables[tableName]; !ok {
				payload.Tables[tableName] = []map[string]any{}
			}
			continue
		}

		payload.Tables[tableName] = rows
		if latestSavedAt == "" || tableSavedAt.After(parseRFC3339OrZero(latestSavedAt)) {
			latestSavedAt = tableSavedAt.UTC().Format(time.RFC3339)
		}
	}
	if payload.SavedAt == "" {
		payload.SavedAt = latestSavedAt
	}
	return payload, nil
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
	if payload, found, err := s.readAdminConsoleTableFromContentStore(ctx, tableName); err != nil {
		return fallback, err
	} else if found {
		return payload, nil
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
	if err := s.syncAdminConsoleTableToContentStore(ctx, payload); err != nil {
		return payload, err
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

func defaultSupportCommandCenterState() AdminCommandCenterStateData {
	return AdminCommandCenterStateData{
		FocusArea: "support",
	}
}

func defaultSupportTicketsData() SupportTicketsData {
	return SupportTicketsData{
		SchemaVersion: supportDeskSchemaVersion,
		Tickets:       []SupportTicketData{},
	}
}

func normalizeSupportCommandCenter(input AdminCommandCenterStateData) AdminCommandCenterStateData {
	if input.FocusArea == "" {
		input.FocusArea = "support"
	}
	return input
}

func sortSupportTickets(tickets []SupportTicketData) []SupportTicketData {
	nextTickets := append([]SupportTicketData(nil), tickets...)
	sort.SliceStable(nextTickets, func(leftIndex int, rightIndex int) bool {
		leftTicket := nextTickets[leftIndex]
		rightTicket := nextTickets[rightIndex]

		leftCreatedAt := parseRFC3339OrZero(leftTicket.CreatedAt)
		rightCreatedAt := parseRFC3339OrZero(rightTicket.CreatedAt)
		if !leftCreatedAt.Equal(rightCreatedAt) {
			return rightCreatedAt.Before(leftCreatedAt)
		}

		return rightTicket.ID < leftTicket.ID
	})
	return nextTickets
}

func nextSupportTicketID(reporterRole string, createdAt time.Time) string {
	prefix := "SUP-PRO"
	if reporterRole == "customer" {
		prefix = "SUP-CUS"
	}

	return fmt.Sprintf("%s-%d", prefix, createdAt.UnixNano())
}

func (s *Service) readSupportTickets(ctx context.Context) (SupportTicketsData, error) {
	payload, err := readSnapshot(ctx, s.store, supportTicketsNamespace, defaultDocumentKey, defaultSupportTicketsData())
	if err != nil {
		return SupportTicketsData{}, err
	}

	return normalizeSupportTicketsData(payload)
}

func (s *Service) upsertSupportTickets(ctx context.Context, input SupportTicketsData) (SupportTicketsData, error) {
	normalized, err := normalizeSupportTicketsData(input)
	if err != nil {
		return SupportTicketsData{}, err
	}

	return upsertSnapshot(ctx, s.store, supportTicketsNamespace, defaultDocumentKey, normalized)
}

func validateAdminConsoleTableName(tableName string) error {
	if _, ok := adminConsoleTableNameSet[tableName]; !ok {
		return fmt.Errorf("%w: %s", errInvalidAdminConsoleTable, tableName)
	}

	return nil
}

func normalizeCustomerPushSubscription(input CustomerPushSubscriptionData) (CustomerPushSubscriptionData, error) {
	normalized := CustomerPushSubscriptionData{
		Endpoint: strings.TrimSpace(input.Endpoint),
		Keys: CustomerPushSubscriptionKeysData{
			Auth:   strings.TrimSpace(input.Keys.Auth),
			P256DH: strings.TrimSpace(input.Keys.P256DH),
		},
		Locale:    strings.ToLower(strings.TrimSpace(input.Locale)),
		UserAgent: strings.TrimSpace(input.UserAgent),
	}

	if normalized.Endpoint == "" || normalized.Keys.Auth == "" || normalized.Keys.P256DH == "" {
		return CustomerPushSubscriptionData{}, errInvalidCustomerPushSubscription
	}
	if normalized.Locale == "" {
		normalized.Locale = "id"
	}
	if normalized.Locale != "id" && normalized.Locale != "en" {
		normalized.Locale = "id"
	}

	return normalized, nil
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
	if s.store == nil && s.contentStore == nil {
		return nil
	}

	for _, tableName := range adminConsoleTableNames {
		rows := normalizeAdminConsoleRows(snapshot.Tables[tableName])
		payload := AdminConsoleTableData{
			TableName:     tableName,
			SavedAt:       snapshot.SavedAt,
			SchemaVersion: snapshot.SchemaVersion,
			Rows:          rows,
		}
		if err := s.syncAdminConsoleTableToContentStore(ctx, payload); err != nil {
			return err
		}
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

func (s *Service) syncAdminConsoleTableToContentStore(ctx context.Context, payload AdminConsoleTableData) error {
	if s.contentStore == nil {
		return nil
	}

	fileName, ok := adminConsoleTableFiles[payload.TableName]
	if !ok {
		return nil
	}

	rows := normalizeAdminConsoleRows(payload.Rows)
	rawRows, err := json.Marshal(rows)
	if err != nil {
		return err
	}

	savedAt := time.Now().UTC()
	if payload.SavedAt != "" {
		if parsedSavedAt, parseErr := time.Parse(time.RFC3339, payload.SavedAt); parseErr == nil {
			savedAt = parsedSavedAt.UTC()
		}
	}

	_, err = s.contentStore.Upsert(ctx, contentstore.Record{
		Namespace: adminConsolePublishedNamespace,
		Key:       fileName,
		SavedAt:   savedAt,
		Payload:   rawRows,
	})
	return err
}

func (s *Service) readAdminConsoleTableFromContentStore(
	ctx context.Context,
	tableName string,
) (AdminConsoleTableData, bool, error) {
	rows, savedAt, found, err := s.readAdminConsoleTableRowsFromContentStore(ctx, tableName)
	if err != nil || !found {
		return AdminConsoleTableData{}, found, err
	}

	schemaVersion, metadataSavedAt := s.readAdminConsoleMetadata(ctx)
	if schemaVersion == 0 {
		schemaVersion = adminConsoleSchemaVersion
	}
	if metadataSavedAt.After(savedAt) {
		savedAt = metadataSavedAt
	}

	return AdminConsoleTableData{
		TableName:     tableName,
		SavedAt:       savedAt.UTC().Format(time.RFC3339),
		SchemaVersion: schemaVersion,
		Rows:          rows,
	}, true, nil
}

func (s *Service) readAdminConsoleTableRowsFromContentStore(
	ctx context.Context,
	tableName string,
) ([]map[string]any, time.Time, bool, error) {
	if s.contentStore == nil {
		return nil, time.Time{}, false, nil
	}

	fileName, ok := adminConsoleTableFiles[tableName]
	if !ok {
		return nil, time.Time{}, false, nil
	}

	record, err := s.contentStore.Read(ctx, adminConsolePublishedNamespace, fileName)
	if err != nil {
		if errors.Is(err, contentstore.ErrNotFound) {
			return nil, time.Time{}, false, nil
		}
		return nil, time.Time{}, false, err
	}

	rows := []map[string]any{}
	if len(record.Payload) != 0 && string(record.Payload) != "null" {
		if err := json.Unmarshal(record.Payload, &rows); err != nil {
			return nil, time.Time{}, false, err
		}
	}
	if rows == nil {
		rows = []map[string]any{}
	}

	return rows, record.SavedAt, true, nil
}

func (s *Service) readAdminConsoleMetadata(ctx context.Context) (schemaVersion int, savedAt time.Time) {
	if s.store == nil {
		return adminConsoleSchemaVersion, time.Time{}
	}

	record, err := s.store.Read(ctx, adminConsoleNamespace, defaultDocumentKey)
	if err != nil {
		return adminConsoleSchemaVersion, time.Time{}
	}

	payload, err := decodeSnapshot[AdminConsoleData](record.Snapshot)
	if err != nil {
		return adminConsoleSchemaVersion, time.Time{}
	}

	if payload.SchemaVersion != 0 {
		schemaVersion = payload.SchemaVersion
	} else {
		schemaVersion = adminConsoleSchemaVersion
	}

	if payload.SavedAt != "" {
		savedAt = parseRFC3339OrZero(payload.SavedAt)
	} else {
		savedAt = record.SavedAt
	}
	return schemaVersion, savedAt
}

func parseRFC3339OrZero(value string) time.Time {
	if value == "" {
		return time.Time{}
	}

	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}
	}
	return parsed.UTC()
}

func normalizeSupportTicketsData(input SupportTicketsData) (SupportTicketsData, error) {
	if input.Tickets == nil {
		input.Tickets = []SupportTicketData{}
	}
	if input.SavedAt == "" {
		input.SavedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if input.SchemaVersion == 0 {
		input.SchemaVersion = supportDeskSchemaVersion
	}

	input.SavedAt = normalizeRFC3339OrNow(input.SavedAt, time.Now().UTC())
	for index := range input.Tickets {
		normalizedTicket, err := normalizeSupportTicket(input.Tickets[index], input.SavedAt)
		if err != nil {
			return SupportTicketsData{}, err
		}
		input.Tickets[index] = normalizedTicket
	}
	input.Tickets = sortSupportTickets(input.Tickets)
	return input, nil
}

func normalizeSupportDeskData(input SupportDeskData) (SupportDeskData, error) {
	normalizedTickets, err := normalizeSupportTicketsData(SupportTicketsData{
		SavedAt:       input.SavedAt,
		SchemaVersion: input.SchemaVersion,
		Tickets:       input.Tickets,
	})
	if err != nil {
		return SupportDeskData{}, err
	}

	return SupportDeskData{
		CommandCenter: normalizeSupportCommandCenter(input.CommandCenter),
		SavedAt:       normalizedTickets.SavedAt,
		SchemaVersion: normalizedTickets.SchemaVersion,
		Tickets:       normalizedTickets.Tickets,
	}, nil
}

func normalizeSupportTicket(ticket SupportTicketData, fallbackTimestamp string) (SupportTicketData, error) {
	ticket.ID = strings.TrimSpace(ticket.ID)
	ticket.CategoryID = strings.TrimSpace(ticket.CategoryID)
	ticket.ContactValue = strings.TrimSpace(ticket.ContactValue)
	ticket.Details = strings.TrimSpace(ticket.Details)
	ticket.EtaKey = strings.TrimSpace(ticket.EtaKey)
	ticket.PreferredChannel = strings.TrimSpace(ticket.PreferredChannel)
	ticket.ReferenceCode = strings.TrimSpace(ticket.ReferenceCode)
	ticket.RelatedAppointmentID = strings.TrimSpace(ticket.RelatedAppointmentID)
	ticket.RelatedProfessionalID = strings.TrimSpace(ticket.RelatedProfessionalID)
	ticket.ReporterID = strings.TrimSpace(ticket.ReporterID)
	ticket.ReporterName = strings.TrimSpace(ticket.ReporterName)
	ticket.ReporterPhone = strings.TrimSpace(ticket.ReporterPhone)
	ticket.ReporterRole = strings.TrimSpace(ticket.ReporterRole)
	ticket.SourceSurface = strings.TrimSpace(ticket.SourceSurface)
	ticket.Status = strings.TrimSpace(ticket.Status)
	ticket.Summary = strings.TrimSpace(ticket.Summary)
	ticket.Urgency = strings.TrimSpace(ticket.Urgency)

	if ticket.ID == "" {
		return SupportTicketData{}, fmt.Errorf("%w: id", errInvalidSupportDesk)
	}
	if ticket.ReporterName == "" || ticket.ReporterPhone == "" || ticket.Summary == "" || ticket.Details == "" {
		return SupportTicketData{}, fmt.Errorf("%w: missing required support ticket fields", errInvalidSupportDesk)
	}
	if !isAllowedValue(ticket.ReporterRole, supportAllowedReporterRoles) {
		return SupportTicketData{}, fmt.Errorf("%w: reporterRole", errInvalidSupportDesk)
	}
	if !isAllowedValue(ticket.PreferredChannel, supportAllowedChannels) {
		return SupportTicketData{}, fmt.Errorf("%w: preferredChannel", errInvalidSupportDesk)
	}
	if !isAllowedValue(ticket.Urgency, supportAllowedUrgencies) {
		return SupportTicketData{}, fmt.Errorf("%w: urgency", errInvalidSupportDesk)
	}
	if !isAllowedValue(ticket.EtaKey, supportAllowedUrgencies) {
		return SupportTicketData{}, fmt.Errorf("%w: etaKey", errInvalidSupportDesk)
	}
	if !isAllowedValue(ticket.Status, supportAllowedStatuses) {
		return SupportTicketData{}, fmt.Errorf("%w: status", errInvalidSupportDesk)
	}
	if !isAllowedValue(ticket.SourceSurface, supportAllowedSourceSurfaces) {
		return SupportTicketData{}, fmt.Errorf("%w: sourceSurface", errInvalidSupportDesk)
	}
	if ticket.SourceSurface != "admin_manual" && ticket.ReporterID == "" {
		return SupportTicketData{}, fmt.Errorf("%w: reporterId", errInvalidSupportTicket)
	}
	if !isAllowedSupportCategory(ticket.ReporterRole, ticket.CategoryID) {
		return SupportTicketData{}, fmt.Errorf("%w: categoryId", errInvalidSupportDesk)
	}

	createdAt := normalizeRFC3339OrNow(ticket.CreatedAt, parseRFC3339OrZero(fallbackTimestamp))
	updatedAt := normalizeRFC3339OrNow(ticket.UpdatedAt, parseRFC3339OrZero(createdAt))
	ticket.CreatedAt = createdAt
	ticket.UpdatedAt = updatedAt
	return ticket, nil
}

func isAllowedSupportCategory(reporterRole string, categoryID string) bool {
	switch reporterRole {
	case "customer":
		return isAllowedValue(categoryID, supportAllowedCustomerCategories)
	case "professional":
		return isAllowedValue(categoryID, supportAllowedProfessionalCategories)
	default:
		return false
	}
}

func isAllowedValue(value string, allowed map[string]struct{}) bool {
	_, ok := allowed[value]
	return ok
}

func normalizeRFC3339OrNow(value string, fallback time.Time) string {
	parsed := parseRFC3339OrZero(value)
	if !parsed.IsZero() {
		return parsed.UTC().Format(time.RFC3339)
	}
	if fallback.IsZero() {
		fallback = time.Now().UTC()
	}
	return fallback.UTC().Format(time.RFC3339)
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
