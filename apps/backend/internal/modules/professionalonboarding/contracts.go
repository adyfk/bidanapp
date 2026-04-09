package professionalonboarding

import "bidanapp/apps/backend/internal/modules/platformregistry"

const SecuritySchemeName = "ViewerSessionAuth"

type ProfessionalPlatformDocument struct {
	DocumentKey string         `json:"documentKey"`
	DocumentURL string         `json:"documentUrl"`
	FileName    string         `json:"fileName"`
	ID          string         `json:"id"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type ProfessionalPlatformProfile struct {
	Attributes   map[string]any `json:"attributes"`
	City         string         `json:"city"`
	DisplayName  string         `json:"displayName"`
	ID           string         `json:"id"`
	PlatformID   string         `json:"platformId"`
	ReviewStatus string         `json:"reviewStatus"`
	Slug         string         `json:"slug"`
	Status       string         `json:"status"`
	UpdatedAt    string         `json:"updatedAt"`
	UserID       string         `json:"userId"`
}

type ProfessionalPlatformApplication struct {
	Attributes  map[string]any                 `json:"attributes"`
	Documents   []ProfessionalPlatformDocument `json:"documents"`
	ID          string                         `json:"id"`
	PlatformID  string                         `json:"platformId"`
	ReviewNotes string                         `json:"reviewNotes,omitempty"`
	Status      string                         `json:"status"`
	SubmittedAt string                         `json:"submittedAt,omitempty"`
	UserID      string                         `json:"userId"`
}

type ProfessionalPlatformWorkspace struct {
	Application *ProfessionalPlatformApplication            `json:"application,omitempty"`
	Platform    platformregistry.PlatformDefinition         `json:"platform"`
	Profile     *ProfessionalPlatformProfile                `json:"profile,omitempty"`
	Schema      platformregistry.PlatformProfessionalSchema `json:"schema"`
}

type IssueProfessionalDocumentUploadRequest struct {
	ContentType string `json:"contentType,omitempty"`
	DocumentKey string `json:"documentKey" required:"true"`
	FileName    string `json:"fileName" required:"true"`
}

type ProfessionalDocumentUploadToken struct {
	DocumentID  string `json:"documentId"`
	DocumentURL string `json:"documentUrl"`
	ExpiresAt   string `json:"expiresAt"`
	Method      string `json:"method"`
	UploadURL   string `json:"uploadUrl"`
}

type UpsertProfessionalPlatformApplicationRequest struct {
	Attributes  map[string]any `json:"attributes"`
	City        string         `json:"city"`
	DisplayName string         `json:"displayName"`
	Slug        string         `json:"slug,omitempty"`
}
