package platformregistry

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"bidanapp/apps/backend/internal/platformmanifest"
)

var ErrPlatformNotFound = errors.New("platform not found")

type Service struct {
	db             *sql.DB
	defaultSchemas map[string]PlatformProfessionalSchema
	platforms      []PlatformDefinition
}

func NewService(db *sql.DB) *Service {
	manifest, err := platformmanifest.Load()
	if err != nil {
		panic(err)
	}

	defaultPlatforms := make([]PlatformDefinition, 0, len(manifest.Platforms))
	defaultSchemas := make(map[string]PlatformProfessionalSchema, len(manifest.Platforms))
	for _, platform := range manifest.Platforms {
		defaultLocale := platform.ResolvedDefaultLocale()
		supportedLocales := platform.ResolvedSupportedLocales()
		defaultSEO := platform.ResolvedSEOFor(defaultLocale)
		defaultSchema := platform.ResolvedRegistrationSchemaFor(defaultLocale)
		defaultPlatforms = append(defaultPlatforms, PlatformDefinition{
			ActiveSchemaVersion: defaultSchema.Version,
			DefaultLocale:       defaultLocale,
			Description:         platform.Description,
			Domains:             append([]string(nil), platform.Domains...),
			FeatureFlags: PlatformFeatureFlags{
				AdminReview:            platform.FeatureFlags.AdminReview,
				Payments:               platform.FeatureFlags.Payments,
				ProfessionalDocuments:  platform.FeatureFlags.ProfessionalDocuments,
				ProfessionalOnboarding: platform.FeatureFlags.ProfessionalOnboarding,
			},
			ID:               platform.ID,
			Name:             platform.Name,
			SEO:              PlatformSEOData(defaultSEO),
			Slug:             platform.Slug,
			Status:           "active",
			Summary:          platform.Summary,
			SupportedLocales: append([]string(nil), supportedLocales...),
			Theme:            PlatformThemeData(platform.Theme),
		})
		defaultSchemas[platform.ID] = PlatformProfessionalSchema{
			Description: defaultSchema.Description,
			Fields:      toSchemaFields(defaultSchema.Fields),
			PlatformID:  platform.ID,
			Title:       defaultSchema.Title,
			Version:     defaultSchema.Version,
		}
	}

	return &Service{
		db:             db,
		platforms:      defaultPlatforms,
		defaultSchemas: defaultSchemas,
	}
}

