package support

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var (
	ErrDatabaseUnavailable = errors.New("support requires a database connection")
	ErrInvalidPayload      = errors.New("invalid support payload")
	ErrTicketNotFound      = errors.New("support ticket not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListViewerTickets(ctx context.Context, platformID string, userID string) (SupportTicketList, error) {
	if s.db == nil {
		return SupportTicketList{}, ErrDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, platform_id, order_id, reporter_user_id, assigned_admin_id, chat_thread_id, status, priority, subject, details, created_at, updated_at
		FROM support_tickets
		WHERE reporter_user_id = $1
		  AND ($2 = '' OR platform_id = $2)
		ORDER BY updated_at DESC
	`, userID, platformID)
	if err != nil {
		return SupportTicketList{}, err
	}
	defer rows.Close()
	return s.scanTicketRows(ctx, rows)
}

func (s *Service) GetViewerTicket(ctx context.Context, ticketID string, userID string) (SupportTicket, error) {
	if s.db == nil {
		return SupportTicket{}, ErrDatabaseUnavailable
	}
	row := s.db.QueryRowContext(ctx, `
		SELECT id, platform_id, order_id, reporter_user_id, assigned_admin_id, chat_thread_id, status, priority, subject, details, created_at, updated_at
		FROM support_tickets
		WHERE id = $1
		  AND reporter_user_id = $2
	`, ticketID, userID)
	return s.scanTicket(ctx, row)
}

func (s *Service) Create(ctx context.Context, userID string, input CreateSupportTicketRequest) (SupportTicket, error) {
	if s.db == nil {
		return SupportTicket{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.PlatformID) == "" || strings.TrimSpace(input.Subject) == "" || strings.TrimSpace(input.Details) == "" {
		return SupportTicket{}, ErrInvalidPayload
	}

	ticketID, err := newID("stkt_")
	if err != nil {
		return SupportTicket{}, err
	}
	eventID, err := newID("stkevt_")
	if err != nil {
		return SupportTicket{}, err
	}
	now := time.Now().UTC()
	priority := strings.TrimSpace(input.Priority)
	if priority == "" {
		priority = "normal"
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return SupportTicket{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO support_tickets (
			id, platform_id, order_id, reporter_user_id, assigned_admin_id, chat_thread_id, status, priority, subject, details, metadata, created_at, updated_at
		) VALUES ($1, $2, NULLIF($3, ''), $4, NULL, NULLIF($5, ''), 'new', $6, $7, $8, '{}'::jsonb, $9, $9)
	`, ticketID, strings.TrimSpace(input.PlatformID), strings.TrimSpace(input.OrderID), userID, strings.TrimSpace(input.ChatThreadID), priority, strings.TrimSpace(input.Subject), strings.TrimSpace(input.Details), now); err != nil {
		return SupportTicket{}, err
	}

	payloadJSON, err := json.Marshal(map[string]any{
		"chatThreadId": strings.TrimSpace(input.ChatThreadID),
		"details":      strings.TrimSpace(input.Details),
		"orderId":      strings.TrimSpace(input.OrderID),
		"priority":     priority,
		"subject":      strings.TrimSpace(input.Subject),
	})
	if err != nil {
		return SupportTicket{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO support_ticket_events (
			id, ticket_id, actor_kind, actor_id, event_type, public_note, internal_note, payload, created_at
		) VALUES ($1, $2, 'viewer', $3, 'created', $4, '', $5, $6)
	`, eventID, ticketID, userID, strings.TrimSpace(input.Details), payloadJSON, now); err != nil {
		return SupportTicket{}, err
	}

	if err := tx.Commit(); err != nil {
		return SupportTicket{}, err
	}

	return s.GetViewerTicket(ctx, ticketID, userID)
}

func (s *Service) ListAdminTickets(ctx context.Context, platformID string) (SupportTicketList, error) {
	if s.db == nil {
		return SupportTicketList{}, ErrDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, platform_id, order_id, reporter_user_id, assigned_admin_id, chat_thread_id, status, priority, subject, details, created_at, updated_at
		FROM support_tickets
		WHERE ($1 = '' OR platform_id = $1)
		ORDER BY
			CASE status
				WHEN 'new' THEN 0
				WHEN 'triaged' THEN 1
				WHEN 'reviewing' THEN 2
				WHEN 'resolved' THEN 3
				ELSE 4
			END,
			updated_at DESC
	`, platformID)
	if err != nil {
		return SupportTicketList{}, err
	}
	defer rows.Close()
	return s.scanTicketRows(ctx, rows)
}

func (s *Service) Triage(ctx context.Context, ticketID string, adminID string, input TriageSupportTicketRequest) (SupportTicket, error) {
	if s.db == nil {
		return SupportTicket{}, ErrDatabaseUnavailable
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return SupportTicket{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var reporterUserID string
	var platformID string
	err = tx.QueryRowContext(ctx, `
		SELECT reporter_user_id, platform_id
		FROM support_tickets
		WHERE id = $1
	`, ticketID).Scan(&reporterUserID, &platformID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return SupportTicket{}, ErrTicketNotFound
		}
		return SupportTicket{}, err
	}

	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "triaged"
	}
	priority := strings.TrimSpace(input.Priority)
	if priority == "" {
		priority = "normal"
	}
	assignTo := strings.TrimSpace(input.AssignToAdminID)
	if assignTo == "" {
		assignTo = adminID
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE support_tickets
		SET assigned_admin_id = NULLIF($2, ''),
		    status = $3,
		    priority = $4,
		    updated_at = now()
		WHERE id = $1
	`, ticketID, assignTo, status, priority); err != nil {
		return SupportTicket{}, err
	}

	eventID, err := newID("stkevt_")
	if err != nil {
		return SupportTicket{}, err
	}
	payloadJSON, err := json.Marshal(map[string]any{
		"assignedAdminId": assignTo,
		"priority":        priority,
		"status":          status,
	})
	if err != nil {
		return SupportTicket{}, err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO support_ticket_events (
			id, ticket_id, actor_kind, actor_id, event_type, public_note, internal_note, payload, created_at
		) VALUES ($1, $2, 'admin', $3, 'status_changed', $4, $5, $6, now())
	`, eventID, ticketID, adminID, strings.TrimSpace(input.PublicNote), strings.TrimSpace(input.InternalNote), payloadJSON); err != nil {
		return SupportTicket{}, err
	}

	if err := tx.Commit(); err != nil {
		return SupportTicket{}, err
	}

	items, err := s.ListAdminTickets(ctx, platformID)
	if err != nil {
		return SupportTicket{}, err
	}
	for _, item := range items.Tickets {
		if item.ID == ticketID {
			return item, nil
		}
	}
	return SupportTicket{}, ErrTicketNotFound
}

func (s *Service) scanTicketRows(ctx context.Context, rows *sql.Rows) (SupportTicketList, error) {
	items := make([]SupportTicket, 0)
	for rows.Next() {
		item, err := s.scanCurrentRow(ctx, rows)
		if err != nil {
			return SupportTicketList{}, err
		}
		items = append(items, item)
	}
	return SupportTicketList{Tickets: items}, rows.Err()
}

func (s *Service) scanTicket(ctx context.Context, row interface{ Scan(dest ...any) error }) (SupportTicket, error) {
	item, err := s.scanCurrentRow(ctx, row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return SupportTicket{}, ErrTicketNotFound
		}
		return SupportTicket{}, err
	}
	return item, nil
}

func (s *Service) scanCurrentRow(ctx context.Context, scanner interface{ Scan(dest ...any) error }) (SupportTicket, error) {
	var item SupportTicket
	var orderID sql.NullString
	var assignedAdminID sql.NullString
	var chatThreadID sql.NullString
	var createdAt time.Time
	var updatedAt time.Time
	if err := scanner.Scan(
		&item.ID,
		&item.PlatformID,
		&orderID,
		&item.ReporterUserID,
		&assignedAdminID,
		&chatThreadID,
		&item.Status,
		&item.Priority,
		&item.Subject,
		&item.Details,
		&createdAt,
		&updatedAt,
	); err != nil {
		return SupportTicket{}, err
	}
	if orderID.Valid {
		item.OrderID = orderID.String
	}
	if assignedAdminID.Valid {
		item.AssignedAdminID = assignedAdminID.String
	}
	if chatThreadID.Valid {
		item.ChatThreadID = chatThreadID.String
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	events, err := s.loadEvents(ctx, item.ID)
	if err != nil {
		return SupportTicket{}, err
	}
	item.Events = events
	return item, nil
}

func (s *Service) loadEvents(ctx context.Context, ticketID string) ([]SupportTicketEvent, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, actor_kind, actor_id, event_type, public_note, internal_note, payload, created_at
		FROM support_ticket_events
		WHERE ticket_id = $1
		ORDER BY created_at ASC
	`, ticketID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]SupportTicketEvent, 0)
	for rows.Next() {
		var item SupportTicketEvent
		var payloadJSON []byte
		var createdAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.ActorKind,
			&item.ActorID,
			&item.EventType,
			&item.PublicNote,
			&item.InternalNote,
			&payloadJSON,
			&createdAt,
		); err != nil {
			return nil, err
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		if len(payloadJSON) > 0 {
			if err := json.Unmarshal(payloadJSON, &item.Payload); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}
