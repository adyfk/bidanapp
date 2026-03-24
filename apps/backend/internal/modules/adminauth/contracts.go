package adminauth

const SecuritySchemeName = "AdminSessionAuth"

type AdminAuthCreateSessionRequest struct {
	Email    string `json:"email" required:"true"`
	Password string `json:"password" required:"true"`
}

type AdminAuthSessionUpdateRequest struct {
	LastVisitedRoute string `json:"lastVisitedRoute,omitempty"`
}

type AdminAuthSessionData struct {
	AdminID          string `json:"adminId"`
	Email            string `json:"email"`
	FocusArea        string `json:"focusArea"`
	IsAuthenticated  bool   `json:"isAuthenticated"`
	LastLoginAt      string `json:"lastLoginAt,omitempty"`
	LastVisitedRoute string `json:"lastVisitedRoute,omitempty"`
	ExpiresAt        string `json:"expiresAt,omitempty"`
}
