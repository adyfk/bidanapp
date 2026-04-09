package professionalworkspace

type ProfessionalWorkspaceProfile struct {
	Attributes   map[string]any `json:"attributes"`
	City         string         `json:"city"`
	DisplayName  string         `json:"displayName"`
	ID           string         `json:"id"`
	PlatformID   string         `json:"platformId"`
	ReviewStatus string         `json:"reviewStatus"`
	Slug         string         `json:"slug"`
	Status       string         `json:"status"`
	UserID       string         `json:"userId"`
}

type ProfessionalWorkspaceApplication struct {
	Attributes  map[string]any                  `json:"attributes"`
	Documents   []ProfessionalWorkspaceDocument `json:"documents"`
	ID          string                          `json:"id"`
	PlatformID  string                          `json:"platformId"`
	ReviewNotes string                          `json:"reviewNotes,omitempty"`
	Status      string                          `json:"status"`
	UserID      string                          `json:"userId"`
}

type ProfessionalWorkspaceDocument struct {
	DocumentKey string         `json:"documentKey"`
	DocumentURL string         `json:"documentUrl"`
	FileName    string         `json:"fileName"`
	ID          string         `json:"id"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type ProfessionalPortfolioEntry struct {
	AssetURL    string         `json:"assetUrl"`
	Description string         `json:"description"`
	ID          string         `json:"id"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	SortOrder   int            `json:"sortOrder"`
	Title       string         `json:"title"`
}

type ProfessionalGalleryAsset struct {
	AssetURL  string         `json:"assetUrl"`
	Caption   string         `json:"caption"`
	FileName  string         `json:"fileName"`
	ID        string         `json:"id"`
	Metadata  map[string]any `json:"metadata,omitempty"`
	SortOrder int            `json:"sortOrder"`
}

type ProfessionalCredential struct {
	CredentialCode string         `json:"credentialCode"`
	ExpiresAt      string         `json:"expiresAt,omitempty"`
	ID             string         `json:"id"`
	IssuedAt       string         `json:"issuedAt,omitempty"`
	Issuer         string         `json:"issuer"`
	Label          string         `json:"label"`
	Metadata       map[string]any `json:"metadata,omitempty"`
}

