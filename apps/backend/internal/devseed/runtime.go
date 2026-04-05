package devseed

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
)

const (
	defaultCustomerPassword     = "Customer2026A"
	defaultProfessionalPassword = "Professional2026A"
)

type RuntimeServices struct {
	AdminAuth        *adminauth.Service
	CustomerAuth     *customerauth.Service
	ProfessionalAuth *professionalauth.Service
}

type seedConsumer struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type seedProfessional struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func SeedAuthRuntime(ctx context.Context, cfg config.Config, services RuntimeServices) error {
	if services.CustomerAuth == nil || services.ProfessionalAuth == nil || services.AdminAuth == nil {
		return fmt.Errorf("all runtime auth services are required")
	}
	if err := services.AdminAuth.Bootstrap(ctx); err != nil {
		return fmt.Errorf("bootstrap admin auth runtime: %w", err)
	}

	consumers, err := readSeedConsumers(filepath.Join(cfg.SeedData.DataDir, "consumers.json"))
	if err != nil {
		return err
	}

	professionals, err := readSeedProfessionals(filepath.Join(cfg.SeedData.DataDir, "professionals.json"))
	if err != nil {
		return err
	}

	now := time.Now().UTC()

	for index, consumer := range consumers {
		registeredAt := now.Add(-time.Duration(index+1) * time.Hour)
		if err := services.CustomerAuth.SeedAccount(ctx, customerauth.SeedAccountInput{
			City:         "",
			ConsumerID:   strings.TrimSpace(consumer.ID),
			DisplayName:  strings.TrimSpace(consumer.Name),
			Password:     defaultCustomerPassword,
			Phone:        normalizePhone(consumer.Phone),
			RegisteredAt: registeredAt,
		}); err != nil {
			return fmt.Errorf("seed customer auth account %s: %w", consumer.ID, err)
		}

		if _, err := services.CustomerAuth.SeedSession(ctx, customerauth.SeedSessionInput{
			ConsumerID:  strings.TrimSpace(consumer.ID),
			ExpiresAt:   now.Add(cfg.CustomerAuth.SessionTTL),
			LastLoginAt: now,
			RawToken:    "seed-customer-session-" + strings.TrimSpace(consumer.ID),
		}); err != nil {
			return fmt.Errorf("seed customer auth session %s: %w", consumer.ID, err)
		}
	}

	for index, professional := range professionals {
		professionalID := strings.TrimSpace(professional.ID)
		registeredAt := now.Add(-time.Duration(index+1) * 45 * time.Minute)
		if err := services.ProfessionalAuth.SeedAccount(ctx, professionalauth.SeedAccountInput{
			City:             "",
			CredentialNumber: seedCredentialNumber(professionalID),
			DisplayName:      strings.TrimSpace(professional.Name),
			Password:         defaultProfessionalPassword,
			Phone:            seedProfessionalPhone(index),
			ProfessionalID:   professionalID,
			RegisteredAt:     registeredAt,
		}); err != nil {
			return fmt.Errorf("seed professional auth account %s: %w", professionalID, err)
		}

		if _, err := services.ProfessionalAuth.SeedSession(ctx, professionalauth.SeedSessionInput{
			ExpiresAt:      now.Add(cfg.ProfessionalAuth.SessionTTL),
			LastLoginAt:    now,
			ProfessionalID: professionalID,
			RawToken:       "seed-professional-session-" + professionalID,
		}); err != nil {
			return fmt.Errorf("seed professional auth session %s: %w", professionalID, err)
		}
	}

	for _, credential := range cfg.AdminAuth.Credentials {
		adminID := strings.TrimSpace(credential.AdminID)
		if adminID == "" {
			continue
		}

		if _, err := services.AdminAuth.SeedSession(ctx, adminauth.SeedSessionInput{
			AdminID:          adminID,
			Email:            credential.Email,
			ExpiresAt:        now.Add(cfg.AdminAuth.SessionTTL),
			FocusArea:        credential.FocusArea,
			LastLoginAt:      now,
			LastVisitedRoute: "/admin/overview",
			RawToken:         "seed-admin-session-" + adminID,
		}); err != nil {
			return fmt.Errorf("seed admin auth session %s: %w", adminID, err)
		}
	}

	return nil
}

func readSeedConsumers(path string) ([]seedConsumer, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read seed consumers: %w", err)
	}

	var consumers []seedConsumer
	if err := json.Unmarshal(payload, &consumers); err != nil {
		return nil, fmt.Errorf("decode seed consumers: %w", err)
	}

	return consumers, nil
}

func readSeedProfessionals(path string) ([]seedProfessional, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read seed professionals: %w", err)
	}

	var professionals []seedProfessional
	if err := json.Unmarshal(payload, &professionals); err != nil {
		return nil, fmt.Errorf("decode seed professionals: %w", err)
	}

	return professionals, nil
}

func normalizePhone(value string) string {
	trimmed := strings.TrimSpace(value)
	var builder strings.Builder
	for index, runeValue := range trimmed {
		switch {
		case runeValue >= '0' && runeValue <= '9':
			builder.WriteRune(runeValue)
		case runeValue == '+' && index == 0:
			builder.WriteRune(runeValue)
		}
	}
	return builder.String()
}

func seedProfessionalPhone(index int) string {
	return fmt.Sprintf("+628137000%04d", index+1)
}

func seedCredentialNumber(professionalID string) string {
	return "REG-" + strings.ToUpper(strings.TrimSpace(professionalID)) + "-2026"
}
