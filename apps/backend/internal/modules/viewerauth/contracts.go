package viewerauth

const SecuritySchemeName = "ViewerSessionAuth"

type ViewerAuthCreateSessionRequest struct {
	Password string `json:"password" required:"true"`
	Phone    string `json:"phone" required:"true"`
}

type ViewerAuthRegisterRequest struct {
	City        string `json:"city,omitempty"`
	DisplayName string `json:"displayName" required:"true"`
	Password    string `json:"password" required:"true"`
	Phone       string `json:"phone" required:"true"`
}

type ViewerAuthForgotPasswordRequest struct {
	Phone string `json:"phone" required:"true"`
}

type ViewerAuthResetPasswordRequest struct {
	ChallengeID string `json:"challengeId" required:"true"`
	Code        string `json:"code" required:"true"`
	NewPassword string `json:"newPassword" required:"true"`
}

type ViewerAuthCreateChallengeRequest struct {
	Phone   string `json:"phone" required:"true"`
	Purpose string `json:"purpose" required:"true"`
}

type ViewerAuthVerifyChallengeRequest struct {
	ChallengeID string `json:"challengeId" required:"true"`
	Code        string `json:"code" required:"true"`
}

type ViewerAuthRevokeSessionRequest struct {
	SessionID string `path:"session_id"`
}

type ViewerIdentity struct {
	IdentityType string `json:"identityType"`
	Provider     string `json:"provider"`
	Value        string `json:"value"`
	VerifiedAt   string `json:"verifiedAt,omitempty"`
}

type ViewerCustomerProfile struct {
	City         string `json:"city,omitempty"`
	DisplayName  string `json:"displayName,omitempty"`
	PrimaryPhone string `json:"primaryPhone,omitempty"`
}

type UpdateViewerCustomerProfileRequest struct {
	City        string `json:"city,omitempty"`
	DisplayName string `json:"displayName" required:"true"`
}

type ViewerPlatformMembership struct {
	ApplicationID     string `json:"applicationId,omitempty"`
	ApplicationStatus string `json:"applicationStatus,omitempty"`
	DisplayName       string `json:"displayName,omitempty"`
	PlatformID        string `json:"platformId"`
	ProfileID         string `json:"profileId,omitempty"`
	ProfileStatus     string `json:"profileStatus,omitempty"`
	ReviewStatus      string `json:"reviewStatus,omitempty"`
	Slug              string `json:"slug,omitempty"`
}

type AuthChallenge struct {
	Channel           string `json:"channel"`
	ChallengeID       string `json:"challengeId"`
	DestinationMasked string `json:"destinationMasked"`
	ExpiresAt         string `json:"expiresAt"`
	Purpose           string `json:"purpose"`
	Status            string `json:"status"`
	VerifiedAt        string `json:"verifiedAt,omitempty"`
}

type AuthRecoveryRequest struct {
	Challenge AuthChallenge `json:"challenge"`
	Message   string        `json:"message"`
}

type AuthDeviceSession struct {
	CreatedAt        string `json:"createdAt"`
	Current          bool   `json:"current"`
	ExpiresAt        string `json:"expiresAt"`
	ID               string `json:"id"`
	IPAddress        string `json:"ipAddress,omitempty"`
	LastLoginAt      string `json:"lastLoginAt"`
	LastSeenAt       string `json:"lastSeenAt"`
	LastVisitedRoute string `json:"lastVisitedRoute,omitempty"`
	RevokedAt        string `json:"revokedAt,omitempty"`
	SessionLabel     string `json:"sessionLabel,omitempty"`
	UserAgent        string `json:"userAgent,omitempty"`
}

type AuthSessionList struct {
	Items []AuthDeviceSession `json:"items"`
}

type AuthSessionMutationResult struct {
	CurrentSessionExpired bool `json:"currentSessionExpired"`
	RevokedCount          int  `json:"revokedCount"`
}

type ViewerAuthSessionData struct {
	AdminGrants         []string                   `json:"adminGrants"`
	CustomerProfile     *ViewerCustomerProfile     `json:"customerProfile,omitempty"`
	ExpiresAt           string                     `json:"expiresAt,omitempty"`
	Identities          []ViewerIdentity           `json:"identities"`
	IsAuthenticated     bool                       `json:"isAuthenticated"`
	LastLoginAt         string                     `json:"lastLoginAt,omitempty"`
	Phone               string                     `json:"phone,omitempty"`
	PlatformMemberships []ViewerPlatformMembership `json:"platformMemberships"`
	RegisteredAt        string                     `json:"registeredAt,omitempty"`
	UserID              string                     `json:"userId,omitempty"`
}
