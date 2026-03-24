package readmodel

import (
	"context"
	"path/filepath"
	"runtime"
	"testing"

	"bidanapp/apps/backend/internal/platform/portalstore"
)

func TestBootstrapBuildsBackendSeedPayload(t *testing.T) {
	t.Parallel()

	service := NewService(repositorySeedDataDir(t), portalstore.NewMemoryStore())

	payload, err := service.Bootstrap(context.Background())
	if err != nil {
		t.Fatalf("build bootstrap payload: %v", err)
	}

	if len(payload.Catalog.Categories) == 0 {
		t.Fatal("expected bootstrap catalog categories")
	}

	if len(payload.Catalog.Areas) == 0 {
		t.Fatal("expected bootstrap catalog areas")
	}

	if len(payload.Catalog.Services) == 0 {
		t.Fatal("expected bootstrap catalog services")
	}

	if len(payload.Catalog.Professionals) == 0 {
		t.Fatal("expected bootstrap catalog professionals")
	}

	if payload.ActiveHomeFeed.ID == "" {
		t.Fatal("expected active home feed")
	}

	if payload.CurrentConsumer.ID == "" {
		t.Fatal("expected current consumer")
	}

	if payload.CurrentUserContext.ID == "" {
		t.Fatal("expected current user context")
	}

	if len(payload.AppSectionConfig.HomeCategoryIDs) == 0 {
		t.Fatal("expected home category config")
	}
}

func repositorySeedDataDir(t *testing.T) string {
	t.Helper()

	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("determine current file for repository seed data path")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(currentFile), "..", "..", "..", "..", "backend", "seeddata"))
}
