package notifications

const SecuritySchemeName = "ViewerSessionAuth"

type NotificationItem struct {
	CreatedAt  string `json:"createdAt"`
	EntityID   string `json:"entityId"`
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Message    string `json:"message"`
	PlatformID string `json:"platformId"`
	Title      string `json:"title"`
}

type NotificationList struct {
	Items []NotificationItem `json:"items"`
}
