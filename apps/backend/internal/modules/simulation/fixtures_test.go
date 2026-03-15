package simulation

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

	catalog := `{
  "categories": [],
  "services": [],
  "professionals": [
    {
      "index": 1,
      "id": "prof-1",
      "slug": "bidan-sari",
      "name": "Bidan Sari",
      "title": "Senior Midwife",
      "categoryId": "cat-1",
      "location": "Bandung",
      "rating": 4.9,
      "reviews": "120",
      "experience": "8 years",
      "clientsServed": "560",
      "image": "https://images.unsplash.com/photo-1",
      "coverImage": "https://images.unsplash.com/photo-2",
      "badgeLabel": "Top Rated",
      "availabilityLabel": "Available today",
      "responseTime": "5 min",
      "specialties": ["ANC"],
      "languages": ["ID"],
      "addressLines": ["Jl. Example 1", "Bandung"],
      "about": "Trusted professional",
      "portfolioStats": [],
      "credentials": [],
      "activityStories": [],
      "portfolioEntries": [],
      "gallery": [],
      "testimonials": [],
      "feedbackSummary": {
        "recommendationRate": "98%",
        "repeatClientRate": "64%"
      },
      "feedbackMetrics": [],
      "feedbackBreakdown": [],
      "recentActivities": [],
      "services": []
    }
  ]
}`

	if err := os.WriteFile(filepath.Join(dataDir, "catalog.json"), []byte(catalog), 0o644); err != nil {
		t.Fatalf("write catalog fixture: %v", err)
	}
}

func WriteCatalogFixtureForTests(t *testing.T, dataDir string) {
	t.Helper()
	writeCatalogFixture(t, dataDir)
}
