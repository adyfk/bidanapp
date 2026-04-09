package directory

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrDatabaseUnavailable  = errors.New("directory requires a database connection")
	ErrOfferingNotFound     = errors.New("directory offering not found")
	ErrProfessionalNotFound = errors.New("directory professional not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListProfessionals(ctx context.Context, platformID string) (DirectoryProfessionalList, error) {
	if s.db == nil {
		return DirectoryProfessionalList{}, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			pp.id,
			pp.user_id,
			pp.display_name,
			pp.city,
			pp.slug,
			pp.attributes,
			COALESCE((
				SELECT COUNT(*)
				FROM offerings o
				WHERE o.professional_profile_id = pp.id
				  AND o.status = 'published'
			), 0),
			COALESCE((
				SELECT MIN(price_amount)
				FROM offerings o
				WHERE o.professional_profile_id = pp.id
				  AND o.status = 'published'
			), 0)
		FROM professional_platform_profiles pp
		WHERE pp.platform_id = $1
		  AND pp.status = 'approved'
		  AND pp.review_status = 'approved'
		ORDER BY pp.updated_at DESC, pp.display_name ASC
	`, platformID)
	if err != nil {
		return DirectoryProfessionalList{}, err
	}
	defer rows.Close()

	items := make([]DirectoryProfessional, 0)
	for rows.Next() {
		item, err := scanProfessional(rows, platformID)
		if err != nil {
			return DirectoryProfessionalList{}, err
		}
		item.CoverageAreas, err = s.coverageAreas(ctx, item.ID)
		if err != nil {
			return DirectoryProfessionalList{}, err
		}
		items = append(items, item)
	}

	return DirectoryProfessionalList{Professionals: items}, rows.Err()
}

func (s *Service) ProfessionalBySlug(ctx context.Context, platformID string, slug string) (DirectoryProfessionalDetail, error) {
	if s.db == nil {
		return DirectoryProfessionalDetail{}, ErrDatabaseUnavailable
	}

	var item DirectoryProfessional
	var attributesJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT
			pp.id,
			pp.user_id,
			pp.display_name,
			pp.city,
			pp.slug,
			pp.attributes,
			COALESCE((
				SELECT COUNT(*)
				FROM offerings o
				WHERE o.professional_profile_id = pp.id
				  AND o.status = 'published'
			), 0),
			COALESCE((
				SELECT MIN(price_amount)
				FROM offerings o
				WHERE o.professional_profile_id = pp.id
				  AND o.status = 'published'
			), 0)
		FROM professional_platform_profiles pp
		WHERE pp.platform_id = $1
		  AND pp.slug = $2
		  AND pp.status = 'approved'
		  AND pp.review_status = 'approved'
	`, platformID, slug).Scan(
		&item.ID,
		&item.UserID,
		&item.DisplayName,
		&item.City,
		&item.Slug,
		&attributesJSON,
		&item.OfferingCount,
		&item.StartingPrice,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return DirectoryProfessionalDetail{}, ErrProfessionalNotFound
		}
		return DirectoryProfessionalDetail{}, err
	}
	item.PlatformID = platformID
	if len(attributesJSON) > 0 {
		if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
			return DirectoryProfessionalDetail{}, err
		}
	}

	item.CoverageAreas, err = s.coverageAreas(ctx, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}

	offerings, err := s.offeringsByProfessional(ctx, platformID, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	stories, err := s.storiesByProfessional(ctx, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	credentials, err := s.credentialsByProfessional(ctx, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	portfolio, err := s.portfolioByProfessional(ctx, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	gallery, err := s.galleryByProfessional(ctx, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	coverage, err := s.coverageSummaryByProfessional(ctx, item.ID, item.City)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	availability, err := s.availabilitySummaryByProfessional(ctx, item.ID)
	if err != nil {
		return DirectoryProfessionalDetail{}, err
	}
	profile := buildPublicProfile(item.Attributes)

	return DirectoryProfessionalDetail{
		Availability: availability,
		Coverage:     coverage,
		Credentials:  credentials,
		Gallery:      gallery,
		Offerings:    offerings,
		Portfolio:    portfolio,
		Professional: item,
		Profile:      profile,
		Stories:      stories,
		TrustMetrics: buildTrustMetrics(credentials, coverage, offerings, stories),
	}, nil
}

func (s *Service) ListOfferings(ctx context.Context, platformID string) (DirectoryOfferingList, error) {
	if s.db == nil {
		return DirectoryOfferingList{}, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			o.id,
			o.slug,
			o.title,
			o.description,
			o.offering_type,
			o.delivery_mode,
			o.price_amount,
			o.currency,
			pp.id,
			pp.slug,
			pp.display_name,
			o.professional_user_id
		FROM offerings o
		JOIN professional_platform_profiles pp
		  ON pp.id = o.professional_profile_id
		WHERE o.platform_id = $1
		  AND o.status = 'published'
		  AND pp.status = 'approved'
		  AND pp.review_status = 'approved'
		ORDER BY o.updated_at DESC, o.title ASC
	`, platformID)
	if err != nil {
		return DirectoryOfferingList{}, err
	}
	defer rows.Close()

	items := make([]DirectoryOffering, 0)
	for rows.Next() {
		item, err := scanOffering(rows, platformID)
		if err != nil {
			return DirectoryOfferingList{}, err
		}
		items = append(items, item)
	}

	return DirectoryOfferingList{Offerings: items}, rows.Err()
}

func (s *Service) OfferingBySlug(ctx context.Context, platformID string, slug string) (DirectoryOfferingDetail, error) {
	if s.db == nil {
		return DirectoryOfferingDetail{}, ErrDatabaseUnavailable
	}

	var offering DirectoryOffering
	err := s.db.QueryRowContext(ctx, `
		SELECT
			o.id,
			o.slug,
			o.title,
			o.description,
			o.offering_type,
			o.delivery_mode,
			o.price_amount,
			o.currency,
			pp.id,
			pp.slug,
			pp.display_name,
			o.professional_user_id
		FROM offerings o
		JOIN professional_platform_profiles pp
		  ON pp.id = o.professional_profile_id
		WHERE o.platform_id = $1
		  AND o.slug = $2
		  AND o.status = 'published'
	`, platformID, slug).Scan(
		&offering.ID,
		&offering.Slug,
		&offering.Title,
		&offering.Description,
		&offering.OfferingType,
		&offering.DeliveryMode,
		&offering.PriceAmount,
		&offering.Currency,
		&offering.ProfessionalID,
		&offering.ProfessionalSlug,
		&offering.ProfessionalDisplayName,
		&offering.ProfessionalUserID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return DirectoryOfferingDetail{}, ErrOfferingNotFound
		}
		return DirectoryOfferingDetail{}, err
	}
	offering.PlatformID = platformID

	related, err := s.offeringsByProfessional(ctx, platformID, offering.ProfessionalID)
	if err != nil {
		return DirectoryOfferingDetail{}, err
	}
	filtered := make([]DirectoryOffering, 0, len(related))
	for _, item := range related {
		if item.ID == offering.ID {
			continue
		}
		filtered = append(filtered, item)
	}

	return DirectoryOfferingDetail{
		Offering: offering,
		Related:  filtered,
	}, nil
}

func (s *Service) offeringsByProfessional(ctx context.Context, platformID string, profileID string) ([]DirectoryOffering, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			o.id,
			o.slug,
			o.title,
			o.description,
			o.offering_type,
			o.delivery_mode,
			o.price_amount,
			o.currency,
			pp.id,
			pp.slug,
			pp.display_name,
			o.professional_user_id
		FROM offerings o
		JOIN professional_platform_profiles pp
		  ON pp.id = o.professional_profile_id
		WHERE o.platform_id = $1
		  AND o.professional_profile_id = $2
		  AND o.status = 'published'
		ORDER BY o.updated_at DESC, o.title ASC
	`, platformID, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DirectoryOffering, 0)
	for rows.Next() {
		item, err := scanOffering(rows, platformID)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) coverageAreas(ctx context.Context, profileID string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT area_label
		FROM professional_coverage_areas
		WHERE profile_id = $1
		ORDER BY created_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]string, 0)
	for rows.Next() {
		var label string
		if err := rows.Scan(&label); err != nil {
			return nil, err
		}
		if label != "" {
			items = append(items, label)
		}
	}
	return items, rows.Err()
}

func (s *Service) storiesByProfessional(ctx context.Context, profileID string) ([]DirectoryStory, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, body, sort_order, is_published
		FROM professional_stories
		WHERE profile_id = $1
		  AND is_published = true
		ORDER BY sort_order ASC, updated_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DirectoryStory, 0)
	for rows.Next() {
		var item DirectoryStory
		if err := rows.Scan(&item.ID, &item.Title, &item.Body, &item.SortOrder, &item.IsPublished); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) credentialsByProfessional(ctx context.Context, profileID string) ([]DirectoryTrustCredential, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT label, issuer, credential_code
		FROM professional_credentials
		WHERE profile_id = $1
		ORDER BY created_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DirectoryTrustCredential, 0)
	for rows.Next() {
		var item DirectoryTrustCredential
		if err := rows.Scan(&item.Label, &item.Issuer, &item.CredentialCode); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) portfolioByProfessional(ctx context.Context, profileID string) ([]DirectoryProfessionalPortfolioItem, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, description, asset_url, sort_order
		FROM professional_portfolio_entries
		WHERE profile_id = $1
		ORDER BY sort_order ASC, updated_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DirectoryProfessionalPortfolioItem, 0)
	for rows.Next() {
		var item DirectoryProfessionalPortfolioItem
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.AssetURL, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) galleryByProfessional(ctx context.Context, profileID string) ([]DirectoryProfessionalGalleryItem, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, file_name, asset_url, caption, sort_order
		FROM professional_gallery_assets
		WHERE profile_id = $1
		ORDER BY sort_order ASC, updated_at DESC
	`, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DirectoryProfessionalGalleryItem, 0)
	for rows.Next() {
		var item DirectoryProfessionalGalleryItem
		if err := rows.Scan(&item.ID, &item.FileName, &item.AssetURL, &item.Caption, &item.SortOrder); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) coverageSummaryByProfessional(ctx context.Context, profileID string, primaryCity string) (DirectoryProfessionalCoverageSummary, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT city, area_label
		FROM professional_coverage_areas
		WHERE profile_id = $1
		ORDER BY created_at DESC
	`, profileID)
	if err != nil {
		return DirectoryProfessionalCoverageSummary{}, err
	}
	defer rows.Close()

	areas := make([]string, 0)
	cities := make([]string, 0)
	for rows.Next() {
		var city string
		var area string
		if err := rows.Scan(&city, &area); err != nil {
			return DirectoryProfessionalCoverageSummary{}, err
		}
		if area != "" {
			areas = append(areas, area)
		}
		if city != "" {
			cities = append(cities, city)
		}
	}
	if err := rows.Err(); err != nil {
		return DirectoryProfessionalCoverageSummary{}, err
	}

	cities = dedupeStrings(cities)
	if primaryCity != "" && !containsString(cities, primaryCity) {
		cities = append([]string{primaryCity}, cities...)
	}

	return DirectoryProfessionalCoverageSummary{
		Areas:            dedupeStrings(areas),
		Cities:           cities,
		PracticeLocation: firstNonEmpty(primaryCity, firstString(cities)),
	}, nil
}

func (s *Service) availabilitySummaryByProfessional(ctx context.Context, profileID string) (DirectoryProfessionalAvailabilitySummary, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT weekday, start_time, end_time, is_unavailable
		FROM professional_availability_rules
		WHERE profile_id = $1
		ORDER BY weekday ASC, start_time ASC
	`, profileID)
	if err != nil {
		return DirectoryProfessionalAvailabilitySummary{}, err
	}
	defer rows.Close()

	slots := make([]string, 0)
	for rows.Next() {
		var weekday int
		var startTime string
		var endTime string
		var isUnavailable bool
		if err := rows.Scan(&weekday, &startTime, &endTime, &isUnavailable); err != nil {
			return DirectoryProfessionalAvailabilitySummary{}, err
		}
		if isUnavailable {
			continue
		}
		slots = append(slots, fmt.Sprintf("%s • %s - %s", weekdayLabel(weekday), trimClock(startTime), trimClock(endTime)))
	}
	if err := rows.Err(); err != nil {
		return DirectoryProfessionalAvailabilitySummary{}, err
	}

	slots = dedupeStrings(slots)
	if len(slots) > 4 {
		slots = slots[:4]
	}
	text := ""
	if len(slots) > 0 {
		text = slots[0]
	}
	return DirectoryProfessionalAvailabilitySummary{
		Slots: slots,
		Text:  text,
	}, nil
}

func buildPublicProfile(attributes map[string]any) DirectoryProfessionalPublicProfile {
	return DirectoryProfessionalPublicProfile{
		Bio:              firstNonEmpty(attributeString(attributes, "about"), attributeString(attributes, "bio")),
		EducationHistory: attributeString(attributes, "education_history"),
		Headline:         attributeString(attributes, "headline"),
		Languages:        attributeStringArray(attributes, "languages"),
		LicenseText:      firstNonEmpty(attributeString(attributes, "str_number"), attributeString(attributes, "license_text")),
		Specialties:      attributeStringArray(attributes, "specialties", "focus_areas", "service_focus"),
		YearsExperience:  attributeInt(attributes, "yearsExperience"),
	}
}

func buildTrustMetrics(
	credentials []DirectoryTrustCredential,
	coverage DirectoryProfessionalCoverageSummary,
	offerings []DirectoryOffering,
	stories []DirectoryStory,
) []DirectoryProfessionalTrustMetric {
	return []DirectoryProfessionalTrustMetric{
		{ID: "credentials", Label: "credentials", Value: fmt.Sprintf("%d", len(credentials))},
		{ID: "coverage", Label: "coverage_areas", Value: fmt.Sprintf("%d", len(coverage.Areas))},
		{ID: "services", Label: "services", Value: fmt.Sprintf("%d", len(offerings))},
		{ID: "stories", Label: "stories", Value: fmt.Sprintf("%d", len(stories))},
	}
}

func attributeString(attributes map[string]any, key string) string {
	if attributes == nil {
		return ""
	}
	value, ok := attributes[key]
	if !ok {
		return ""
	}
	text, ok := value.(string)
	if !ok {
		return ""
	}
	return strings.TrimSpace(text)
}

func attributeStringArray(attributes map[string]any, keys ...string) []string {
	values := make([]string, 0)
	for _, key := range keys {
		if attributes == nil {
			continue
		}
		value, ok := attributes[key]
		if !ok {
			continue
		}
		switch typed := value.(type) {
		case []string:
			values = append(values, typed...)
		case []any:
			for _, item := range typed {
				if text, ok := item.(string); ok && strings.TrimSpace(text) != "" {
					values = append(values, text)
				}
			}
		case string:
			for _, item := range strings.Split(typed, ",") {
				if text := strings.TrimSpace(item); text != "" {
					values = append(values, text)
				}
			}
		}
	}
	return dedupeStrings(values)
}

func attributeInt(attributes map[string]any, key string) int {
	if attributes == nil {
		return 0
	}
	value, ok := attributes[key]
	if !ok {
		return 0
	}
	switch typed := value.(type) {
	case int:
		return typed
	case int32:
		return int(typed)
	case int64:
		return int(typed)
	case float64:
		return int(typed)
	default:
		return 0
	}
}

func dedupeStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, exists := seen[trimmed]; exists {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func firstString(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func trimClock(value string) string {
	trimmed := strings.TrimSpace(value)
	if len(trimmed) >= 5 {
		return trimmed[:5]
	}
	return trimmed
}

func weekdayLabel(weekday int) string {
	labels := []string{"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"}
	if weekday >= 0 && weekday < len(labels) {
		return labels[weekday]
	}
	return fmt.Sprintf("Day %d", weekday)
}

func scanProfessional(scanner interface{ Scan(dest ...any) error }, platformID string) (DirectoryProfessional, error) {
	var item DirectoryProfessional
	var attributesJSON []byte
	if err := scanner.Scan(
		&item.ID,
		&item.UserID,
		&item.DisplayName,
		&item.City,
		&item.Slug,
		&attributesJSON,
		&item.OfferingCount,
		&item.StartingPrice,
	); err != nil {
		return DirectoryProfessional{}, err
	}
	item.PlatformID = platformID
	if len(attributesJSON) > 0 {
		if err := json.Unmarshal(attributesJSON, &item.Attributes); err != nil {
			return DirectoryProfessional{}, err
		}
	}
	return item, nil
}

func scanOffering(scanner interface{ Scan(dest ...any) error }, platformID string) (DirectoryOffering, error) {
	var item DirectoryOffering
	if err := scanner.Scan(
		&item.ID,
		&item.Slug,
		&item.Title,
		&item.Description,
		&item.OfferingType,
		&item.DeliveryMode,
		&item.PriceAmount,
		&item.Currency,
		&item.ProfessionalID,
		&item.ProfessionalSlug,
		&item.ProfessionalDisplayName,
		&item.ProfessionalUserID,
	); err != nil {
		return DirectoryOffering{}, err
	}
	item.PlatformID = platformID
	return item, nil
}
