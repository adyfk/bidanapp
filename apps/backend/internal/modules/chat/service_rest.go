package chat

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"
)

var (
	ErrChatDatabaseUnavailable = errors.New("chat requires a database connection")
	ErrChatInvalidPayload      = errors.New("invalid chat payload")
	ErrChatThreadNotFound      = errors.New("chat thread not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListThreads(ctx context.Context, platformID string, userID string) (ChatThreadList, error) {
	if s.db == nil {
		return ChatThreadList{}, ErrChatDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT DISTINCT ct.id, ct.platform_id, ct.order_id, ct.participant_kind, ct.title, ct.created_at, ct.updated_at
		FROM chat_threads ct
		LEFT JOIN orders o ON o.id = ct.order_id
		WHERE ($1 = '' OR ct.platform_id = $1)
		  AND (
			ct.participant_id = $2 OR
			o.customer_user_id = $2 OR
			o.professional_user_id = $2
		  )
		ORDER BY ct.updated_at DESC
	`, platformID, userID)
	if err != nil {
		return ChatThreadList{}, err
	}
	defer rows.Close()

	items := make([]ChatThreadSummary, 0)
	for rows.Next() {
		item, err := scanThread(rows)
		if err != nil {
			return ChatThreadList{}, err
		}
		items = append(items, item)
	}
	return ChatThreadList{Threads: items}, rows.Err()
}

func (s *Service) CreateThread(ctx context.Context, userID string, input CreateChatThreadRequest) (ChatThreadDetail, error) {
	if s.db == nil {
		return ChatThreadDetail{}, ErrChatDatabaseUnavailable
	}
	threadType := strings.TrimSpace(input.ThreadType)
	title := strings.TrimSpace(input.Title)
	if (threadType != "conversation" && threadType != "order") || title == "" {
		return ChatThreadDetail{}, ErrChatInvalidPayload
	}

	threadID, err := newChatID("cth_")
	if err != nil {
		return ChatThreadDetail{}, err
	}
	now := time.Now().UTC()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ChatThreadDetail{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO chat_threads (
			id, platform_id, order_id, title, participant_kind, participant_id, created_at, updated_at
		) VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, $6, $7, $7)
	`, threadID, strings.TrimSpace(input.PlatformID), strings.TrimSpace(input.OrderID), title, threadType, userID, now); err != nil {
		return ChatThreadDetail{}, err
	}

	if strings.TrimSpace(input.InitialMessage) != "" {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO chat_messages (
				id, thread_id, sender_kind, sender_id, sender_name, body, sent_at, created_at
			) VALUES ($1, $2, 'viewer', $3, 'Viewer', $4, $5, $5)
		`, buildMessageID(now), threadID, userID, strings.TrimSpace(input.InitialMessage), now); err != nil {
			return ChatThreadDetail{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return ChatThreadDetail{}, err
	}
	return s.GetThread(ctx, threadID, userID)
}

func (s *Service) GetThread(ctx context.Context, threadID string, userID string) (ChatThreadDetail, error) {
	if s.db == nil {
		return ChatThreadDetail{}, ErrChatDatabaseUnavailable
	}
	thread, err := s.threadByID(ctx, threadID, userID)
	if err != nil {
		return ChatThreadDetail{}, err
	}
	messages, err := s.messagesByThread(ctx, threadID)
	if err != nil {
		return ChatThreadDetail{}, err
	}
	return ChatThreadDetail{
		Messages: messages,
		Thread:   thread,
	}, nil
}

func (s *Service) CreateMessage(ctx context.Context, threadID string, userID string, input CreateChatMessageRequest) (ChatThreadDetail, error) {
	if s.db == nil {
		return ChatThreadDetail{}, ErrChatDatabaseUnavailable
	}
	if strings.TrimSpace(input.Body) == "" {
		return ChatThreadDetail{}, ErrChatInvalidPayload
	}
	thread, err := s.threadByID(ctx, threadID, userID)
	if err != nil {
		return ChatThreadDetail{}, err
	}

	senderKind, senderName, err := s.resolveSender(ctx, threadID, userID, strings.TrimSpace(input.SenderName))
	if err != nil {
		return ChatThreadDetail{}, err
	}

	now := time.Now().UTC()
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO chat_messages (
			id, thread_id, sender_kind, sender_id, sender_name, body, sent_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
	`, buildMessageID(now), threadID, senderKind, userID, senderName, strings.TrimSpace(input.Body), now); err != nil {
		return ChatThreadDetail{}, err
	}
	if _, err := s.db.ExecContext(ctx, `
		UPDATE chat_threads
		SET updated_at = $2
		WHERE id = $1
	`, threadID, now); err != nil {
		return ChatThreadDetail{}, err
	}

	messages, err := s.messagesByThread(ctx, threadID)
	if err != nil {
		return ChatThreadDetail{}, err
	}
	thread.UpdatedAt = now.UTC().Format(time.RFC3339)
	return ChatThreadDetail{
		Messages: messages,
		Thread:   thread,
	}, nil
}

func (s *Service) threadByID(ctx context.Context, threadID string, userID string) (ChatThreadSummary, error) {
	var item ChatThreadSummary
	var platformID sql.NullString
	var orderID sql.NullString
	var createdAt time.Time
	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, `
		SELECT ct.id, ct.platform_id, ct.order_id, ct.participant_kind, ct.title, ct.created_at, ct.updated_at
		FROM chat_threads ct
		LEFT JOIN orders o ON o.id = ct.order_id
		WHERE ct.id = $1
		  AND (
			ct.participant_id = $2 OR
			o.customer_user_id = $2 OR
			o.professional_user_id = $2
		  )
	`, threadID, userID).Scan(
		&item.ID,
		&platformID,
		&orderID,
		&item.ThreadType,
		&item.Title,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ChatThreadSummary{}, ErrChatThreadNotFound
		}
		return ChatThreadSummary{}, err
	}
	if platformID.Valid {
		item.PlatformID = platformID.String
	}
	if orderID.Valid {
		item.OrderID = orderID.String
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *Service) messagesByThread(ctx context.Context, threadID string) ([]ChatMessageRecord, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, sender_kind, sender_id, sender_name, body, sent_at
		FROM chat_messages
		WHERE thread_id = $1
		ORDER BY sent_at ASC
	`, threadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ChatMessageRecord, 0)
	for rows.Next() {
		var item ChatMessageRecord
		var sentAt time.Time
		if err := rows.Scan(&item.ID, &item.SenderKind, &item.SenderID, &item.SenderName, &item.Body, &sentAt); err != nil {
			return nil, err
		}
		item.ThreadID = threadID
		item.SentAt = sentAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) resolveSender(ctx context.Context, threadID string, userID string, overrideName string) (string, string, error) {
	var customerUserID sql.NullString
	var professionalUserID sql.NullString
	err := s.db.QueryRowContext(ctx, `
		SELECT o.customer_user_id, o.professional_user_id
		FROM chat_threads ct
		LEFT JOIN orders o ON o.id = ct.order_id
		WHERE ct.id = $1
	`, threadID).Scan(&customerUserID, &professionalUserID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return "", "", err
	}

	senderKind := "viewer"
	if professionalUserID.Valid && professionalUserID.String == userID && (!customerUserID.Valid || customerUserID.String != userID) {
		senderKind = "professional"
	}
	if overrideName != "" {
		return senderKind, overrideName, nil
	}
	if senderKind == "professional" {
		return senderKind, "Professional", nil
	}
	return senderKind, "Viewer", nil
}

func scanThread(scanner interface{ Scan(dest ...any) error }) (ChatThreadSummary, error) {
	var item ChatThreadSummary
	var platformID sql.NullString
	var orderID sql.NullString
	var createdAt time.Time
	var updatedAt time.Time
	if err := scanner.Scan(&item.ID, &platformID, &orderID, &item.ThreadType, &item.Title, &createdAt, &updatedAt); err != nil {
		return ChatThreadSummary{}, err
	}
	if platformID.Valid {
		item.PlatformID = platformID.String
	}
	if orderID.Valid {
		item.OrderID = orderID.String
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func newChatID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}
