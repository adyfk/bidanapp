package chat

import (
	"context"
	"strconv"
	"sync"
	"time"
)

type Hub struct {
	history map[string][]LiveMessage
	loaded  map[string]bool
	mu      sync.RWMutex
	store   Store
	threads map[string]map[*subscriber]struct{}
}

type subscriber struct {
	clientID string
	send     chan ServerEvent
}

func NewHub(stores ...Store) *Hub {
	store := Store(NewMemoryStore())
	if len(stores) > 0 && stores[0] != nil {
		store = stores[0]
	}

	return &Hub{
		history: make(map[string][]LiveMessage),
		loaded:  make(map[string]bool),
		store:   store,
		threads: make(map[string]map[*subscriber]struct{}),
	}
}

func (h *Hub) Subscribe(threadID string, clientID string) (*subscriber, []LiveMessage) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.threads[threadID] == nil {
		h.threads[threadID] = make(map[*subscriber]struct{})
	}

	sub := &subscriber{
		clientID: clientID,
		send:     make(chan ServerEvent, 16),
	}
	h.threads[threadID][sub] = struct{}{}

	if !h.loaded[threadID] {
		if history, err := h.store.LoadHistory(context.Background(), threadID, 50); err == nil {
			h.history[threadID] = history
			h.loaded[threadID] = true
		}
	}

	history := append([]LiveMessage(nil), h.history[threadID]...)
	return sub, history
}

func (h *Hub) Unsubscribe(threadID string, sub *subscriber) {
	h.mu.Lock()
	defer h.mu.Unlock()

	threadSubscribers := h.threads[threadID]
	if threadSubscribers == nil {
		return
	}

	delete(threadSubscribers, sub)
	close(sub.send)

	if len(threadSubscribers) == 0 {
		delete(h.threads, threadID)
	}
}

func (h *Hub) Publish(threadID string, senderID string, sender string, text string) (LiveMessage, error) {
	message, err := h.store.AppendMessage(context.Background(), threadID, senderID, sender, text, time.Now().UTC())
	if err != nil {
		return LiveMessage{}, err
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	h.history[threadID] = append(h.history[threadID], message)
	h.loaded[threadID] = true
	if len(h.history[threadID]) > 50 {
		h.history[threadID] = append([]LiveMessage(nil), h.history[threadID][len(h.history[threadID])-50:]...)
	}

	event := ServerEvent{
		Type:      "message",
		ThreadID:  threadID,
		Message:   &message,
		Timestamp: message.SentAt,
	}

	for sub := range h.threads[threadID] {
		select {
		case sub.send <- event:
		default:
		}
	}

	return message, nil
}

func buildMessageID(sentAt time.Time) string {
	return strconv.FormatInt(sentAt.UnixNano(), 10)
}
