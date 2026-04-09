package devseed

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/platformregistry"
	"bidanapp/apps/backend/internal/platform/authstore"
)

const (
	adminPassword       = "AdminDemo#2026"
	bidanPlatformID     = "bidan"
	viewerPassword      = "BidanDemo#2026"
	viewerPasswordHash  = "$2a$10$TL8iywbI/vV1YoxApyCZIuiRp8Bi6NBokO5fRjz6GQ6Sq7j.zGEi."
)

type SeedSummary struct {
	AdminEmails              []string
	ApprovedProfessionalName string
	ApprovedProfessionalPhone string
	CustomerPhone            string
	SubmittedProfessionalPhone string
	ViewerPassword           string
}

type demoViewerAccount struct {
	City         string
	DisplayName  string
	IdentityID   string
	Phone        string
	UserID       string
}

type demoDocument struct {
	ApplicationID string
	DocumentKey   string
	FileName      string
	FixtureName   string
	ID            string
	ProfileID     string
	UserID        string
}

var demoViewerAccounts = map[string]demoViewerAccount{
	"customer": {
		City:        "Jakarta Selatan",
		DisplayName: "Alya Pratama",
		IdentityID:  "seed_ident_customer",
		Phone:       "+628111111001",
		UserID:      "usr_demo_customer",
	},
	"approved_professional": {
		City:        "Jakarta Selatan",
		DisplayName: "Bidan Nabila Lestari",
		IdentityID:  "seed_ident_professional_approved",
		Phone:       "+628111111002",
		UserID:      "usr_demo_professional_approved",
	},
	"submitted_professional": {
		City:        "Depok",
		DisplayName: "Bidan Rahma Pertiwi",
		IdentityID:  "seed_ident_professional_submitted",
		Phone:       "+628111111003",
		UserID:      "usr_demo_professional_submitted",
	},
	"draft_professional": {
		City:        "Bekasi",
		DisplayName: "Bidan Sari Maheswari",
		IdentityID:  "seed_ident_professional_draft",
		Phone:       "+628111111004",
		UserID:      "usr_demo_professional_draft",
	},
}