func (s *Service) EnsureDefaults(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if s.db == nil {
		return nil
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	for _, platform := range s.platforms {
		themeJSON, err := json.Marshal(platform.Theme)
		if err != nil {
			return err
		}
		seoJSON, err := json.Marshal(platform.SEO)
		if err != nil {
			return err
		}
		settingsJSON, err := json.Marshal(map[string]any{
			"defaultLocale":    platform.DefaultLocale,
			"featureFlags":     platform.FeatureFlags,
			"supportedLocales": platform.SupportedLocales,
		})
		if err != nil {
			return err
		}

		_, err = tx.ExecContext(ctx, `
			INSERT INTO platforms (
				id,
				slug,
				name,
				description,
				summary,
				status,
				theme_config,
				seo_config,
				settings,
				created_at,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
			ON CONFLICT (id) DO UPDATE SET
				slug = EXCLUDED.slug,
				name = EXCLUDED.name,
				description = EXCLUDED.description,
				summary = EXCLUDED.summary,
				status = EXCLUDED.status,
				theme_config = EXCLUDED.theme_config,
				seo_config = EXCLUDED.seo_config,
				settings = EXCLUDED.settings,
				updated_at = now()
		`, platform.ID, platform.Slug, platform.Name, platform.Description, platform.Summary, platform.Status, themeJSON, seoJSON, settingsJSON)
		if err != nil {
			return err
		}

		for index, host := range platform.Domains {
			domainID := platform.ID + "_domain_" + strings.ReplaceAll(host, ".", "_")
			_, err = tx.ExecContext(ctx, `
				INSERT INTO platform_domains (
					id,
					platform_id,
					host,
					is_primary,
					created_at
				) VALUES ($1, $2, $3, $4, now())
				ON CONFLICT (host) DO UPDATE SET
					platform_id = EXCLUDED.platform_id,
					is_primary = EXCLUDED.is_primary
			`, domainID, platform.ID, normalizeHost(host), index == 0)
			if err != nil {
				return err
			}
		}

		schema := s.defaultSchemas[platform.ID]
		schemaJSON, err := json.Marshal(schema.Fields)
		if err != nil {
			return err
		}

		schemaID := platform.ID + "_schema_v" + itoa(schema.Version)
		_, err = tx.ExecContext(ctx, `
			INSERT INTO professional_attribute_schemas (
				id,
				platform_id,
				version,
				title,
				description,
				schema_definition,
				is_active,
				created_at,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())
			ON CONFLICT (id) DO UPDATE SET
				title = EXCLUDED.title,
				description = EXCLUDED.description,
				schema_definition = EXCLUDED.schema_definition,
				is_active = true,
				updated_at = now()
		`, schemaID, platform.ID, schema.Version, schema.Title, schema.Description, schemaJSON)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *Service) ListPlatforms(ctx context.Context) ([]PlatformDefinition, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return append([]PlatformDefinition(nil), s.platforms...), nil
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT id, slug, name, description, summary, status, theme_config, seo_config, settings
		FROM platforms
		ORDER BY slug ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var platforms []PlatformDefinition
	for rows.Next() {
		var platform PlatformDefinition
		var themeJSON []byte
		var seoJSON []byte
		var settingsJSON []byte
		if err := rows.Scan(
			&platform.ID,
			&platform.Slug,
			&platform.Name,
			&platform.Description,
			&platform.Summary,
			&platform.Status,
			&themeJSON,
			&seoJSON,
			&settingsJSON,
		); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(themeJSON, &platform.Theme); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(seoJSON, &platform.SEO); err != nil {
			return nil, err
		}
		settings := decodeSettings(settingsJSON)
		platform.DefaultLocale = settings.DefaultLocale
		platform.FeatureFlags = settings.FeatureFlags

		domains, err := s.domainsForPlatform(ctx, platform.ID)
		if err != nil {
			return nil, err
		}
		schema, err := s.ActiveSchemaByPlatformID(ctx, platform.ID)
		if err == nil {
			platform.ActiveSchemaVersion = schema.Version
		}
		platform.Domains = domains
		platform.SupportedLocales = settings.SupportedLocales
		platforms = append(platforms, platform)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return platforms, nil
}

func (s *Service) PlatformByID(ctx context.Context, platformID string) (PlatformDefinition, error) {
	if err := ctx.Err(); err != nil {
		return PlatformDefinition{}, err
	}
	if s.db == nil {
		for _, platform := range s.platforms {
			if platform.ID == platformID {
				return platform, nil
			}
		}
		return PlatformDefinition{}, ErrPlatformNotFound
	}

	var platform PlatformDefinition
	var themeJSON []byte
	var seoJSON []byte
	var settingsJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT id, slug, name, description, summary, status, theme_config, seo_config, settings
		FROM platforms
		WHERE id = $1
	`, platformID).Scan(
		&platform.ID,
		&platform.Slug,
		&platform.Name,
		&platform.Description,
		&platform.Summary,
		&platform.Status,
		&themeJSON,
		&seoJSON,
		&settingsJSON,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PlatformDefinition{}, ErrPlatformNotFound
		}
		return PlatformDefinition{}, err
	}
	if err := json.Unmarshal(themeJSON, &platform.Theme); err != nil {
		return PlatformDefinition{}, err
	}
	if err := json.Unmarshal(seoJSON, &platform.SEO); err != nil {
		return PlatformDefinition{}, err
	}
	settings := decodeSettings(settingsJSON)
	platform.DefaultLocale = settings.DefaultLocale
	platform.FeatureFlags = settings.FeatureFlags
	domains, err := s.domainsForPlatform(ctx, platform.ID)
	if err != nil {
		return PlatformDefinition{}, err
	}
	schema, err := s.ActiveSchemaByPlatformID(ctx, platform.ID)
	if err == nil {
		platform.ActiveSchemaVersion = schema.Version
	}
	platform.SupportedLocales = settings.SupportedLocales
	platform.Domains = domains
	return platform, nil
}

func (s *Service) ResolvePlatform(ctx context.Context, host string) (PlatformDefinition, error) {
	if err := ctx.Err(); err != nil {
		return PlatformDefinition{}, err
	}
	normalizedHost := normalizeHost(host)
	if normalizedHost == "" {
		return PlatformDefinition{}, ErrPlatformNotFound
	}
	if s.db == nil {
		for _, platform := range s.platforms {
			for _, domain := range platform.Domains {
				if normalizeHost(domain) == normalizedHost {
					return platform, nil
				}
			}
			if strings.Split(normalizedHost, ".")[0] == platform.Slug {
				return platform, nil
			}
		}
		return PlatformDefinition{}, ErrPlatformNotFound
	}

	var platformID string
	err := s.db.QueryRowContext(ctx, `
		SELECT platform_id
		FROM platform_domains
		WHERE host = $1
		LIMIT 1
	`, normalizedHost).Scan(&platformID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			subdomain := strings.Split(normalizedHost, ".")[0]
			return s.PlatformByID(ctx, subdomain)
		}
		return PlatformDefinition{}, err
	}

	return s.PlatformByID(ctx, platformID)
}

func (s *Service) ActiveSchemaByPlatformID(ctx context.Context, platformID string) (PlatformProfessionalSchema, error) {
	if err := ctx.Err(); err != nil {
		return PlatformProfessionalSchema{}, err
	}
	if s.db == nil {
		schema, ok := s.defaultSchemas[platformID]
		if !ok {
			return PlatformProfessionalSchema{}, ErrPlatformNotFound
		}
		return schema, nil
	}

	var schema PlatformProfessionalSchema
	var fieldsJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT version, title, description, schema_definition
		FROM professional_attribute_schemas
		WHERE platform_id = $1 AND is_active = true
		ORDER BY version DESC
		LIMIT 1
	`, platformID).Scan(
		&schema.Version,
		&schema.Title,
		&schema.Description,
		&fieldsJSON,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PlatformProfessionalSchema{}, ErrPlatformNotFound
		}
		return PlatformProfessionalSchema{}, err
	}
	if err := json.Unmarshal(fieldsJSON, &schema.Fields); err != nil {
		return PlatformProfessionalSchema{}, err
	}
	schema.PlatformID = platformID
	return schema, nil
}

func (s *Service) domainsForPlatform(ctx context.Context, platformID string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT host
		FROM platform_domains
		WHERE platform_id = $1
		ORDER BY is_primary DESC, host ASC
	`, platformID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var domains []string
	for rows.Next() {
		var host string
		if err := rows.Scan(&host); err != nil {
			return nil, err
		}
		domains = append(domains, host)
	}
	return domains, rows.Err()
}

func normalizeHost(value string) string {
	return strings.TrimSpace(strings.ToLower(strings.Split(value, ":")[0]))
}

type platformSettings struct {
	DefaultLocale    string               `json:"defaultLocale"`
	FeatureFlags     PlatformFeatureFlags `json:"featureFlags"`
	SupportedLocales []string             `json:"supportedLocales"`
}

func decodeSettings(raw []byte) platformSettings {
	payload := platformSettings{
		DefaultLocale:    "id",
		SupportedLocales: []string{"id"},
	}
	if len(raw) == 0 {
		return payload
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return payload
	}
	if payload.DefaultLocale == "" {
		payload.DefaultLocale = "id"
	}
	if len(payload.SupportedLocales) == 0 {
		payload.SupportedLocales = []string{payload.DefaultLocale}
	}
	return payload
}

func toSchemaFields(fields []platformmanifest.ProfessionalSchemaField) []ProfessionalSchemaField {
	result := make([]ProfessionalSchemaField, 0, len(fields))
	for _, field := range fields {
		result = append(result, ProfessionalSchemaField{
			HelperText:  field.HelperText,
			Key:         field.Key,
			Label:       field.Label,
			Placeholder: field.Placeholder,
			Required:    field.Required,
			Type:        field.Type,
		})
	}
	return result
}

func itoa(value int) string {
	return strconv.Itoa(value)
}
