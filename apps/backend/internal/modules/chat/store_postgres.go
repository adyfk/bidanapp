package chat

import (
	"context"
	"database/sql"
	"errors"
	"sort"
	"time"
)

var ErrNilChatDB = errors.New("chat store requires a database connection")

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) AppendMessage(
	ctx context.Context,
	threadID string,
	senderID string,
	senderName string,
	text string,
	sentAt time.Time,
) (LiveMessage, error) {
	if err := ctx.Err(); err != nil {
		return LiveMessage{}, err
	}
	if s.db == nil {
		return LiveMessage{}, ErrNilChatDB
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return LiveMessage{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO chat_threads (
			id,
			title,
			participant_kind,
			participant_id,
			updated_at
		) VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO UPDATE
		SET title = EXCLUDED.title,
		    updated_at = EXCLUDED.updated_at
	`, threadID, threadID, "conversation", threadID, sentAt); err != nil {
		return LiveMessage{}, err
	}

	message := LiveMessage{
		ID:       buildMessageID(sentAt),
		ThreadID: threadID,
		Sender:   senderName,
		Text:     text,
		SentAt:   sentAt,
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO chat_messages (
			id,
			thread_id,
			sender_kind,
			sender_id,
			sender_name,
			body,
			sent_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, message.ID, threadID, "client", senderID, senderName, text, sentAt); err != nil {
		return LiveMessage{}, err
	}

	if err := tx.Commit(); err != nil {
		return LiveMessage{}, err
	}

	return message, nil
}

func (s *PostgresStore) LoadHistory(ctx context.Context, threadID string, limit int) ([]LiveMessage, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilChatDB
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, sender_name, body, sent_at
		FROM chat_messages
		WHERE thread_id = $1
		ORDER BY sent_at DESC
		LIMIT $2
	`, threadID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	history := make([]LiveMessage, 0, limit)
	for rows.Next() {
		var message LiveMessage
		if err := rows.Scan(&message.ID, &message.Sender, &message.Text, &message.SentAt); err != nil {
			return nil, err
		}
		message.ThreadID = threadID
		history = append(history, message)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	sort.Slice(history, func(leftIndex int, rightIndex int) bool {
		return history[leftIndex].SentAt.Before(history[rightIndex].SentAt)
	})

	return history, nil
}