func SeedBidanDemo(ctx context.Context, db *sql.DB, cfg config.Config) (SeedSummary, error) {
	if db == nil {
		return SeedSummary{}, fmt.Errorf("seed bidan demo: database is nil")
	}

	platforms := platformregistry.NewService(db)
	if err := platforms.EnsureDefaults(ctx); err != nil {
		return SeedSummary{}, fmt.Errorf("ensure platform defaults: %w", err)
	}

	adminStore := authstore.NewPostgresStore(db)
	if err := adminauth.NewService(cfg.AdminAuth, adminStore).Bootstrap(ctx); err != nil {
		return SeedSummary{}, fmt.Errorf("bootstrap admin auth: %w", err)
	}

	if err := os.MkdirAll(cfg.SeedData.DataDir, 0o755); err != nil {
		return SeedSummary{}, fmt.Errorf("prepare seed data dir: %w", err)
	}
	if err := os.MkdirAll(cfg.Assets.RootDir, 0o755); err != nil {
		return SeedSummary{}, fmt.Errorf("prepare asset storage dir: %w", err)
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return SeedSummary{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if err := pruneDemoData(ctx, tx, cfg); err != nil {
		return SeedSummary{}, fmt.Errorf("prune demo data: %w", err)
	}

	for _, account := range demoViewerAccounts {
		if err := upsertViewerAccount(ctx, tx, account); err != nil {
			return SeedSummary{}, fmt.Errorf("seed viewer account %s: %w", account.UserID, err)
		}
	}

	schemaID, err := activeSchemaID(ctx, tx)
	if err != nil {
		return SeedSummary{}, err
	}

	baseTime := time.Date(2026, time.April, 7, 9, 0, 0, 0, time.UTC)
	ts := func(hours int) time.Time {
		return baseTime.Add(time.Duration(hours) * time.Hour)
	}

	approvedDocs, err := seedApprovedProfessional(ctx, tx, cfg, schemaID, ts)
	if err != nil {
		return SeedSummary{}, fmt.Errorf("seed approved professional: %w", err)
	}
	if err := seedSubmittedProfessional(ctx, tx, cfg, schemaID, ts); err != nil {
		return SeedSummary{}, fmt.Errorf("seed submitted professional: %w", err)
	}
	if err := seedDraftProfessional(ctx, tx, cfg, schemaID, ts); err != nil {
		return SeedSummary{}, fmt.Errorf("seed draft professional: %w", err)
	}
	if err := seedCommerce(ctx, tx, ts); err != nil {
		return SeedSummary{}, fmt.Errorf("seed commerce: %w", err)
	}
	if err := seedChatAndSupport(ctx, tx, ts); err != nil {
		return SeedSummary{}, fmt.Errorf("seed chat and support: %w", err)
	}
	if err := seedOutboxEvents(ctx, tx, ts, approvedDocs); err != nil {
		return SeedSummary{}, fmt.Errorf("seed notifications and review outbox: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return SeedSummary{}, err
	}

	adminEmails := make([]string, 0, len(cfg.AdminAuth.Credentials))
	for _, credential := range cfg.AdminAuth.Credentials {
		adminEmails = append(adminEmails, credential.Email)
	}

	return SeedSummary{
		AdminEmails:                adminEmails,
		ApprovedProfessionalName:   demoViewerAccounts["approved_professional"].DisplayName,
		ApprovedProfessionalPhone:  demoViewerAccounts["approved_professional"].Phone,
		CustomerPhone:              demoViewerAccounts["customer"].Phone,
		SubmittedProfessionalPhone: demoViewerAccounts["submitted_professional"].Phone,
		ViewerPassword:             viewerPassword,
	}, nil
}

func pruneDemoData(ctx context.Context, tx *sql.Tx, cfg config.Config) error {
	for _, user := range demoViewerAccounts {
		_ = os.RemoveAll(filepath.Join(cfg.Assets.RootDir, bidanPlatformID, user.UserID))
	}

	statements := []string{
		`DELETE FROM outbox_events WHERE id LIKE 'seed_%' OR aggregate_id LIKE 'usr_demo_%'`,
		`DELETE FROM chat_threads WHERE id LIKE 'seed_%'`,
		`DELETE FROM auth_challenges WHERE id LIKE 'seed_%' OR user_id LIKE 'usr_demo_%'`,
		`DELETE FROM auth_sessions WHERE id LIKE 'seed_%' OR user_id LIKE 'usr_demo_%'`,
		`DELETE FROM auth_identities WHERE id LIKE 'seed_%' OR user_id LIKE 'usr_demo_%'`,
		`DELETE FROM customer_profiles WHERE user_id LIKE 'usr_demo_%'`,
		`DELETE FROM auth_users WHERE id LIKE 'usr_demo_%'`,
	}

	for _, statement := range statements {
		if _, err := tx.ExecContext(ctx, statement); err != nil {
			return err
		}
	}

	return nil
}

func activeSchemaID(ctx context.Context, tx *sql.Tx) (string, error) {
	var schemaID string
	err := tx.QueryRowContext(ctx, `
		SELECT id
		FROM professional_attribute_schemas
		WHERE platform_id = $1
		  AND is_active = true
		ORDER BY version DESC
		LIMIT 1
	`, bidanPlatformID).Scan(&schemaID)
	if err != nil {
		return "", fmt.Errorf("load active bidan schema: %w", err)
	}
	return schemaID, nil
}

func upsertViewerAccount(ctx context.Context, tx *sql.Tx, account demoViewerAccount) error {
	now := time.Date(2026, time.April, 7, 9, 0, 0, 0, time.UTC)
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO auth_users (
			id,
			role,
			status,
			verified_at,
			verified_channel,
			retention_state,
			created_at,
			updated_at
		) VALUES ($1, 'end_user', 'active', $2, 'manual', 'active', $2, $2)
		ON CONFLICT (id) DO UPDATE SET
			role = EXCLUDED.role,
			status = EXCLUDED.status,
			verified_at = EXCLUDED.verified_at,
			verified_channel = EXCLUDED.verified_channel,
			retention_state = EXCLUDED.retention_state,
			updated_at = EXCLUDED.updated_at
	`, account.UserID, now); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO auth_identities (
			id,
			user_id,
			provider,
			provider_subject,
			identity_type,
			identity_value,
			identity_value_normalized,
			secret_hash,
			verified_at,
			created_at,
			updated_at
		) VALUES ($1, $2, 'phone_password', $3, 'phone', $4, $3, $5, $6, $6, $6)
		ON CONFLICT (id) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			provider = EXCLUDED.provider,
			provider_subject = EXCLUDED.provider_subject,
			identity_type = EXCLUDED.identity_type,
			identity_value = EXCLUDED.identity_value,
			identity_value_normalized = EXCLUDED.identity_value_normalized,
			secret_hash = EXCLUDED.secret_hash,
			verified_at = EXCLUDED.verified_at,
			updated_at = EXCLUDED.updated_at
	`, account.IdentityID, account.UserID, account.Phone, account.Phone, viewerPasswordHash, now); err != nil {
		return err
	}

	attributesJSON, err := json.Marshal(map[string]any{
		"preferredLocale": "id",
		"seeded":          true,
	})
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO customer_profiles (
			user_id,
			display_name,
			city,
			primary_phone,
			attributes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			city = EXCLUDED.city,
			primary_phone = EXCLUDED.primary_phone,
			attributes = EXCLUDED.attributes,
			updated_at = EXCLUDED.updated_at
	`, account.UserID, account.DisplayName, account.City, account.Phone, attributesJSON, now); err != nil {
		return err
	}

	return nil
}

func seedApprovedProfessional(
	ctx context.Context,
	tx *sql.Tx,
	cfg config.Config,
	schemaID string,
	ts func(int) time.Time,
) ([]demoDocument, error) {
	account := demoViewerAccounts["approved_professional"]
	profileID := "seed_profile_approved_midwife"
	applicationID := "seed_application_approved_midwife"
	profileAttributes := map[string]any{
		"headline":              "Bidan pendamping ibu baru lahir, laktasi, dan pemulihan pascamelahirkan.",
		"languages":             []string{"Bahasa Indonesia", "English"},
		"seeded":                true,
		"yearsExperience":       8,
		"certified_lactation":   true,
		"education_history":     "D3 Kebidanan Poltekkes Jakarta, Pelatihan Konselor Menyusui.",
		"str_number":            "STR-BDN-2026-0001",
	}
	documents := []demoDocument{
		{
			ApplicationID: applicationID,
			DocumentKey:   "sipb_document_url",
			FileName:      "sipb-bidan-nabila.txt",
			FixtureName:   "approved-sipb.txt",
			ID:            "seed_document_approved_sipb",
			ProfileID:     profileID,
			UserID:        account.UserID,
		},
		{
			ApplicationID: applicationID,
			DocumentKey:   "supporting_str_scan",
			FileName:      "str-bidan-nabila.txt",
			FixtureName:   "approved-str.txt",
			ID:            "seed_document_approved_str",
			ProfileID:     profileID,
			UserID:        account.UserID,
		},
	}
	profileAttributes["sipb_document_url"] = "/api/v1/professional-documents/" + documents[0].ID

	profileJSON, err := json.Marshal(profileAttributes)
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
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
		) VALUES ($1, $2, $3, $4, $5, $6, 'approved', 'approved', $7, $8, $9)
	`, profileID, bidanPlatformID, account.UserID, "bidan-nabila-lestari", account.DisplayName, account.City, profileJSON, ts(1), ts(4)); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_applications (
			id,
			platform_id,
			profile_id,
			user_id,
			schema_id,
			status,
			attributes,
			submitted_at,
			reviewed_at,
			review_notes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, 'approved', $6, $7, $8, $9, $10, $8)
	`, applicationID, bidanPlatformID, profileID, account.UserID, schemaID, profileJSON, ts(1), ts(2), "Semua dokumen lengkap dan storefront siap dipublikasikan.", ts(0)); err != nil {
		return nil, err
	}

	for index, document := range documents {
		if err := seedProfessionalDocument(ctx, tx, cfg, document, ts(1+index)); err != nil {
			return nil, err
		}
	}

	if err := seedApprovedWorkspace(ctx, tx, profileID, ts); err != nil {
		return nil, err
	}

	return documents, nil
}

func seedSubmittedProfessional(
	ctx context.Context,
	tx *sql.Tx,
	cfg config.Config,
	schemaID string,
	ts func(int) time.Time,
) error {
	account := demoViewerAccounts["submitted_professional"]
	profileID := "seed_profile_submitted_midwife"
	applicationID := "seed_application_submitted_midwife"
	attributes := map[string]any{
		"certified_lactation": false,
		"education_history":   "D4 Kebidanan Universitas Indonesia.",
		"seeded":              true,
		"sipb_document_url":   "/api/v1/professional-documents/seed_document_submitted_sipb",
		"str_number":          "STR-BDN-2026-0002",
	}
	attributesJSON, err := json.Marshal(attributes)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
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
		) VALUES ($1, $2, $3, $4, $5, $6, 'pending_review', 'submitted', $7, $8, $9)
	`, profileID, bidanPlatformID, account.UserID, "bidan-rahma-pertiwi", account.DisplayName, account.City, attributesJSON, ts(3), ts(8)); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_applications (
			id,
			platform_id,
			profile_id,
			user_id,
			schema_id,
			status,
			attributes,
			submitted_at,
			review_notes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, 'submitted', $6, $7, '', $8, $7)
	`, applicationID, bidanPlatformID, profileID, account.UserID, schemaID, attributesJSON, ts(8), ts(3)); err != nil {
		return err
	}

	return seedProfessionalDocument(ctx, tx, cfg, demoDocument{
		ApplicationID: applicationID,
		DocumentKey:   "sipb_document_url",
		FileName:      "sipb-bidan-rahma.txt",
		FixtureName:   "submitted-sipb.txt",
		ID:            "seed_document_submitted_sipb",
		ProfileID:     profileID,
		UserID:        account.UserID,
	}, ts(7))
}

func seedDraftProfessional(
	ctx context.Context,
	tx *sql.Tx,
	cfg config.Config,
	schemaID string,
	ts func(int) time.Time,
) error {
	account := demoViewerAccounts["draft_professional"]
	profileID := "seed_profile_draft_midwife"
	applicationID := "seed_application_draft_midwife"
	attributes := map[string]any{
		"certified_lactation": false,
		"education_history":   "Akademi Kebidanan Bekasi, masih melengkapi berkas.",
		"seeded":              true,
		"sipb_document_url":   "/api/v1/professional-documents/seed_document_draft_sipb",
		"str_number":          "STR-BDN-2026-0003",
	}
	attributesJSON, err := json.Marshal(attributes)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
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
		) VALUES ($1, $2, $3, $4, $5, $6, 'draft', 'draft', $7, $8, $9)
	`, profileID, bidanPlatformID, account.UserID, "bidan-sari-maheswari", account.DisplayName, account.City, attributesJSON, ts(1), ts(6)); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_applications (
			id,
			platform_id,
			profile_id,
			user_id,
			schema_id,
			status,
			attributes,
			review_notes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, 'draft', $6, 'Lengkapi SIPB dan jadwal praktek sebelum submit.', $7, $8)
	`, applicationID, bidanPlatformID, profileID, account.UserID, schemaID, attributesJSON, ts(1), ts(6)); err != nil {
		return err
	}

	return seedProfessionalDocument(ctx, tx, cfg, demoDocument{
		ApplicationID: applicationID,
		DocumentKey:   "sipb_document_url",
		FileName:      "sipb-bidan-sari.txt",
		FixtureName:   "draft-sipb.txt",
		ID:            "seed_document_draft_sipb",
		ProfileID:     profileID,
		UserID:        account.UserID,
	}, ts(5))
}

func seedApprovedWorkspace(ctx context.Context, tx *sql.Tx, profileID string, ts func(int) time.Time) error {
	portfolioEntries := []struct {
		id, title, description, assetURL string
		sortOrder                        int
	}{
		{
			id:          "seed_portfolio_postpartum_class",
			title:       "Kelas persiapan menyusui",
			description: "Workshop hybrid untuk ibu baru dengan simulasi posisi menyusui dan pumping plan.",
			assetURL:    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80",
			sortOrder:   0,
		},
		{
			id:          "seed_portfolio_home_visit_pack",
			title:       "Home visit pascamelahirkan",
			description: "Pendampingan 7 hari pertama dengan catatan pemulihan dan edukasi keluarga inti.",
			assetURL:    "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=1200&q=80",
			sortOrder:   1,
		},
	}
	for _, entry := range portfolioEntries {
		metadataJSON, err := json.Marshal(map[string]any{
			"seeded": true,
		})
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_portfolio_entries (
				id, profile_id, platform_id, title, description, asset_url, sort_order, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		`, entry.id, profileID, bidanPlatformID, entry.title, entry.description, entry.assetURL, entry.sortOrder, metadataJSON, ts(3)); err != nil {
			return err
		}
	}

	galleryAssets := []struct {
		id, fileName, assetURL, caption string
		sortOrder                       int
	}{
		{
			id:        "seed_gallery_birth_plan",
			fileName:  "kelas-laktasi.jpg",
			assetURL:  "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
			caption:   "Kelas konseling laktasi tatap muka.",
			sortOrder: 0,
		},
		{
			id:        "seed_gallery_home_visit",
			fileName:  "home-visit.jpg",
			assetURL:  "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=1200&q=80",
			caption:   "Checklist home visit untuk masa nifas awal.",
			sortOrder: 1,
		},
	}
	for _, asset := range galleryAssets {
		metadataJSON, err := json.Marshal(map[string]any{"seeded": true})
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_gallery_assets (
				id, profile_id, platform_id, file_name, asset_url, caption, sort_order, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		`, asset.id, profileID, bidanPlatformID, asset.fileName, asset.assetURL, asset.caption, asset.sortOrder, metadataJSON, ts(3)); err != nil {
			return err
		}
	}

	credentials := []struct {
		id, label, issuer, code string
		issuedAt                time.Time
	}{
		{
			id:       "seed_credential_str",
			label:    "STR Bidan Aktif",
			issuer:   "Konsil Kesehatan Indonesia",
			code:     "STR-BDN-2026-0001",
			issuedAt: ts(-24),
		},
		{
			id:       "seed_credential_lactation",
			label:    "Sertifikasi Konselor Laktasi",
			issuer:   "Asosiasi Ibu Menyusui Indonesia",
			code:     "AIMI-LC-2025-045",
			issuedAt: ts(-8),
		},
	}
	for _, credential := range credentials {
		metadataJSON, err := json.Marshal(map[string]any{"seeded": true})
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_credentials (
				id, profile_id, platform_id, label, issuer, credential_code, issued_at, expires_at, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $9)
		`, credential.id, profileID, bidanPlatformID, credential.label, credential.issuer, credential.code, credential.issuedAt, metadataJSON, ts(3)); err != nil {
			return err
		}
	}

	stories := []struct {
		id, title, body string
		sortOrder       int
	}{
		{
			id:        "seed_story_postpartum",
			title:     "Mendampingi 7 hari pertama ibu baru",
			body:      "Saya fokus pada fase kritis setelah persalinan: perawatan luka, pola menyusui, dan edukasi keluarga.",
			sortOrder: 0,
		},
		{
			id:        "seed_story_lactation",
			title:     "Membantu ibu kembali percaya diri saat menyusui",
			body:      "Setiap kunjungan membawa action plan sederhana agar keluarga tahu apa yang harus dilakukan setelah sesi berakhir.",
			sortOrder: 1,
		},
	}
	for _, story := range stories {
		metadataJSON, err := json.Marshal(map[string]any{"seeded": true})
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_stories (
				id, profile_id, platform_id, title, body, sort_order, is_published, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $8)
		`, story.id, profileID, bidanPlatformID, story.title, story.body, story.sortOrder, metadataJSON, ts(3)); err != nil {
			return err
		}
	}

	coverageAreas := []struct {
		id, city, areaLabel string
	}{
		{id: "seed_coverage_jaksel", city: "Jakarta Selatan", areaLabel: "Kebayoran Baru dan sekitarnya"},
		{id: "seed_coverage_jaktim", city: "Jakarta Timur", areaLabel: "Duren Sawit dan sekitarnya"},
	}
	for _, area := range coverageAreas {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_coverage_areas (
				id, profile_id, platform_id, city, area_label, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, '{"seeded":true}'::jsonb, $6, $6)
		`, area.id, profileID, bidanPlatformID, area.city, area.areaLabel, ts(3)); err != nil {
			return err
		}
	}

	availability := []struct {
		id        string
		weekday   int
		startTime string
		endTime   string
	}{
		{id: "seed_availability_monday", weekday: 1, startTime: "09:00", endTime: "17:00"},
		{id: "seed_availability_wednesday", weekday: 3, startTime: "10:00", endTime: "18:00"},
		{id: "seed_availability_saturday", weekday: 6, startTime: "08:00", endTime: "12:00"},
	}
	for _, rule := range availability {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO professional_availability_rules (
				id, profile_id, platform_id, weekday, start_time, end_time, is_unavailable, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, false, '{"seeded":true}'::jsonb, $7, $7)
		`, rule.id, profileID, bidanPlatformID, rule.weekday, rule.startTime, rule.endTime, ts(3)); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO professional_notification_preferences (
			profile_id, platform_id, web_enabled, email_enabled, whatsapp_enabled, metadata, created_at, updated_at
		) VALUES ($1, $2, true, false, true, '{"seeded":true}'::jsonb, $3, $3)
	`, profileID, bidanPlatformID, ts(3)); err != nil {
		return err
	}

	return nil
}

