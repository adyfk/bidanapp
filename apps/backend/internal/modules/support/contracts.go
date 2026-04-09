package support

const (
	AdminSecuritySchemeName  = "AdminSessionAuth"
	ViewerSecuritySchemeName = "ViewerSessionAuth"
)

type SupportTicket struct {
	AssignedAdminID string               `json:"assignedAdminId,omitempty"`
	ChatThreadID    string               `json:"chatThreadId,omitempty"`
	CreatedAt       string               `json:"createdAt"`
	Details         string               `json:"details"`
	Events          []SupportTicketEvent `json:"events"`
	ID              string               `json:"id"`
	OrderID         string               `json:"orderId,omitempty"`
	PlatformID      string               `json:"platformId"`
	Priority        string               `json:"priority"`
	ReporterUserID  string               `json:"reporterUserId"`
	Status          string               `json:"status"`
	Subject         string               `json:"subject"`
	UpdatedAt       string               `json:"updatedAt"`
}

type SupportTicketEvent struct {
	ActorID      string         `json:"actorId"`
	ActorKind    string         `json:"actorKind"`
	CreatedAt    string         `json:"createdAt"`
	EventType    string         `json:"eventType"`
	ID           string         `json:"id"`
	InternalNote string         `json:"internalNote,omitempty"`
	Payload      map[string]any `json:"payload,omitempty"`
	PublicNote   string         `json:"publicNote,omitempty"`
}

type SupportTicketList struct {
	Tickets []SupportTicket `json:"tickets"`
}

type CreateSupportTicketRequest struct {
	ChatThreadID string `json:"chatThreadId,omitempty"`
	Details      string `json:"details" required:"true"`
	OrderID      string `json:"orderId,omitempty"`
	PlatformID   string `json:"platformId" required:"true"`
	Priority     string `json:"priority,omitempty"`
	Subject      string `json:"subject" required:"true"`
}

type TriageSupportTicketRequest struct {
	AssignToAdminID string `json:"assignToAdminId,omitempty"`
	InternalNote    string `json:"internalNote,omitempty"`
	Priority        string `json:"priority,omitempty"`
	PublicNote      string `json:"publicNote,omitempty"`
	Status          string `json:"status,omitempty"`
}
