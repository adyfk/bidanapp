package chat

import (
	"context"
	"sync"
	"time"
)

type Store interface {
	AppendMessage(ctx context.Context, threadID string, senderID string, senderName string, text string, sentAt time.Time) (LiveMessage, error)
	LoadHistory(ctx context.Context, threadID string, limit int) ([]LiveMessage, error)
}

type MemoryStore struct {
	history map[string][]LiveMessage
	mu      sync.Mutex
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		history: make(map[string][]LiveMessage),
	}
}

func (s *MemoryStore) AppendMessage(
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

	s.mu.Lock()
	defer s.mu.Unlock()

	message := LiveMessage{
		ID:       buildMessageID(sentAt),
		ThreadID: threadID,
		Sender:   senderName,
		Text:     text,
		SentAt:   sentAt,
	}

	s.history[threadID] = append(s.history[threadID], message)
	if len(s.history[threadID]) > 50 {
		s.history[threadID] = append([]LiveMessage(nil), s.history[threadID][len(s.history[threadID])-50:]...)
	}

	return message, nil
}

func (s *MemoryStore) LoadHistory(ctx context.Context, threadID string, limit int) ([]LiveMessage, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	history := append([]LiveMessage(nil), s.history[threadID]...)
	if len(history) > limit {
		history = append([]LiveMessage(nil), history[len(history)-limit:]...)
	}

	return history, nil
}
