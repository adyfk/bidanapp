package simulation

import (
	"context"
	"errors"
	"testing"
)

func TestProfessionalBySlugReturnsProfessional(t *testing.T) {
	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	service := NewService(dataDir)

	payload, err := service.ProfessionalBySlug(context.Background(), "bidan-sari")
	if err != nil {
		t.Fatalf("lookup professional by slug: %v", err)
	}

	if payload.Slug != "bidan-sari" {
		t.Fatalf("unexpected slug: %s", payload.Slug)
	}
}

func TestProfessionalBySlugRejectsInvalidSlug(t *testing.T) {
	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	service := NewService(dataDir)

	_, err := service.ProfessionalBySlug(context.Background(), "../etc/passwd")
	if !errors.Is(err, ErrInvalidSlug) {
		t.Fatalf("expected ErrInvalidSlug, got %v", err)
	}
}
