package professionalauth

const SecuritySchemeName = "ProfessionalSessionAuth"

type ProfessionalAuthCreateSessionRequest struct {
	ProfessionalID string `json:"professionalId" required:"true"`
	Phone          string `json:"phone" required:"true"`
	Password       string `json:"password" required:"true"`
}

type ProfessionalAuthRegisterRequest struct {
	City             string `json:"city,omitempty"`
	CredentialNumber string `json:"credentialNumber" required:"true"`
	DisplayName      string `json:"displayName" required:"true"`
	Password         string `json:"password" required:"true"`
	Phone            string `json:"phone" required:"true"`
	ProfessionalID   string `json:"professionalId,omitempty"`
}

type ProfessionalAuthUpdateAccountRequest struct {
	City             string `json:"city,omitempty"`
	CredentialNumber string `json:"credentialNumber" required:"true"`
	DisplayName      string `json:"displayName" required:"true"`
	Phone            string `json:"phone" required:"true"`
}

type ProfessionalAuthUpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" required:"true"`
	NewPassword     string `json:"newPassword" required:"true"`
}

type ProfessionalAuthRequestPasswordRecoveryRequest struct {
	Phone          string `json:"phone" required:"true"`
	ProfessionalID string `json:"professionalId" required:"true"`
}

type ProfessionalAuthPasswordRecoveryData struct {
	Accepted    bool   `json:"accepted"`
	RequestedAt string `json:"requestedAt"`
}

type ProfessionalAuthSessionData struct {
	City             string `json:"city,omitempty"`
	CredentialNumber string `json:"credentialNumber,omitempty"`
	DisplayName      string `json:"displayName,omitempty"`
	ExpiresAt        string `json:"expiresAt,omitempty"`
	IsAuthenticated  bool   `json:"isAuthenticated"`
	LastLoginAt      string `json:"lastLoginAt,omitempty"`
	Phone            string `json:"phone"`
	ProfessionalID   string `json:"professionalId"`
	RegisteredAt     string `json:"registeredAt,omitempty"`
}
