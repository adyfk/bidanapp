package offerings

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

var (
	ErrDatabaseUnavailable = errors.New("offerings requires a database connection")
	ErrInvalidPayload      = errors.New("invalid offering payload")
	ErrProfileNotApproved  = errors.New("professional platform profile must be approved")
	ErrProfileNotFound     = errors.New("professional platform profile not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListPublic(ctx context.Context, platformID string) (PlatformOfferingList, error) {
	if s.db == nil {
		return PlatformOfferingList{}, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, professional_profile_id, professional_user_id, title, slug, description, offering_type, delivery_mode, price_amount, currency, status, fulfillment_template
		FROM offerings
		WHERE platform_id = $1 AND status = 'published'
		ORDER BY updated_at DESC
	`, platformID)
	if err != nil {
		return PlatformOfferingList{}, err
	}
	defer rows.Close()

	offerings := make([]PlatformOffering, 0)
	for rows.Next() {
		offering, err := scanOffering(rows, platformID)
		if err != nil {
			return PlatformOfferingList{}, err
		}
		offerings = append(offerings, offering)
	}

	return PlatformOfferingList{Offerings: offerings}, rows.Err()
}

func (s *Service) ListMine(ctx context.Context, platformID string, userID string) (PlatformOfferingList, error) {
	if s.db == nil {
		return PlatformOfferingList{}, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, professional_profile_id, professional_user_id, title, slug, description, offering_type, delivery_mode, price_amount, currency, status, fulfillment_template
		FROM offerings
		WHERE platform_id = $1 AND professional_user_id = $2
		ORDER BY updated_at DESC
	`, platformID, userID)
	if err != nil {
		return PlatformOfferingList{}, err
	}
	defer rows.Close()

	offerings := make([]PlatformOffering, 0)
	for rows.Next() {
		offering, err := scanOffering(rows, platformID)
		if err != nil {
			return PlatformOfferingList{}, err
		}
		offerings = append(offerings, offering)
	}

	return PlatformOfferingList{Offerings: offerings}, rows.Err()
}

func (s *Service) Create(
	ctx context.Context,
	platformID string,
	userID string,
	input CreatePlatformOfferingRequest,
) (PlatformOffering, error) {
	if s.db == nil {
		return PlatformOffering{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.OfferingType) == "" || input.PriceAmount < 0 {
		return PlatformOffering{}, ErrInvalidPayload
	}

	var profileID string
	var profileStatus string
	var reviewStatus string
	var applicationStatus string
	err := s.db.QueryRowContext(ctx, `
		SELECT
			pp.id,
			pp.status,
			pp.review_status,
			COALESCE(pa.status, '')
		FROM professional_platform_profiles pp
		LEFT JOIN professional_applications pa
			ON pa.platform_id = pp.platform_id AND pa.user_id = pp.user_id
		WHERE pp.platform_id = $1 AND pp.user_id = $2
	`, platformID, userID).Scan(&profileID, &profileStatus, &reviewStatus, &applicationStatus)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PlatformOffering{}, ErrProfileNotFound
		}
		return PlatformOffering{}, err
	}
	if profileStatus != "approved" || reviewStatus != "approved" || applicationStatus != "approved" {
		return PlatformOffering{}, ErrProfileNotApproved
	}

	offeringID, err := newID("off_")
	if err != nil {
		return PlatformOffering{}, err
	}
	templateJSON, err := json.Marshal(input.FulfillmentTemplate)
	if err != nil {
		return PlatformOffering{}, err
	}

	offering := PlatformOffering{
		Currency:              "IDR",
		DeliveryMode:          strings.TrimSpace(input.DeliveryMode),
		Description:           strings.TrimSpace(input.Description),
		ID:                    offeringID,
		OfferingType:          strings.TrimSpace(input.OfferingType),
		PlatformID:            platformID,
		PriceAmount:           input.PriceAmount,
		ProfessionalProfileID: profileID,
		ProfessionalUserID:    userID,
		Slug:                  slugify(input.Title, offeringID),
		Status:                "published",
		Title:                 strings.TrimSpace(input.Title),
	}

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO offerings (
			id,
			platform_id,
			professional_profile_id,
			professional_user_id,
			slug,
			title,
			description,
			offering_type,
			delivery_mode,
			status,
			price_amount,
			currency,
			fulfillment_template,
			metadata,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', $10, 'IDR', $11, '{}'::jsonb, now(), now())
	`, offering.ID, platformID, profileID, userID, offering.Slug, offering.Title, offering.Description, offering.OfferingType, offering.DeliveryMode, offering.PriceAmount, templateJSON)
	if err != nil {
		return PlatformOffering{}, err
	}

	if len(templateJSON) > 0 {
		_ = json.Unmarshal(templateJSON, &offering.FulfillmentTemplate)
	}
	return offering, nil
}

func scanOffering(scanner interface{ Scan(dest ...any) error }, platformID string) (PlatformOffering, error) {
	var offering PlatformOffering
	var templateJSON []byte
	if err := scanner.Scan(
		&offering.ID,
		&offering.ProfessionalProfileID,
		&offering.ProfessionalUserID,
		&offering.Title,
		&offering.Slug,
		&offering.Description,
		&offering.OfferingType,
		&offering.DeliveryMode,
		&offering.PriceAmount,
		&offering.Currency,
		&offering.Status,
		&templateJSON,
	); err != nil {
		return PlatformOffering{}, err
	}
	offering.PlatformID = platformID
	if len(templateJSON) > 0 {
		_ = json.Unmarshal(templateJSON, &offering.FulfillmentTemplate)
	}
	return offering, nil
}

func slugify(value string, fallback string) string {
	slug := strings.ToLower(strings.TrimSpace(value))
	slug = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == '-':
			return r
		case r == ' ':
			return '-'
		default:
			return '-'
		}
	}, slug)
	slug = strings.Trim(strings.Join(strings.FieldsFunc(slug, func(r rune) bool { return r == '-' }), "-"), "-")
	if slug == "" {
		return fallback
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