type ProfessionalStory struct {
	Body        string         `json:"body"`
	ID          string         `json:"id"`
	IsPublished bool           `json:"isPublished"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	SortOrder   int            `json:"sortOrder"`
	Title       string         `json:"title"`
}

type ProfessionalCoverageArea struct {
	AreaLabel string         `json:"areaLabel"`
	City      string         `json:"city"`
	ID        string         `json:"id"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

type ProfessionalAvailabilityRule struct {
	EndTime       string         `json:"endTime"`
	ID            string         `json:"id"`
	IsUnavailable bool           `json:"isUnavailable"`
	Metadata      map[string]any `json:"metadata,omitempty"`
	StartTime     string         `json:"startTime"`
	Weekday       int            `json:"weekday"`
}

type ProfessionalNotificationPreferences struct {
	EmailEnabled    bool           `json:"emailEnabled"`
	Metadata        map[string]any `json:"metadata,omitempty"`
	ProfileID       string         `json:"profileId"`
	WhatsAppEnabled bool           `json:"whatsappEnabled"`
	WebEnabled      bool           `json:"webEnabled"`
}

type ProfessionalOrderSummary struct {
	Currency      string `json:"currency"`
	ID            string `json:"id"`
	OfferingTitle string `json:"offeringTitle"`
	OrderType     string `json:"orderType"`
	PaymentStatus string `json:"paymentStatus"`
	Status        string `json:"status"`
	TotalAmount   int    `json:"totalAmount"`
}

type ProfessionalWorkspaceSnapshot struct {
	Application             *ProfessionalWorkspaceApplication   `json:"application,omitempty"`
	AvailabilityRules       []ProfessionalAvailabilityRule      `json:"availabilityRules"`
	CoverageAreas           []ProfessionalCoverageArea          `json:"coverageAreas"`
	Credentials             []ProfessionalCredential            `json:"credentials"`
	GalleryAssets           []ProfessionalGalleryAsset          `json:"galleryAssets"`
	NotificationPreferences ProfessionalNotificationPreferences `json:"notificationPreferences"`
	Offerings               []ProfessionalWorkspaceOffering     `json:"offerings"`
	PortfolioEntries        []ProfessionalPortfolioEntry        `json:"portfolioEntries"`
	Profile                 *ProfessionalWorkspaceProfile       `json:"profile,omitempty"`
	RecentOrders            []ProfessionalOrderSummary          `json:"recentOrders"`
	Stories                 []ProfessionalStory                 `json:"stories"`
}

type ProfessionalWorkspaceOffering struct {
	Currency     string `json:"currency"`
	DeliveryMode string `json:"deliveryMode"`
	ID           string `json:"id"`
	OfferingType string `json:"offeringType"`
	PriceAmount  int    `json:"priceAmount"`
	Slug         string `json:"slug"`
	Status       string `json:"status"`
	Title        string `json:"title"`
}

type UpsertProfessionalWorkspaceProfileRequest struct {
	Attributes  map[string]any `json:"attributes"`
	City        string         `json:"city"`
	DisplayName string         `json:"displayName"`
	Slug        string         `json:"slug,omitempty"`
}

type ReplaceProfessionalPortfolioRequest struct {
	Entries []ProfessionalPortfolioEntryInput `json:"entries"`
	Gallery []ProfessionalGalleryAssetInput   `json:"gallery"`
}

type ProfessionalPortfolioEntryInput struct {
	AssetURL    string         `json:"assetUrl"`
	Description string         `json:"description"`
	ID          string         `json:"id,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	SortOrder   int            `json:"sortOrder"`
	Title       string         `json:"title"`
}

type ProfessionalGalleryAssetInput struct {
	AssetURL  string         `json:"assetUrl"`
	Caption   string         `json:"caption"`
	FileName  string         `json:"fileName"`
	ID        string         `json:"id,omitempty"`
	Metadata  map[string]any `json:"metadata,omitempty"`
	SortOrder int            `json:"sortOrder"`
}

type ReplaceProfessionalTrustRequest struct {
	Credentials []ProfessionalCredentialInput `json:"credentials"`
	Stories     []ProfessionalStoryInput      `json:"stories"`
}

type ProfessionalCredentialInput struct {
	CredentialCode string         `json:"credentialCode"`
	ExpiresAt      string         `json:"expiresAt,omitempty"`
	ID             string         `json:"id,omitempty"`
	IssuedAt       string         `json:"issuedAt,omitempty"`
	Issuer         string         `json:"issuer"`
	Label          string         `json:"label"`
	Metadata       map[string]any `json:"metadata,omitempty"`
}

type ProfessionalStoryInput struct {
	Body        string         `json:"body"`
	ID          string         `json:"id,omitempty"`
	IsPublished bool           `json:"isPublished"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	SortOrder   int            `json:"sortOrder"`
	Title       string         `json:"title"`
}

type ReplaceProfessionalCoverageRequest struct {
	Areas []ProfessionalCoverageAreaInput `json:"areas"`
}

type ProfessionalCoverageAreaInput struct {
	AreaLabel string         `json:"areaLabel"`
	City      string         `json:"city"`
	ID        string         `json:"id,omitempty"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

type ReplaceProfessionalAvailabilityRequest struct {
	Rules []ProfessionalAvailabilityRuleInput `json:"rules"`
}

type ProfessionalAvailabilityRuleInput struct {
	EndTime       string         `json:"endTime"`
	ID            string         `json:"id,omitempty"`
	IsUnavailable bool           `json:"isUnavailable"`
	Metadata      map[string]any `json:"metadata,omitempty"`
	StartTime     string         `json:"startTime"`
	Weekday       int            `json:"weekday"`
}

type UpdateProfessionalNotificationPreferencesRequest struct {
	EmailEnabled    bool           `json:"emailEnabled"`
	Metadata        map[string]any `json:"metadata,omitempty"`
	WhatsAppEnabled bool           `json:"whatsappEnabled"`
	WebEnabled      bool           `json:"webEnabled"`
}
