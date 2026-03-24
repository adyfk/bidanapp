package customerauth

const SecuritySchemeName = "CustomerSessionAuth"

type CustomerAuthCreateSessionRequest struct {
	Phone    string `json:"phone" required:"true"`
	Password string `json:"password" required:"true"`
}

type CustomerAuthRegisterRequest struct {
	City        string `json:"city,omitempty"`
	DisplayName string `json:"displayName" required:"true"`
	Password    string `json:"password" required:"true"`
	Phone       string `json:"phone" required:"true"`
}

type CustomerAuthUpdateAccountRequest struct {
	City        string `json:"city,omitempty"`
	DisplayName string `json:"displayName" required:"true"`
	Phone       string `json:"phone" required:"true"`
}

type CustomerAuthUpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" required:"true"`
	NewPassword     string `json:"newPassword" required:"true"`
}

type CustomerAuthSessionData struct {
	City            string `json:"city,omitempty"`
	ConsumerID      string `json:"consumerId"`
	DisplayName     string `json:"displayName,omitempty"`
	ExpiresAt       string `json:"expiresAt,omitempty"`
	IsAuthenticated bool   `json:"isAuthenticated"`
	LastLoginAt     string `json:"lastLoginAt,omitempty"`
	Phone           string `json:"phone"`
	RegisteredAt    string `json:"registeredAt,omitempty"`
}
