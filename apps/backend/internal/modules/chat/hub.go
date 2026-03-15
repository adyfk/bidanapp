package chat

import (
	"strconv"
	"sync"
	"time"
)

type Hub struct {
	mu       sync.RWMutex
	history  map[string][]LiveMessage
	threads  map[string]map[*subscriber]struct{}
	sequence int64
}

type subscriber struct {
	clientID string
	send     chan ServerEvent
}

func NewHub() *Hub {
	return &Hub{
		history: make(map[string][]LiveMessage),
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

func (h *Hub) Publish(threadID string, sender string, text string) LiveMessage {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.sequence++
	message := LiveMessage{
		ID:       time.Now().UTC().Format("20060102150405") + "-" + strconv.FormatInt(h.sequence, 10),
		ThreadID: threadID,
		Sender:   sender,
		Text:     text,
		SentAt:   time.Now().UTC(),
	}

	h.history[threadID] = append(h.history[threadID], message)
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

	return message
}
