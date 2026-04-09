package adminreview

import "encoding/json"

const SecuritySchemeName = "AdminSessionAuth"

type ProfessionalDocumentSummary struct {
	DocumentKey string          `json:"documentKey"`
	DocumentURL string          `json:"documentUrl"`
	FileName    string          `json:"fileName"`
	ID          string          `json:"id"`
	Metadata    json.RawMessage `json:"metadata,omitempty"`
}

type ProfessionalApplicationReviewItem struct {
	ApplicationID     string                        `json:"applicationId"`
	ApplicationStatus string                        `json:"applicationStatus"`
	Attributes        map[string]any                `json:"attributes"`
	City              string                        `json:"city,omitempty"`
	DisplayName       string                        `json:"displayName,omitempty"`
	Documents         []ProfessionalDocumentSummary `json:"documents"`
	PlatformID        string                        `json:"platformId"`
	ProfileID         string                        `json:"profileId,omitempty"`
	ProfileStatus     string                        `json:"profileStatus,omitempty"`
	ReviewNotes       string                        `json:"reviewNotes,omitempty"`
	ReviewStatus      string                        `json:"reviewStatus,omitempty"`
	ReviewedAt        string                        `json:"reviewedAt,omitempty"`
	Slug              string                        `json:"slug,omitempty"`
	SubmittedAt       string                        `json:"submittedAt,omitempty"`
	UserID            string                        `json:"userId"`
}

type ProfessionalApplicationReviewList struct {
	Applications []ProfessionalApplicationReviewItem `json:"applications"`
}

type ReviewProfessionalApplicationRequest struct {
	Decision    string `json:"decision" required:"true"`
	ReviewNotes string `json:"reviewNotes,omitempty"`
}
