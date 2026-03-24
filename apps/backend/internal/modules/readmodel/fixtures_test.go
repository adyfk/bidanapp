package readmodel

import (
	"os"
	"path/filepath"
	"testing"
)

func writeCatalogFixture(t *testing.T, dataDir string) {
	t.Helper()

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		t.Fatalf("create data dir: %v", err)
	}

	professionals := `[
  {
    "index": 1,
    "id": "prof-1",
    "slug": "bidan-sari",
    "name": "Bidan Sari",
    "title": "Senior Midwife",
    "location": "Bandung",
    "rating": 4.9,
    "reviews": "120",
    "experience": "8 years",
    "clientsServed": "560",
    "image": "https://images.unsplash.com/photo-1",
    "coverImage": "https://images.unsplash.com/photo-2",
    "isAvailable": true,
    "responseTime": "5 min",
    "about": "Trusted professional"
  }
]`

	if err := os.WriteFile(filepath.Join(dataDir, "professionals.json"), []byte(professionals), 0o644); err != nil {
		t.Fatalf("write professionals fixture: %v", err)
	}
}

func WriteCatalogFixtureForTests(t *testing.T, dataDir string) {
	t.Helper()
	writeCatalogFixture(t, dataDir)
}