func seedProfessionalDocument(
	ctx context.Context,
	tx *sql.Tx,
	cfg config.Config,
	document demoDocument,
	createdAt time.Time,
) error {
	storagePath, fileSize, err := copyFixtureToStorage(cfg, document)
	if err != nil {
		return err
	}
	metadataJSON, err := json.Marshal(map[string]any{
		"contentType":      "text/plain; charset=utf-8",
		"fileSize":         fileSize,
		"originalFileName": document.FileName,
		"seeded":           true,
		"storagePath":      storagePath,
		"uploaded":         true,
		"uploadedAt":       createdAt.UTC().Format(time.RFC3339),
	})
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO professional_documents (
			id, platform_id, profile_id, application_id, user_id, document_key, file_name, document_url, metadata, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, document.ID, bidanPlatformID, document.ProfileID, document.ApplicationID, document.UserID, document.DocumentKey, document.FileName, "/api/v1/professional-documents/"+document.ID, metadataJSON, createdAt)
	return err
}

func copyFixtureToStorage(cfg config.Config, document demoDocument) (string, int64, error) {
	sourcePath := filepath.Join(cfg.SeedData.DataDir, "bidan-demo-assets", document.FixtureName)
	bytes, err := os.ReadFile(sourcePath)
	if err != nil {
		return "", 0, err
	}

	storagePath := filepath.Join(cfg.Assets.RootDir, bidanPlatformID, document.UserID, document.ID, document.FileName)
	if err := os.MkdirAll(filepath.Dir(storagePath), 0o755); err != nil {
		return "", 0, err
	}
	if err := os.WriteFile(storagePath, bytes, 0o644); err != nil {
		return "", 0, err
	}

	return storagePath, int64(len(bytes)), nil
}

