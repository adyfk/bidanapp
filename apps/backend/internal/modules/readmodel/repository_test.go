package readmodel

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/portalstore"
)

func TestRepositoryBootstrapsStoreAndServiceReadsFromStoredContent(t *testing.T) {
	t.Parallel()

	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	store := contentstore.NewMemoryStore()
	repository := NewRepository(dataDir, store)
	if err := repository.EnsureBootstrapped(context.Background()); err != nil {
		t.Fatalf("bootstrap content store: %v", err)
	}

	if err := os.Remove(filepath.Join(dataDir, "professionals.json")); err != nil {
		t.Fatalf("remove source file after bootstrap: %v", err)
	}

	service := NewServiceWithRepository(repository, portalstore.NewMemoryStore())

	professional, err := service.ProfessionalBySlug(context.Background(), "bidan-sari")
	if err != nil {
		t.Fatalf("load professional from bootstrapped content store: %v", err)
	}

	if professional.ID != "prof-1" {
		t.Fatalf("unexpected professional payload: %#v", professional)
	}
}

func TestRepositoryReadManyReturnsBootstrappedPayloads(t *testing.T) {
	t.Parallel()

	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	store := contentstore.NewMemoryStore()
	repository := NewRepository(dataDir, store)
	if err := repository.EnsureBootstrapped(context.Background()); err != nil {
		t.Fatalf("EnsureBootstrapped() error = %v", err)
	}

	if err := os.Remove(filepath.Join(dataDir, "professionals.json")); err != nil {
		t.Fatalf("remove professionals fixture: %v", err)
	}

	payloads, err := repository.ReadMany(context.Background(), []string{"professionals.json"})
	if err != nil {
		t.Fatalf("ReadMany() error = %v", err)
	}

	if len(payloads) != 1 {
		t.Fatalf("ReadMany() payload count = %d", len(payloads))
	}
	if len(payloads["professionals.json"]) == 0 {
		t.Fatalf("ReadMany() returned empty payloads: %#v", payloads)
	}
}
