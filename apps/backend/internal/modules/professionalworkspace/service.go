package professionalworkspace

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
	ErrDatabaseUnavailable = errors.New("professional workspace requires a database connection")
	ErrInvalidPayload      = errors.New("invalid professional workspace payload")
	ErrProfileNotFound     = errors.New("professional platform profile not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Snapshot(ctx context.Context, platformID string, userID string) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}

	snapshot := ProfessionalWorkspaceSnapshot{
		AvailabilityRules: []ProfessionalAvailabilityRule{},
		CoverageAreas:     []ProfessionalCoverageArea{},
		Credentials:       []ProfessionalCredential{},
		GalleryAssets:     []ProfessionalGalleryAsset{},
		Offerings:         []ProfessionalWorkspaceOffering{},
		PortfolioEntries:  []ProfessionalPortfolioEntry{},
		RecentOrders:      []ProfessionalOrderSummary{},
		Stories:           []ProfessionalStory{},
		NotificationPreferences: ProfessionalNotificationPreferences{
			EmailEnabled:    false,
			ProfileID:       "",
			WhatsAppEnabled: false,
			WebEnabled:      true,
		},
	}

	profile, err := s.loadProfile(ctx, platformID, userID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	if err == nil {
		snapshot.Profile = profile
	}

	application, err := s.loadApplication(ctx, platformID, userID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	if err == nil {
		snapshot.Application = application
	}

	snapshot.Offerings, err = s.loadOfferings(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.RecentOrders, err = s.ListOrders(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	if profile == nil {
		return snapshot, nil
	}

	snapshot.PortfolioEntries, err = s.loadPortfolioEntries(ctx, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.GalleryAssets, err = s.loadGalleryAssets(ctx, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.Credentials, err = s.loadCredentials(ctx, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.Stories, err = s.loadStories(ctx, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.CoverageAreas, err = s.loadCoverage(ctx, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.AvailabilityRules, err = s.loadAvailability(ctx, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	snapshot.NotificationPreferences, err = s.loadNotificationPreferences(ctx, platformID, profile.ID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	return snapshot, nil
}

func (s *Service) ListOrders(ctx context.Context, platformID string, userID string) ([]ProfessionalOrderSummary, error) {
	if s.db == nil {
		return nil, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT o.id, off.title, o.order_type, o.status, o.payment_status, o.total_amount, o.currency
		FROM orders o
		JOIN offerings off ON off.id = o.offering_id
		WHERE o.platform_id = $1
		  AND o.professional_user_id = $2
		ORDER BY o.created_at DESC
	`, platformID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalOrderSummary, 0)
	for rows.Next() {
		var item ProfessionalOrderSummary
		if err := rows.Scan(
			&item.ID,
			&item.OfferingTitle,
			&item.OrderType,
			&item.Status,
			&item.PaymentStatus,
			&item.TotalAmount,
			&item.Currency,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) UpsertProfile(
	ctx context.Context,
	platformID string,
	userID string,
	input UpsertProfessionalWorkspaceProfileRequest,
) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.DisplayName) == "" {
		return ProfessionalWorkspaceSnapshot{}, ErrInvalidPayload
	}

	attributesJSON, err := json.Marshal(input.Attributes)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	slug := strings.TrimSpace(input.Slug)
	if slug == "" {
		slug = slugify(input.DisplayName, userID)
	} else {
		slug = slugify(slug, userID)
	}

	profileID, err := newID("pprof_")
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO professional_platform_profiles (
			id,
			platform_id,
			user_id,
			slug,
			display_name,
			city,
			status,
			review_status,
			attributes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, 'draft', 'draft', $7, now(), now())
		ON CONFLICT (platform_id, user_id) DO UPDATE SET
			slug = EXCLUDED.slug,
			display_name = EXCLUDED.display_name,
			city = EXCLUDED.city,
			attributes = EXCLUDED.attributes,
			updated_at = now()
	`, profileID, platformID, userID, slug, strings.TrimSpace(input.DisplayName), strings.TrimSpace(input.City), attributesJSON)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	return s.Snapshot(ctx, platformID, userID)
}

func (s *Service) ReplacePortfolio(
	ctx context.Context,
	platformID string,
	userID string,
	input ReplaceProfessionalPortfolioRequest,
) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}

	profile, err := s.requireProfile(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `DELETE FROM professional_portfolio_entries WHERE profile_id = $1`, profile.ID); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM professional_gallery_assets WHERE profile_id = $1`, profile.ID); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	for _, entry := range input.Entries {
		id := strings.TrimSpace(entry.ID)
		if id == "" {
			id, err = newID("pport_")
			if err != nil {
				return ProfessionalWorkspaceSnapshot{}, err
			}
		}
		metadataJSON, err := json.Marshal(entry.Metadata)
		if err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_portfolio_entries (
				id, profile_id, platform_id, title, description, asset_url, sort_order, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
		`, id, profile.ID, platformID, strings.TrimSpace(entry.Title), strings.TrimSpace(entry.Description), strings.TrimSpace(entry.AssetURL), entry.SortOrder, metadataJSON); err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
	}

	for _, asset := range input.Gallery {
		id := strings.TrimSpace(asset.ID)
		if id == "" {
			id, err = newID("pgal_")
			if err != nil {
				return ProfessionalWorkspaceSnapshot{}, err
			}
		}
		metadataJSON, err := json.Marshal(asset.Metadata)
		if err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_gallery_assets (
				id, profile_id, platform_id, file_name, asset_url, caption, sort_order, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
		`, id, profile.ID, platformID, strings.TrimSpace(asset.FileName), strings.TrimSpace(asset.AssetURL), strings.TrimSpace(asset.Caption), asset.SortOrder, metadataJSON); err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	return s.Snapshot(ctx, platformID, userID)
}

func (s *Service) ReplaceTrust(
	ctx context.Context,
	platformID string,
	userID string,
	input ReplaceProfessionalTrustRequest,
) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}

	profile, err := s.requireProfile(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `DELETE FROM professional_credentials WHERE profile_id = $1`, profile.ID); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM professional_stories WHERE profile_id = $1`, profile.ID); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	for _, item := range input.Credentials {
		id := strings.TrimSpace(item.ID)
		if id == "" {
			id, err = newID("pcred_")
			if err != nil {
				return ProfessionalWorkspaceSnapshot{}, err
			}
		}
		metadataJSON, err := json.Marshal(item.Metadata)
		if err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_credentials (
				id, profile_id, platform_id, label, issuer, credential_code, issued_at, expires_at, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::timestamptz, NULLIF($8, '')::timestamptz, $9, now(), now())
		`, id, profile.ID, platformID, strings.TrimSpace(item.Label), strings.TrimSpace(item.Issuer), strings.TrimSpace(item.CredentialCode), strings.TrimSpace(item.IssuedAt), strings.TrimSpace(item.ExpiresAt), metadataJSON); err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
	}

	for _, item := range input.Stories {
		id := strings.TrimSpace(item.ID)
		if id == "" {
			id, err = newID("pstory_")
			if err != nil {
				return ProfessionalWorkspaceSnapshot{}, err
			}
		}
		metadataJSON, err := json.Marshal(item.Metadata)
		if err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_stories (
				id, profile_id, platform_id, title, body, sort_order, is_published, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
		`, id, profile.ID, platformID, strings.TrimSpace(item.Title), strings.TrimSpace(item.Body), item.SortOrder, item.IsPublished, metadataJSON); err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	return s.Snapshot(ctx, platformID, userID)
}

func (s *Service) ReplaceCoverage(
	ctx context.Context,
	platformID string,
	userID string,
	input ReplaceProfessionalCoverageRequest,
) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}

	profile, err := s.requireProfile(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `DELETE FROM professional_coverage_areas WHERE profile_id = $1`, profile.ID); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	for _, item := range input.Areas {
		id := strings.TrimSpace(item.ID)
		if id == "" {
			id, err = newID("pcov_")
			if err != nil {
				return ProfessionalWorkspaceSnapshot{}, err
			}
		}
		metadataJSON, err := json.Marshal(item.Metadata)
		if err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_coverage_areas (
				id, profile_id, platform_id, city, area_label, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, now(), now())
		`, id, profile.ID, platformID, strings.TrimSpace(item.City), strings.TrimSpace(item.AreaLabel), metadataJSON); err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	return s.Snapshot(ctx, platformID, userID)
}

func (s *Service) ReplaceAvailability(
	ctx context.Context,
	platformID string,
	userID string,
	input ReplaceProfessionalAvailabilityRequest,
) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}

	profile, err := s.requireProfile(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `DELETE FROM professional_availability_rules WHERE profile_id = $1`, profile.ID); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	for _, item := range input.Rules {
		id := strings.TrimSpace(item.ID)
		if id == "" {
			id, err = newID("pav_")
			if err != nil {
				return ProfessionalWorkspaceSnapshot{}, err
			}
		}
		metadataJSON, err := json.Marshal(item.Metadata)
		if err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_availability_rules (
				id, profile_id, platform_id, weekday, start_time, end_time, is_unavailable, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
		`, id, profile.ID, platformID, item.Weekday, strings.TrimSpace(item.StartTime), strings.TrimSpace(item.EndTime), item.IsUnavailable, metadataJSON); err != nil {
			return ProfessionalWorkspaceSnapshot{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}
	return s.Snapshot(ctx, platformID, userID)
}

func (s *Service) UpdateNotifications(
	ctx context.Context,
	platformID string,
	userID string,
	input UpdateProfessionalNotificationPreferencesRequest,
) (ProfessionalWorkspaceSnapshot, error) {
	if s.db == nil {
		return ProfessionalWorkspaceSnapshot{}, ErrDatabaseUnavailable
	}

	profile, err := s.requireProfile(ctx, platformID, userID)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	metadataJSON, err := json.Marshal(input.Metadata)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO professional_notification_preferences (
			profile_id, platform_id, web_enabled, email_enabled, whatsapp_enabled, metadata, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, now(), now())
		ON CONFLICT (profile_id) DO UPDATE SET
			web_enabled = EXCLUDED.web_enabled,
			email_enabled = EXCLUDED.email_enabled,
			whatsapp_enabled = EXCLUDED.whatsapp_enabled,
			metadata = EXCLUDED.metadata,
			updated_at = now()
	`, profile.ID, platformID, input.WebEnabled, input.EmailEnabled, input.WhatsAppEnabled, metadataJSON)
	if err != nil {
		return ProfessionalWorkspaceSnapshot{}, err
	}

	return s.Snapshot(ctx, platformID, userID)
}

func (s *Service) requireProfile(ctx context.Context, platformID string, userID string) (*ProfessionalWorkspaceProfile, error) {
	profile, err := s.loadProfile(ctx, platformID, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}
	return profile, nil
}

func (s *Service) loadProfile(ctx context.Context, platformID string, userID string) (*ProfessionalWorkspaceProfile, error) {
	var item ProfessionalWorkspaceProfile
	var attributesJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT id, display_name, city, slug, status, review_status, attributes
		FROM professional_platform_profiles
		WHERE platform_id = $1 AND user_id = $2
	`, platformID, userID).Scan(
		&item.ID,
		&item.DisplayName,
		&item.City,
		&item.Slug,
		&item.Status,
		&item.ReviewStatus,
		&attributesJSON,
	)
	if err != nil {
		return nil, err
	}
	item.PlatformID = platformID
	item.UserID = userID
	if len(attributesJSON) > 0 {
		if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
			return nil, err
		}
	}
	return &item, nil
}

func (s *Service) loadApplication(ctx context.Context, platformID string, userID string) (*ProfessionalWorkspaceApplication, error) {
	var item ProfessionalWorkspaceApplication
	var attributesJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT id, status, review_notes, attributes
		FROM professional_applications
		WHERE platform_id = $1 AND user_id = $2
	`, platformID, userID).Scan(
		&item.ID,
		&item.Status,
		&item.ReviewNotes,
		&attributesJSON,
	)
	if err != nil {
		return nil, err
	}
	item.PlatformID = platformID
	item.UserID = userID
	if len(attributesJSON) > 0 {
		if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
			return nil, err
		}
	}
	documents, err := s.loadDocuments(ctx, item.ID)
	if err != nil {
		return nil, err
	}
	item.Documents = documents
	return &item, nil
}

func (s *Service) loadDocuments(ctx context.Context, applicationID string) ([]ProfessionalWorkspaceDocument, error) {
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

	items := make([]ProfessionalWorkspaceDocument, 0)
	for rows.Next() {
		var item ProfessionalWorkspaceDocument
		var metadataJSON []byte
		if err := rows.Scan(&item.ID, &item.DocumentKey, &item.FileName, &item.DocumentURL, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadOfferings(ctx context.Context, platformID string, userID string) ([]ProfessionalWorkspaceOffering, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, slug, offering_type, delivery_mode, price_amount, currency, status
		FROM offerings
		WHERE platform_id = $1 AND professional_user_id = $2
		ORDER BY updated_at DESC
	`, platformID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalWorkspaceOffering, 0)
	for rows.Next() {
		var item ProfessionalWorkspaceOffering
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Slug,
			&item.OfferingType,
			&item.DeliveryMode,
			&item.PriceAmount,
			&item.Currency,
			&item.Status,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadPortfolioEntries(ctx context.Context, profileID string) ([]ProfessionalPortfolioEntry, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, description, asset_url, sort_order, metadata
		FROM professional_portfolio_entries
		WHERE profile_id = $1
		ORDER BY sort_order ASC, updated_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalPortfolioEntry, 0)
	for rows.Next() {
		var item ProfessionalPortfolioEntry
		var metadataJSON []byte
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.AssetURL, &item.SortOrder, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadGalleryAssets(ctx context.Context, profileID string) ([]ProfessionalGalleryAsset, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, file_name, asset_url, caption, sort_order, metadata
		FROM professional_gallery_assets
		WHERE profile_id = $1
		ORDER BY sort_order ASC, updated_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalGalleryAsset, 0)
	for rows.Next() {
		var item ProfessionalGalleryAsset
		var metadataJSON []byte
		if err := rows.Scan(&item.ID, &item.FileName, &item.AssetURL, &item.Caption, &item.SortOrder, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadCredentials(ctx context.Context, profileID string) ([]ProfessionalCredential, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, label, issuer, credential_code, issued_at, expires_at, metadata
		FROM professional_credentials
		WHERE profile_id = $1
		ORDER BY created_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalCredential, 0)
	for rows.Next() {
		var item ProfessionalCredential
		var metadataJSON []byte
		var issuedAt sql.NullTime
		var expiresAt sql.NullTime
		if err := rows.Scan(&item.ID, &item.Label, &item.Issuer, &item.CredentialCode, &issuedAt, &expiresAt, &metadataJSON); err != nil {
			return nil, err
		}
		if issuedAt.Valid {
			item.IssuedAt = issuedAt.Time.UTC().Format(time.RFC3339)
		}
		if expiresAt.Valid {
			item.ExpiresAt = expiresAt.Time.UTC().Format(time.RFC3339)
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadStories(ctx context.Context, profileID string) ([]ProfessionalStory, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, body, sort_order, is_published, metadata
		FROM professional_stories
		WHERE profile_id = $1
		ORDER BY sort_order ASC, updated_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalStory, 0)
	for rows.Next() {
		var item ProfessionalStory
		var metadataJSON []byte
		if err := rows.Scan(&item.ID, &item.Title, &item.Body, &item.SortOrder, &item.IsPublished, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadCoverage(ctx context.Context, profileID string) ([]ProfessionalCoverageArea, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, city, area_label, metadata
		FROM professional_coverage_areas
		WHERE profile_id = $1
		ORDER BY created_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalCoverageArea, 0)
	for rows.Next() {
		var item ProfessionalCoverageArea
		var metadataJSON []byte
		if err := rows.Scan(&item.ID, &item.City, &item.AreaLabel, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadAvailability(ctx context.Context, profileID string) ([]ProfessionalAvailabilityRule, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, weekday, start_time, end_time, is_unavailable, metadata
		FROM professional_availability_rules
		WHERE profile_id = $1
		ORDER BY weekday ASC, start_time ASC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProfessionalAvailabilityRule, 0)
	for rows.Next() {
		var item ProfessionalAvailabilityRule
		var metadataJSON []byte
		if err := rows.Scan(&item.ID, &item.Weekday, &item.StartTime, &item.EndTime, &item.IsUnavailable, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
				return nil, err
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) loadNotificationPreferences(ctx context.Context, platformID string, profileID string) (ProfessionalNotificationPreferences, error) {
	item := ProfessionalNotificationPreferences{
		EmailEnabled:    false,
		ProfileID:       profileID,
		WhatsAppEnabled: false,
		WebEnabled:      true,
	}
	var metadataJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT web_enabled, email_enabled, whatsapp_enabled, metadata
		FROM professional_notification_preferences
		WHERE profile_id = $1 AND platform_id = $2
	`, profileID, platformID).Scan(&item.WebEnabled, &item.EmailEnabled, &item.WhatsAppEnabled, &metadataJSON)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return item, nil
		}
		return ProfessionalNotificationPreferences{}, err
	}
	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &item.Metadata); err != nil {
			return ProfessionalNotificationPreferences{}, err
		}
	}
	return item, nil
}

func slugify(value string, fallback string) string {
	slug := strings.ToLower(strings.TrimSpace(value))
	slug = strings.ReplaceAll(slug, "_", "-")
	slug = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == '-':
			return r
		default:
			return '-'
		}
	}, slug)
	slug = strings.Trim(strings.Join(strings.FieldsFunc(slug, func(r rune) bool { return r == '-' }), "-"), "-")
	if slug == "" {
		return "professional-" + fallback
	}
	return slug
}

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}