func seedCommerce(ctx context.Context, tx *sql.Tx, ts func(int) time.Time) error {
	approvedUser := demoViewerAccounts["approved_professional"]
	customerUser := demoViewerAccounts["customer"]
	profileID := "seed_profile_approved_midwife"

	type offeringSeed struct {
		Description        string
		DeliveryMode       string
		Fulfillment        map[string]any
		ID                 string
		Metadata           map[string]any
		OfferingType       string
		PriceAmount        int
		Slug               string
		Title              string
	}

	offerings := []offeringSeed{
		{
			Description:  "Kunjungan rumah 90 menit untuk asesmen ibu dan bayi, termasuk edukasi menyusui dan catatan tindak lanjut.",
			DeliveryMode: "home_visit",
			Fulfillment: map[string]any{
				"coverageNote":     "Jakarta Selatan dan Jakarta Timur",
				"estimatedMinutes": 90,
				"requiresAddress":  true,
			},
			ID:           "seed_offering_home_visit",
			Metadata:     map[string]any{"badge": "Best seller", "seeded": true},
			OfferingType: "home_visit",
			PriceAmount:  350000,
			Slug:         "kunjungan-rumah-pasca-melahirkan",
			Title:        "Kunjungan rumah pascamelahirkan",
		},
		{
			Description:  "Sesi video 45 menit untuk konsultasi laktasi, pumping plan, dan troubleshooting pelekatan.",
			DeliveryMode: "online",
			Fulfillment: map[string]any{
				"estimatedMinutes": 45,
				"meetingProvider":  "zoom",
				"requiresAddress":  false,
			},
			ID:           "seed_offering_online_session",
			Metadata:     map[string]any{"badge": "Cepat booking", "seeded": true},
			OfferingType: "online_session",
			PriceAmount:  175000,
			Slug:         "konsultasi-laktasi-online",
			Title:        "Konsultasi laktasi online",
		},
		{
			Description:  "Workbook digital untuk 14 hari pertama menyusui, checklist, dan tracker feeding.",
			DeliveryMode: "digital",
			Fulfillment: map[string]any{
				"assetType":       "pdf",
				"deliveryChannel": "download",
				"license":         "personal_use",
			},
			ID:           "seed_offering_digital_product",
			Metadata:     map[string]any{"badge": "Digital", "seeded": true},
			OfferingType: "digital_product",
			PriceAmount:  79000,
			Slug:         "workbook-laktasi-14-hari",
			Title:        "Workbook laktasi 14 hari",
		},
	}

	for index, offering := range offerings {
		fulfillmentJSON, err := json.Marshal(offering.Fulfillment)
		if err != nil {
			return err
		}
		metadataJSON, err := json.Marshal(offering.Metadata)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO offerings (
				id, platform_id, professional_profile_id, professional_user_id, slug, title, description, offering_type, delivery_mode, status, price_amount, currency, fulfillment_template, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', $10, 'IDR', $11, $12, $13, $13)
		`, offering.ID, bidanPlatformID, profileID, approvedUser.UserID, offering.Slug, offering.Title, offering.Description, offering.OfferingType, offering.DeliveryMode, offering.PriceAmount, fulfillmentJSON, metadataJSON, ts(5+index)); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO offering_assets (
				id, offering_id, platform_id, file_name, asset_url, asset_kind, sort_order, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, 'image', 0, '{"seeded":true}'::jsonb, $6, $6)
		`, "seed_asset_"+offering.ID, offering.ID, bidanPlatformID, offering.Slug+".jpg", fmt.Sprintf("https://images.unsplash.com/photo-%d?auto=format&fit=crop&w=1200&q=80", 1511174511562+int64(index)), ts(5+index)); err != nil {
			return err
		}
	}

	type orderSeed struct {
		EventTypes          []string
		FulfillmentDetails  map[string]any
		ID                  string
		OfferingID          string
		OrderType           string
		PaymentID           string
		PaymentProviderRef  string
		PaymentStatus       string
		PaymentRecordStatus string
		Status              string
		TotalAmount         int
		UpdatedAt           time.Time
	}

	orders := []orderSeed{
		{
			EventTypes: []string{"created"},
			FulfillmentDetails: map[string]any{
				"notes":             "Butuh kunjungan sore untuk evaluasi nyeri jahitan dan pola menyusui.",
				"preferredSchedule": "2026-04-09T16:00:00+07:00",
				"serviceAddress":    "Jl. Bangka Raya No. 18, Jakarta Selatan",
			},
			ID:                  "seed_order_pending_payment",
			OfferingID:          "seed_offering_home_visit",
			OrderType:           "home_visit",
			PaymentID:           "seed_payment_pending_payment",
			PaymentProviderRef:  "seed-pref-pending",
			PaymentStatus:       "pending",
			PaymentRecordStatus: "pending",
			Status:              "pending_payment",
			TotalAmount:         350000,
			UpdatedAt:           ts(10),
		},
		{
			EventTypes: []string{"created", "payment_marked_paid"},
			FulfillmentDetails: map[string]any{
				"meetingLink":       "https://meet.bidanapp.local/demo-laktasi",
				"notes":             "Ibu ingin review pumping plan dan jadwal menyusui malam.",
				"preferredSchedule": "2026-04-08T20:00:00+07:00",
			},
			ID:                  "seed_order_pending_fulfillment",
			OfferingID:          "seed_offering_online_session",
			OrderType:           "online_session",
			PaymentID:           "seed_payment_pending_fulfillment",
			PaymentProviderRef:  "seed-pref-fulfillment",
			PaymentStatus:       "paid",
			PaymentRecordStatus: "paid",
			Status:              "pending_fulfillment",
			TotalAmount:         175000,
			UpdatedAt:           ts(11),
		},
		{
			EventTypes: []string{"created", "payment_marked_paid", "completed"},
			FulfillmentDetails: map[string]any{
				"downloadUrl": "https://bidan.lvh.me:3002/id/orders/seed_order_completed",
				"license":     "personal_use",
			},
			ID:                  "seed_order_completed",
			OfferingID:          "seed_offering_digital_product",
			OrderType:           "digital_product",
			PaymentID:           "seed_payment_completed",
			PaymentProviderRef:  "seed-pref-completed",
			PaymentStatus:       "paid",
			PaymentRecordStatus: "paid",
			Status:              "completed",
			TotalAmount:         79000,
			UpdatedAt:           ts(12),
		},
		{
			EventTypes: []string{"created", "payment_marked_paid", "refunded"},
			FulfillmentDetails: map[string]any{
				"notes":             "Kondisi ibu membaik dan kunjungan diganti jadwal lain.",
				"preferredSchedule": "2026-04-06T10:00:00+07:00",
				"serviceAddress":    "Jl. Haji Nawi No. 7, Jakarta Selatan",
			},
			ID:                  "seed_order_refunded",
			OfferingID:          "seed_offering_home_visit",
			OrderType:           "home_visit",
			PaymentID:           "seed_payment_refunded",
			PaymentProviderRef:  "seed-pref-refunded",
			PaymentStatus:       "refunded",
			PaymentRecordStatus: "paid",
			Status:              "refunded",
			TotalAmount:         350000,
			UpdatedAt:           ts(9),
		},
	}

	for index, order := range orders {
		fulfillmentJSON, err := json.Marshal(order.FulfillmentDetails)
		if err != nil {
			return err
		}
		createdAt := ts(7 + index)
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO orders (
				id, platform_id, customer_user_id, professional_profile_id, professional_user_id, offering_id, order_type, status, payment_status, total_amount, currency, fulfillment_details, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IDR', $11, $12, $13)
		`, order.ID, bidanPlatformID, customerUser.UserID, profileID, approvedUser.UserID, order.OfferingID, order.OrderType, order.Status, order.PaymentStatus, order.TotalAmount, fulfillmentJSON, createdAt, order.UpdatedAt); err != nil {
			return err
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO payments (
				id, order_id, provider, status, amount, currency, provider_reference, checkout_url, metadata, created_at, updated_at
			) VALUES ($1, $2, 'manual_test', $3, $4, 'IDR', $5, $6, '{"seeded":true}'::jsonb, $7, $8)
		`, order.PaymentID, order.ID, order.PaymentRecordStatus, order.TotalAmount, order.PaymentProviderRef, fmt.Sprintf("http://bidan.lvh.me:3002/id/orders/%s", order.ID), createdAt, order.UpdatedAt); err != nil {
			return err
		}

		for eventIndex, eventType := range order.EventTypes {
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO order_events (
					id, order_id, event_type, actor_kind, actor_id, payload, created_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7)
			`, fmt.Sprintf("seed_order_event_%s_%s", order.ID, eventType), order.ID, eventType, actorKindForOrderEvent(eventType), actorIDForOrderEvent(eventType, customerUser.UserID, approvedUser.UserID, "adm-03"), orderEventPayload(eventType, order), createdAt.Add(time.Duration(eventIndex)*15*time.Minute)); err != nil {
				return err
			}
		}
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO refunds (
			id, order_id, payment_id, status, amount, currency, reason, created_at, updated_at
		) VALUES ($1, $2, $3, 'processed', 350000, 'IDR', $4, $5, $6)
	`, "seed_refund_processed", "seed_order_refunded", "seed_payment_refunded", "Customer meminta reschedule penuh dan memilih refund.", ts(13), ts(14)); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO payouts (
			id, professional_profile_id, status, amount, currency, provider, provider_reference, metadata, created_at, updated_at
		) VALUES
			($1, $2, 'pending', 125000, 'IDR', 'manual_test', '', '{"seeded":true,"window":"week_1"}'::jsonb, $3, $3),
			($4, $2, 'paid', 214000, 'IDR', 'manual_test', 'manual-payout-214000', '{"seeded":true,"window":"week_0"}'::jsonb, $5, $6)
	`, "seed_payout_pending", profileID, ts(15), "seed_payout_paid", ts(4), ts(5)); err != nil {
		return err
	}

	return nil
}

func seedChatAndSupport(ctx context.Context, tx *sql.Tx, ts func(int) time.Time) error {
	customerUser := demoViewerAccounts["customer"]
	approvedUser := demoViewerAccounts["approved_professional"]

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO chat_threads (
			id, platform_id, order_id, title, participant_kind, participant_id, created_at, updated_at
		) VALUES
			($1, $2, NULL, $3, 'conversation', $4, $5, $6),
			($7, $2, $8, $9, 'order', $4, $10, $11)
	`, "seed_chat_thread_preorder", bidanPlatformID, "Pre-order konsultasi laktasi", customerUser.UserID, ts(6), ts(6), "seed_chat_thread_order_followup", "seed_order_pending_fulfillment", "Follow-up sesi laktasi", ts(11), ts(12)); err != nil {
		return err
	}

	chatMessages := []struct {
		id, threadID, senderKind, senderID, senderName, body string
		sentAt                                               time.Time
	}{
		{
			id:         "seed_chat_message_preorder_customer",
			threadID:   "seed_chat_thread_preorder",
			senderKind: "viewer",
			senderID:   customerUser.UserID,
			senderName: customerUser.DisplayName,
			body:       "Halo kak, apakah sesi online bisa fokus ke pumping plan malam hari?",
			sentAt:     ts(6),
		},
		{
			id:         "seed_chat_message_preorder_professional",
			threadID:   "seed_chat_thread_preorder",
			senderKind: "professional",
			senderID:   approvedUser.UserID,
			senderName: approvedUser.DisplayName,
			body:       "Bisa. Biasanya saya bantu audit jadwal, durasi pumping, dan target supply selama 7 hari.",
			sentAt:     ts(6).Add(12 * time.Minute),
		},
		{
			id:         "seed_chat_message_order_customer",
			threadID:   "seed_chat_thread_order_followup",
			senderKind: "viewer",
			senderID:   customerUser.UserID,
			senderName: customerUser.DisplayName,
			body:       "Saya sudah bayar. Mohon kirim link sesi malam ini ya.",
			sentAt:     ts(11),
		},
		{
			id:         "seed_chat_message_order_professional",
			threadID:   "seed_chat_thread_order_followup",
			senderKind: "professional",
			senderID:   approvedUser.UserID,
			senderName: approvedUser.DisplayName,
			body:       "Siap, link Zoom sudah saya masukkan ke catatan order dan akan saya kirim ulang 10 menit sebelum sesi.",
			sentAt:     ts(11).Add(15 * time.Minute),
		},
	}
	for _, message := range chatMessages {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO chat_messages (
				id, thread_id, sender_kind, sender_id, sender_name, body, sent_at, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		`, message.id, message.threadID, message.senderKind, message.senderID, message.senderName, message.body, message.sentAt); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO support_tickets (
			id, platform_id, order_id, reporter_user_id, assigned_admin_id, chat_thread_id, status, priority, subject, details, metadata, created_at, updated_at
		) VALUES
			($1, $2, NULL, $3, NULL, $4, 'new', 'normal', $5, $6, '{"seeded":true}'::jsonb, $7, $7),
			($8, $2, $9, $3, 'adm-01', $10, 'triaged', 'high', $11, $12, '{"seeded":true}'::jsonb, $13, $14),
			($15, $2, $16, $3, 'adm-03', NULL, 'resolved', 'normal', $17, $18, '{"seeded":true}'::jsonb, $19, $20)
	`, "seed_support_ticket_new", bidanPlatformID, customerUser.UserID, "seed_chat_thread_preorder", "Butuh konfirmasi sebelum booking", "Minta ringkasan apa saja yang akan dibahas pada sesi online pertama.", ts(6),
		"seed_support_ticket_triaged", "seed_order_pending_fulfillment", "seed_chat_thread_order_followup", "Link meeting belum muncul di order", "Customer sudah bayar tetapi belum melihat link sesi.", ts(11), ts(12),
		"seed_support_ticket_resolved", "seed_order_refunded", "Konfirmasi refund home visit", "Refund diminta karena jadwal kunjungan berubah total.", ts(13), ts(14)); err != nil {
		return err
	}

	type supportEvent struct {
		id, ticketID, actorKind, actorID, eventType, publicNote, internalNote string
		createdAt                                                              time.Time
		payload                                                                map[string]any
	}
	events := []supportEvent{
		{
			id:         "seed_support_event_new_created",
			ticketID:   "seed_support_ticket_new",
			actorKind:  "viewer",
			actorID:    customerUser.UserID,
			eventType:  "created",
			publicNote: "Customer menanyakan ruang lingkup sesi sebelum checkout.",
			createdAt:  ts(6),
			payload:    map[string]any{"seeded": true},
		},
		{
			id:           "seed_support_event_triaged_created",
			ticketID:     "seed_support_ticket_triaged",
			actorKind:    "viewer",
			actorID:      customerUser.UserID,
			eventType:    "created",
			publicNote:   "Link sesi belum terlihat di detail order.",
			createdAt:    ts(11),
			payload:      map[string]any{"seeded": true},
		},
		{
			id:           "seed_support_event_triaged_status",
			ticketID:     "seed_support_ticket_triaged",
			actorKind:    "admin",
			actorID:      "adm-01",
			eventType:    "status_changed",
			publicNote:   "Tim support sedang menghubungi profesional untuk memastikan link meeting aktif.",
			internalNote: "Perlu follow up SLA 15 menit sebelum sesi dimulai.",
			createdAt:    ts(12),
			payload:      map[string]any{"assignedAdminId": "adm-01", "status": "triaged"},
		},
		{
			id:           "seed_support_event_resolved_created",
			ticketID:     "seed_support_ticket_resolved",
			actorKind:    "viewer",
			actorID:      customerUser.UserID,
			eventType:    "created",
			publicNote:   "Customer meminta refund penuh untuk kunjungan rumah.",
			createdAt:    ts(13),
			payload:      map[string]any{"seeded": true},
		},
		{
			id:           "seed_support_event_resolved_status",
			ticketID:     "seed_support_ticket_resolved",
			actorKind:    "admin",
			actorID:      "adm-03",
			eventType:    "status_changed",
			publicNote:   "Refund diproses penuh dan ticket ditutup.",
			internalNote: "Payout terkait akan dikeluarkan dari batch minggu ini.",
			createdAt:    ts(14),
			payload:      map[string]any{"status": "resolved"},
		},
	}
	for _, event := range events {
		payloadJSON, err := json.Marshal(event.payload)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO support_ticket_events (
				id, ticket_id, actor_kind, actor_id, event_type, public_note, internal_note, payload, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, event.id, event.ticketID, event.actorKind, event.actorID, event.eventType, event.publicNote, event.internalNote, payloadJSON, event.createdAt); err != nil {
			return err
		}
	}

	return nil
}

func seedOutboxEvents(ctx context.Context, tx *sql.Tx, ts func(int) time.Time, approvedDocuments []demoDocument) error {
	if len(approvedDocuments) == 0 {
		return nil
	}

	approvedUser := demoViewerAccounts["approved_professional"]
	approvedDocumentsJSON, err := json.Marshal(approvedDocuments)
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO outbox_events (
			id, topic, aggregate_type, aggregate_id, payload, status, attempts, available_at, last_error, created_at, delivered_at
		) VALUES ($1, 'professional_application_reviews', 'professional_application', $2, $3, 'delivered', 0, $4, '', $4, $5)
	`, "seed_outbox_professional_approved", approvedUser.UserID, mapJSON(map[string]any{
		"adminId":       "adm-02",
		"applicationId": "seed_application_approved_midwife",
		"decision":      "approved",
		"documents":     json.RawMessage(approvedDocumentsJSON),
		"reviewNotes":   "Seeder demo: aplikasi sudah disetujui dan storefront aktif.",
	}), ts(2), ts(2)); err != nil {
		return err
	}

	return nil
}

func mapJSON(value map[string]any) []byte {
	payload, _ := json.Marshal(value)
	return payload
}

func actorKindForOrderEvent(eventType string) string {
	switch eventType {
	case "payment_marked_paid":
		return "payment"
	case "refunded":
		return "admin"
	default:
		return "customer"
	}
}

func actorIDForOrderEvent(eventType string, customerUserID string, professionalUserID string, adminID string) string {
	switch eventType {
	case "payment_marked_paid":
		return "manual_test"
	case "completed":
		return professionalUserID
	case "refunded":
		return adminID
	default:
		return customerUserID
	}
}

func orderEventPayload(eventType string, order struct {
	EventTypes          []string
	FulfillmentDetails  map[string]any
	ID                  string
	OfferingID          string
	OrderType           string
	PaymentID           string
	PaymentProviderRef  string
	PaymentStatus       string
	PaymentRecordStatus string
	Status              string
	TotalAmount         int
	UpdatedAt           time.Time
}) []byte {
	payload := map[string]any{
		"offeringId": order.OfferingID,
		"orderType":  order.OrderType,
		"seeded":     true,
		"status":     order.Status,
		"total":      order.TotalAmount,
	}
	switch eventType {
	case "payment_marked_paid":
		payload["paymentId"] = order.PaymentID
		payload["paymentStatus"] = order.PaymentStatus
	case "completed":
		payload["fulfilledAt"] = order.UpdatedAt.UTC().Format(time.RFC3339)
	case "refunded":
		payload["refundId"] = "seed_refund_processed"
	}
	bytes, _ := json.Marshal(payload)
	return bytes
}
