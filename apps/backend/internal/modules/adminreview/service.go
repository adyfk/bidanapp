package adminreview

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var (
	ErrDatabaseUnavailable = errors.New("admin review requires a database connection")
	ErrInvalidPayload      = errors.New("invalid review payload")
	ErrNotFound            = errors.New("professional application not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListPlatformApplications(ctx context.Context, platformID string) (ProfessionalApplicationReviewList, error) {
	if s.db == nil {
		return ProfessionalApplicationReviewList{}, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			pa.id,
			pa.platform_id,
			pa.user_id,
			pa.status,
			pa.attributes,
			pa.submitted_at,
			pa.reviewed_at,
			pa.review_notes,
			COALESCE(pp.id, ''),
			COALESCE(pp.display_name, ''),
			COALESCE(pp.city, ''),
			COALESCE(pp.slug, ''),
			COALESCE(pp.status, ''),
			COALESCE(pp.review_status, '')
		FROM professional_applications pa
		LEFT JOIN professional_platform_profiles pp
			ON pp.id = pa.profile_id
		WHERE pa.platform_id = $1
		ORDER BY
			CASE pa.status
				WHEN 'submitted' THEN 0
				WHEN 'changes_requested' THEN 1
				WHEN 'approved' THEN 2
				WHEN 'rejected' THEN 3
				ELSE 4
			END,
			pa.submitted_at DESC NULLS LAST,
			pa.created_at DESC
	`, platformID)
	if err != nil {
		return ProfessionalApplicationReviewList{}, err
	}
	defer rows.Close()

	items := make([]ProfessionalApplicationReviewItem, 0)
	for rows.Next() {
		var item ProfessionalApplicationReviewItem
		var attributesJSON []byte
		var submittedAt sql.NullTime
		var reviewedAt sql.NullTime
		if err := rows.Scan(
			&item.ApplicationID,
			&item.PlatformID,
			&item.UserID,
			&item.ApplicationStatus,
			&attributesJSON,
			&submittedAt,
			&reviewedAt,
			&item.ReviewNotes,
			&item.ProfileID,
			&item.DisplayName,
			&item.City,
			&item.Slug,
			&item.ProfileStatus,
			&item.ReviewStatus,
		); err != nil {
			return ProfessionalApplicationReviewList{}, err
		}
		if len(attributesJSON) > 0 {
			if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
				return ProfessionalApplicationReviewList{}, err
			}
		}
		if submittedAt.Valid {
			item.SubmittedAt = submittedAt.Time.UTC().Format(time.RFC3339)
		}
		if reviewedAt.Valid {
			item.ReviewedAt = reviewedAt.Time.UTC().Format(time.RFC3339)
		}

		documents, err := s.loadDocuments(ctx, item.ApplicationID)
		if err != nil {
			return ProfessionalApplicationReviewList{}, err
		}
		item.Documents = documents
		items = append(items, item)
	}

	return ProfessionalApplicationReviewList{Applications: items}, rows.Err()
}

func (s *Service) ReviewApplication(
	ctx context.Context,
	platformID string,
	applicationID string,
	adminID string,
	input ReviewProfessionalApplicationRequest,
) (ProfessionalApplicationReviewItem, error) {
	if s.db == nil {
		return ProfessionalApplicationReviewItem{}, ErrDatabaseUnavailable
	}

	decision := strings.TrimSpace(input.Decision)
	if decision != "approved" && decision != "changes_requested" && decision != "rejected" {
		return ProfessionalApplicationReviewItem{}, ErrInvalidPayload
	}

	profileStatus := mapDecisionToProfileStatus(decision)
	reviewStatus := decision
	now := time.Now().UTC()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var profileID string
	var userID string
	err = tx.QueryRowContext(ctx, `
		SELECT COALESCE(profile_id, ''), user_id
		FROM professional_applications
		WHERE id = $1 AND platform_id = $2
	`, applicationID, platformID).Scan(&profileID, &userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ProfessionalApplicationReviewItem{}, ErrNotFound
		}
		return ProfessionalApplicationReviewItem{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE professional_applications
		SET status = $3,
		    review_notes = $4,
		    reviewed_at = $5,
		    updated_at = $5
		WHERE id = $1 AND platform_id = $2
	`, applicationID, platformID, decision, strings.TrimSpace(input.ReviewNotes), now); err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE professional_platform_profiles
		SET status = $3,
		    review_status = $4,
		    updated_at = $5
		WHERE id = $1 AND platform_id = $2
	`, profileID, platformID, profileStatus, reviewStatus, now); err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}

	eventPayload, err := json.Marshal(map[string]any{
		"adminId":       adminID,
		"applicationId": applicationID,
		"decision":      decision,
		"reviewNotes":   strings.TrimSpace(input.ReviewNotes),
	})
	if err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}

	eventID, err := newID("evt_")
	if err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO outbox_events (
			id,
			topic,
			aggregate_type,
			aggregate_id,
			payload,
			status,
			available_at,
			created_at
		) VALUES ($1, 'professional_application_reviews', 'professional_application', $2, $3, 'pending', $4, $4)
	`, eventID, userID, eventPayload, now); err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}

	items, err := s.ListPlatformApplications(ctx, platformID)
	if err != nil {
		return ProfessionalApplicationReviewItem{}, err
	}
	for _, item := range items.Applications {
		if item.ApplicationID == applicationID {
			return item, nil
		}
	}

	return ProfessionalApplicationReviewItem{}, ErrNotFound
}

func (s *Service) loadDocuments(ctx context.Context, applicationID string) ([]ProfessionalDocumentSummary, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, document_key, file_name, document_url, metadata
		FROM professional_documents
		WHERE application_id = $1
		ORDER BY document_key ASC, created_at DESC
	`, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	documents := make([]ProfessionalDocumentSummary, 0)
	for rows.Next() {
		var document ProfessionalDocumentSummary
		if err := rows.Scan(&document.ID, &document.DocumentKey, &document.FileName, &document.DocumentURL, &document.Metadata); err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	return documents, rows.Err()
}

func mapDecisionToProfileStatus(decision string) string {
	switch decision {
	case "approved":
		return "approved"
	case "rejected":
		return "rejected"
	default:
		return "pending_review"
	}
}

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}
