package simulation

type ChatSender string

type ChatMessage struct {
	ID     int        `json:"id"`
	Text   string     `json:"text"`
	Sender ChatSender `json:"sender"`
	Time   string     `json:"time"`
	IsRead bool       `json:"isRead"`
}

type ChatThread struct {
	Index            int           `json:"index"`
	ID               string        `json:"id"`
	ProfessionalSlug string        `json:"professionalSlug"`
	AppointmentID    string        `json:"appointmentId,omitempty"`
	DayLabel         string        `json:"dayLabel"`
	InputPlaceholder string        `json:"inputPlaceholder"`
	AutoReplyText    string        `json:"autoReplyText,omitempty"`
	Messages         []ChatMessage `json:"messages"`
}

type ChatData struct {
	DirectThreads      []ChatThread `json:"directThreads"`
	AppointmentThreads []ChatThread `json:"appointmentThreads"`
}
