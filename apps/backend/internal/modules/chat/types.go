package chat

import "time"

type ClientMessage struct {
	Type   string `json:"type"`
	Sender string `json:"sender"`
	Text   string `json:"text"`
}

type LiveMessage struct {
	ID       string    `json:"id"`
	ThreadID string    `json:"threadId"`
	Sender   string    `json:"sender"`
	Text     string    `json:"text"`
	SentAt   time.Time `json:"sentAt"`
}

type ServerEvent struct {
	Type      string        `json:"type"`
	ThreadID  string        `json:"threadId"`
	ClientID  string        `json:"clientId,omitempty"`
	Message   *LiveMessage  `json:"message,omitempty"`
	Messages  []LiveMessage `json:"messages,omitempty"`
	Timestamp time.Time     `json:"timestamp"`
}
