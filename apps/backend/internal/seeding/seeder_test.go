package seeding

import (
	"testing"

	"bidanapp/apps/backend/internal/modules/readmodel"
)

func TestBuildPortalCoverageDataFallsBackToPracticeAreaForOnlineOnlyProfiles(t *testing.T) {
	t.Parallel()

	coverage := buildPortalCoverageData(
		readmodel.Professional{
			ID:       "prof-virtual",
			Location: "Jakarta Selatan Video Care",
			Availability: readmodel.ProfessionalAvailability{
				IsAvailable: true,
			},
			PracticeLocation: &readmodel.ProfessionalPracticeLocation{
				Address: "Studio virtual Cilandak",
				AreaID:  "jakarta-selatan-cilandak",
				Label:   "Jakarta Selatan Video Care",
			},
			ResponseTime: "< 10 menit",
		},
		"published",
		map[string]readmodel.Area{
			"jakarta-selatan-cilandak": {
				ID:   "jakarta-selatan-cilandak",
				City: "Jakarta Selatan",
			},
		},
	)

	if len(coverage.CoverageAreaIDs) != 1 || coverage.CoverageAreaIDs[0] != "jakarta-selatan-cilandak" {
		t.Fatalf("expected practice area fallback, got %#v", coverage.CoverageAreaIDs)
	}

	if coverage.City != "Jakarta Selatan" {
		t.Fatalf("expected city to resolve from fallback area, got %q", coverage.City)
	}
}

func TestBuildPortalCoverageDataKeepsDraftCoverageEmpty(t *testing.T) {
	t.Parallel()

	coverage := buildPortalCoverageData(
		readmodel.Professional{
			ID: "prof-draft",
			PracticeLocation: &readmodel.ProfessionalPracticeLocation{
				AreaID: "jakarta-selatan-cilandak",
			},
		},
		"draft",
		map[string]readmodel.Area{
			"jakarta-selatan-cilandak": {
				ID:   "jakarta-selatan-cilandak",
				City: "Jakarta Selatan",
			},
		},
	)

	if len(coverage.CoverageAreaIDs) != 0 {
		t.Fatalf("expected draft coverage to stay empty, got %#v", coverage.CoverageAreaIDs)
	}
}
