package chat

const ViewerSecuritySchemeName = "ViewerSessionAuth"

type ChatThreadSummary struct {
	CreatedAt   string `json:"createdAt"`
	ID          string `json:"id"`
	OrderID     string `json:"orderId,omitempty"`
	PlatformID  string `json:"platformId,omitempty"`
	ThreadType  string `json:"threadType"`
	Title       string `json:"title"`
	UpdatedAt   string `json:"updatedAt"`
}

type ChatThreadList struct {
	Threads []ChatThreadSummary `json:"threads"`
}

type ChatMessageRecord struct {
	Body       string `json:"body"`
	ID         string `json:"id"`
	SenderID   string `json:"senderId"`
	SenderKind string `json:"senderKind"`
	SenderName string `json:"senderName"`
	SentAt     string `json:"sentAt"`
	ThreadID   string `json:"threadId"`
}

type ChatThreadDetail struct {
	Messages []ChatMessageRecord `json:"messages"`
	Thread   ChatThreadSummary   `json:"thread"`
}

type CreateChatThreadRequest struct {
	InitialMessage string `json:"initialMessage,omitempty"`
	OrderID        string `json:"orderId,omitempty"`
	PlatformID     string `json:"platformId,omitempty"`
	ThreadType     string `json:"threadType" required:"true"`
	Title          string `json:"title" required:"true"`
}

type CreateChatMessageRequest struct {
	Body       string `json:"body" required:"true"`
	SenderName string `json:"senderName,omitempty"`
}
