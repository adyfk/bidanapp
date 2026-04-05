package professionalportal

import (
	"context"
	"testing"

	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/portalstore"
)

func TestSessionRoundTrip(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())
	snapshot := map[string]any{
		"state": map[string]any{
			"activeProfessionalId": "prof-123",
			"displayName":          "Bidan Rani",
		},
	}

	saved, err := service.UpsertSession(context.Background(), UpsertProfessionalPortalSessionRequest{
		Snapshot: snapshot,
	})
	if err != nil {
		t.Fatalf("upsert session: %v", err)
	}

	if !saved.HasSnapshot {
		t.Fatal("expected saved session snapshot")
	}

	if saved.ProfessionalID != "prof-123" {
		t.Fatalf("unexpected professional id: %s", saved.ProfessionalID)
	}

	loaded, err := service.Session(context.Background(), "prof-123")
	if err != nil {
		t.Fatalf("load session: %v", err)
	}

	if !loaded.HasSnapshot {
		t.Fatal("expected loaded session snapshot")
	}

	state, ok := loaded.Snapshot["state"].(map[string]any)
	if !ok {
		t.Fatalf("expected state object, got %#v", loaded.Snapshot["state"])
	}

	if got := state["displayName"]; got != "Bidan Rani" {
		t.Fatalf("unexpected display name: %#v", got)
	}
}

func TestUpsertSessionRequiresProfessionalID(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())

	_, err := service.UpsertSession(context.Background(), UpsertProfessionalPortalSessionRequest{
		Snapshot: map[string]any{
			"state": map[string]any{},
		},
	})
	if err != ErrInvalidProfessionalID {
		t.Fatalf("expected ErrInvalidProfessionalID, got %v", err)
	}
}

func TestProfileCoverageServicesAndRequestsRoundTrip(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())
	ctx := context.Background()

	profile, err := service.UpsertProfile(ctx, UpsertProfessionalPortalProfileData{
		AcceptingNewClients:        true,
		AutoApproveInstantBookings: false,
		City:                       "Bandung",
		CredentialNumber:           "STR-123",
		DisplayName:                "Bidan Rani",
		Phone:                      "+62 812 0000 0000",
		ProfessionalID:             "prof-123",
		PublicBio:                  "Melayani laktasi dan edukasi nifas.",
		ResponseTimeGoal:           "< 30 menit",
		YearsExperience:            "8 years",
	})
	if err != nil {
		t.Fatalf("upsert profile: %v", err)
	}

	if profile.DisplayName != "Bidan Rani" {
		t.Fatalf("unexpected profile display name: %s", profile.DisplayName)
	}

	coverage, err := service.UpsertCoverage(ctx, ProfessionalPortalCoverageData{
		AcceptingNewClients:        true,
		AutoApproveInstantBookings: true,
		AvailabilityRulesByMode: map[string]readmodel.ProfessionalAvailabilityRules{
			"home_visit": {
				MinimumNoticeHours: 4,
				WeeklyHours: []readmodel.ProfessionalWeeklyAvailabilityWindow{
					{
						EndTime:             "12:00",
						ID:                  "window-1",
						Index:               1,
						IsEnabled:           true,
						SlotIntervalMinutes: 60,
						StartTime:           "09:00",
						Weekday:             "monday",
					},
				},
			},
		},
		City:              "Bandung",
		CoverageAreaIDs:   []string{"area-1", "area-2"},
		CoverageCenter:    readmodel.GeoPoint{Latitude: -6.9, Longitude: 107.6},
		HomeVisitRadiusKm: 12,
		PracticeAddress:   "Jl. Melati 10",
		PracticeLabel:     "Klinik Melati",
		ProfessionalID:    "prof-123",
		PublicBio:         "Bio operasional",
		ResponseTimeGoal:  "< 20 menit",
	})
	if err != nil {
		t.Fatalf("upsert coverage: %v", err)
	}

	if len(coverage.CoverageAreaIDs) != 2 {
		t.Fatalf("expected persisted coverage areas, got %#v", coverage.CoverageAreaIDs)
	}

	services, err := service.UpsertServices(ctx, ProfessionalPortalServicesData{
		ProfessionalID: "prof-123",
		ServiceConfigurations: []ProfessionalPortalManagedService{
			{
				BookingFlow:  "request",
				DefaultMode:  "home_visit",
				Duration:     "60 min",
				Featured:     true,
				ID:           "svc-config-1",
				Index:        1,
				IsActive:     true,
				Price:        "Rp 250.000",
				ServiceID:    "svc-1",
				ServiceModes: readmodel.ServiceMode{HomeVisit: true},
				Source:       "existing",
				Summary:      "Kunjungan rumah pasca persalinan",
			},
		},
	})
	if err != nil {
		t.Fatalf("upsert services: %v", err)
	}

	if len(services.ServiceConfigurations) != 1 {
		t.Fatalf("expected persisted services, got %#v", services.ServiceConfigurations)
	}

	requests, err := service.UpsertRequests(ctx, ProfessionalPortalRequestsData{
		ProfessionalID: "prof-123",
		AppointmentRecords: []ProfessionalPortalManagedAppointmentRecord{
			{
				AreaID:      "area-1",
				BookingFlow: "request",
				CancellationPolicySnapshot: readmodel.ProfessionalCancellationPolicy{
					AfterCutoffOutcome:            "no_refund",
					BeforeCutoffOutcome:           "full_refund",
					CustomerPaidCancelCutoffHours: 12,
					ProfessionalCancelOutcome:     "full_refund",
				},
				ConsumerID:     "consumer-1",
				ID:             "apt-1",
				Index:          1,
				ProfessionalID: "prof-123",
				RequestNote:    "Butuh kontrol laktasi",
				RequestedAt:    "2026-03-22T11:00:00Z",
				RequestedMode:  "home_visit",
				ScheduleSnapshot: ProfessionalPortalAppointmentScheduleSnapshot{
					RequiresSchedule:   true,
					ScheduledTimeLabel: "Senin, 09.00",
				},
				ServiceID:         "svc-1",
				ServiceOfferingID: "svc-config-1",
				ServiceSnapshot: ProfessionalPortalAppointmentServiceSnapshot{
					BookingFlow:       "request",
					CategoryID:        "cat-1",
					CoverImage:        "cover.jpg",
					DefaultMode:       "home_visit",
					Description:       "desc",
					DurationLabel:     "60 min",
					Highlights:        []string{"A"},
					Image:             "image.jpg",
					Name:              "Kunjungan",
					PriceAmount:       250000,
					PriceLabel:        "Rp 250.000",
					ServiceID:         "svc-1",
					ServiceModes:      readmodel.ServiceMode{HomeVisit: true},
					ServiceOfferingID: "svc-config-1",
					ShortDescription:  "short",
					Slug:              "kunjungan",
					Summary:           "summary",
					Tags:              []string{"home"},
				},
				Status: "requested",
				Timeline: []ProfessionalPortalAppointmentTimelineEvent{
					{
						Actor:          "customer",
						CreatedAt:      "2026-03-22T11:00:00Z",
						CreatedAtLabel: "22 Mar 2026, 11.00",
						ID:             "apt-1-timeline-1",
						ToStatus:       "requested",
					},
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("upsert requests: %v", err)
	}

	if len(requests.AppointmentRecords) != 1 {
		t.Fatalf("expected persisted appointment records, got %#v", requests.AppointmentRecords)
	}

	portfolio, err := service.UpsertPortfolio(ctx, ProfessionalPortalPortfolioData{
		ProfessionalID: "prof-123",
		PortfolioEntries: []ProfessionalPortalPortfolioEntry{
			{
				ID:          "portfolio-1",
				Index:       1,
				Image:       "portfolio.jpg",
				Outcomes:    []string{"ASI eksklusif stabil"},
				PeriodLabel: "Maret 2026",
				ServiceID:   "svc-1",
				Summary:     "Pendampingan laktasi intensif.",
				Title:       "Kasus laktasi rumah",
				Visibility:  "public",
			},
		},
	})
	if err != nil {
		t.Fatalf("upsert portfolio: %v", err)
	}

	if len(portfolio.PortfolioEntries) != 1 {
		t.Fatalf("expected persisted portfolio entries, got %#v", portfolio.PortfolioEntries)
	}

	if _, err := service.SubmitProfileForReview(ctx, "prof-123"); err != nil {
		t.Fatalf("submit profile for review: %v", err)
	}

	gallery, err := service.UpsertGallery(ctx, ProfessionalPortalGalleryData{
		ProfessionalID: "prof-123",
		GalleryItems: []ProfessionalPortalGalleryItem{
			{
				Alt:        "Kunjungan rumah",
				ID:         "gallery-1",
				Image:      "gallery.jpg",
				Index:      1,
				IsFeatured: true,
				Label:      "Home visit",
			},
		},
	})
	if err != nil {
		t.Fatalf("upsert gallery: %v", err)
	}

	if len(gallery.GalleryItems) != 1 {
		t.Fatalf("expected persisted gallery items, got %#v", gallery.GalleryItems)
	}

	trust, err := service.UpsertTrust(ctx, ProfessionalPortalTrustData{
		ProfessionalID: "prof-123",
		Credentials: []ProfessionalPortalCredential{
			{
				ID:     "credential-1",
				Index:  1,
				Issuer: "Kemenkes",
				Note:   "Terdaftar aktif",
				Title:  "STR Bidan",
				Year:   "2026",
			},
		},
		ActivityStories: []ProfessionalPortalActivityStory{
			{
				CapturedAt: "22 Mar 2026",
				ID:         "story-1",
				Image:      "story.jpg",
				Index:      1,
				Location:   "Bandung",
				Note:       "Pendampingan nifas dengan keluarga.",
				Title:      "Kunjungan keluarga",
			},
		},
	})
	if err != nil {
		t.Fatalf("upsert trust: %v", err)
	}

	if len(trust.Credentials) != 1 || len(trust.ActivityStories) != 1 {
		t.Fatalf("expected persisted trust resources, got %#v", trust)
	}

	loadedProfile, err := service.Profile(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load profile: %v", err)
	}
	if loadedProfile.ReviewState.Status != "submitted" {
		t.Fatalf("unexpected review state: %#v", loadedProfile.ReviewState)
	}

	loadedCoverage, err := service.Coverage(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load coverage: %v", err)
	}
	if loadedCoverage.PracticeLabel != "Klinik Melati" {
		t.Fatalf("unexpected practice label: %s", loadedCoverage.PracticeLabel)
	}

	loadedServices, err := service.Services(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load services: %v", err)
	}
	if loadedServices.ServiceConfigurations[0].ServiceID != "svc-1" {
		t.Fatalf("unexpected service id: %#v", loadedServices.ServiceConfigurations)
	}

	loadedRequests, err := service.Requests(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load requests: %v", err)
	}
	if loadedRequests.AppointmentRecords[0].ID != "apt-1" {
		t.Fatalf("unexpected appointment record: %#v", loadedRequests.AppointmentRecords)
	}

	loadedPortfolio, err := service.Portfolio(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load portfolio: %v", err)
	}
	if loadedPortfolio.PortfolioEntries[0].Visibility != "public" {
		t.Fatalf("unexpected portfolio visibility: %#v", loadedPortfolio.PortfolioEntries)
	}

	loadedGallery, err := service.Gallery(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load gallery: %v", err)
	}
	if loadedGallery.GalleryItems[0].Label != "Home visit" {
		t.Fatalf("unexpected gallery item: %#v", loadedGallery.GalleryItems)
	}

	loadedTrust, err := service.Trust(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load trust: %v", err)
	}
	if loadedTrust.Credentials[0].Title != "STR Bidan" || loadedTrust.ActivityStories[0].Title != "Kunjungan keluarga" {
		t.Fatalf("unexpected trust resources: %#v", loadedTrust)
	}

	session, err := service.Session(ctx, "prof-123")
	if err != nil {
		t.Fatalf("load session after granular updates: %v", err)
	}
	if !session.HasSnapshot {
		t.Fatal("expected session snapshot to be patched by granular updates")
	}
}

func TestUpsertAdminReviewStatePreservesProfileFieldsAndLifecycleState(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())
	ctx := context.Background()

	_, err := service.UpsertProfile(ctx, UpsertProfessionalPortalProfileData{
		AcceptingNewClients:        false,
		AutoApproveInstantBookings: false,
		City:                       "Jakarta Selatan",
		CredentialNumber:           "STR-456",
		DisplayName:                "Bidan Nila",
		Phone:                      "+62 811 0000 1111",
		ProfessionalID:             "prof-admin-review",
		PublicBio:                  "Pendamping nifas area Jabodetabek.",
		ResponseTimeGoal:           "< 15 menit",
		YearsExperience:            "11 years",
	})
	if err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	seedReviewReadyResources(t, service, seedReviewReadyResourcesInput{
		AcceptingNewClients:        false,
		AutoApproveInstantBookings: false,
		City:                       "Jakarta Selatan",
		ProfessionalID:             "prof-admin-review",
		PublicBio:                  "Pendamping nifas area Jabodetabek.",
		ResponseTimeGoal:           "< 15 menit",
	})
	if _, err := service.SubmitProfileForReview(ctx, "prof-admin-review"); err != nil {
		t.Fatalf("submit profile: %v", err)
	}

	verifiedProfile, err := service.UpsertAdminReviewState(ctx, ProfessionalPortalAdminReviewStateData{
		ProfessionalID: "prof-admin-review",
		ReviewState: ProfessionalPortalReviewState{
			ReviewedAt:   "2026-03-24T09:00:00Z",
			ReviewerName: "Admin BidanCare",
			Status:       "verified",
			SubmittedAt:  "2026-03-24T08:00:00Z",
		},
	})
	if err != nil {
		t.Fatalf("verify review state: %v", err)
	}

	if verifiedProfile.DisplayName != "Bidan Nila" {
		t.Fatalf("expected profile fields to be preserved, got display name %q", verifiedProfile.DisplayName)
	}
	if verifiedProfile.ReviewState.Status != "verified" {
		t.Fatalf("expected verified review state, got %#v", verifiedProfile.ReviewState)
	}
	if verifiedProfile.AcceptingNewClients {
		t.Fatal("expected acceptingNewClients to remain false before publish")
	}

	acceptingNewClients := true
	publishedProfile, err := service.UpsertAdminReviewState(ctx, ProfessionalPortalAdminReviewStateData{
		AcceptingNewClients: &acceptingNewClients,
		ProfessionalID:      "prof-admin-review",
		ReviewState: ProfessionalPortalReviewState{
			PublishedAt:  "2026-03-24T10:00:00Z",
			ReviewedAt:   "2026-03-24T09:00:00Z",
			ReviewerName: "Admin BidanCare",
			Status:       "published",
			SubmittedAt:  "2026-03-24T08:00:00Z",
		},
	})
	if err != nil {
		t.Fatalf("publish review state: %v", err)
	}

	if !publishedProfile.AcceptingNewClients {
		t.Fatal("expected publish flow to set acceptingNewClients")
	}
	if publishedProfile.ReviewState.Status != "published" {
		t.Fatalf("expected published review state, got %#v", publishedProfile.ReviewState)
	}

	loadedProfile, err := service.Profile(ctx, "prof-admin-review")
	if err != nil {
		t.Fatalf("load updated profile: %v", err)
	}
	if loadedProfile.DisplayName != "Bidan Nila" || loadedProfile.City != "Jakarta Selatan" {
		t.Fatalf("expected profile fields to survive admin review updates, got %#v", loadedProfile)
	}
	if loadedProfile.ReviewState.Status != "published" || loadedProfile.ReviewState.PublishedAt == "" {
		t.Fatalf("expected persisted published lifecycle state, got %#v", loadedProfile.ReviewState)
	}

	adminReviewStates, err := service.AdminReviewStates(ctx)
	if err != nil {
		t.Fatalf("load admin review states: %v", err)
	}
	if adminReviewStates.ReviewStatesByProfessionalID["prof-admin-review"].Status != "published" {
		t.Fatalf("expected admin review state map to expose published status, got %#v", adminReviewStates)
	}
}

func TestSubmitProfileForReviewRejectsIncompleteProfile(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())
	ctx := context.Background()

	if _, err := service.UpsertProfile(ctx, UpsertProfessionalPortalProfileData{
		City:            "Bandung",
		DisplayName:     "Bidan Maya",
		Phone:           "+62 811 0000 2222",
		ProfessionalID:  "prof-incomplete",
		PublicBio:       "Profil belum lengkap.",
		YearsExperience: "4 years",
	}); err != nil {
		t.Fatalf("seed incomplete profile: %v", err)
	}

	_, err := service.SubmitProfileForReview(ctx, "prof-incomplete")
	if err != ErrProfileNotReadyForReview {
		t.Fatalf("SubmitProfileForReview() error = %v, want ErrProfileNotReadyForReview", err)
	}
}

func TestUpsertProfilePreservesExistingReviewState(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())
	ctx := context.Background()

	seedReviewReadyProfile(t, service, "prof-preserve-review")

	profile, err := service.Profile(ctx, "prof-preserve-review")
	if err != nil {
		t.Fatalf("load seeded profile: %v", err)
	}
	if profile.ReviewState.Status != "draft" {
		t.Fatalf("expected draft review state before submission, got %#v", profile.ReviewState)
	}

	if _, err := service.SubmitProfileForReview(ctx, "prof-preserve-review"); err != nil {
		t.Fatalf("submit profile: %v", err)
	}

	updatedProfile, err := service.UpsertProfile(ctx, UpsertProfessionalPortalProfileData{
		AcceptingNewClients:        true,
		AutoApproveInstantBookings: true,
		City:                       "Bandung",
		CredentialNumber:           "STR-PRESERVE-001",
		DisplayName:                "Bidan Maya Utama",
		Phone:                      "+62 811 0000 3333",
		ProfessionalID:             "prof-preserve-review",
		PublicBio:                  "Profil diperbarui setelah submit review.",
		ResponseTimeGoal:           "< 10 menit",
		YearsExperience:            "6 years",
	})
	if err != nil {
		t.Fatalf("update profile: %v", err)
	}

	if updatedProfile.DisplayName != "Bidan Maya Utama" {
		t.Fatalf("expected updated display name, got %q", updatedProfile.DisplayName)
	}
	if updatedProfile.ReviewState.Status != "submitted" {
		t.Fatalf("expected review state to stay submitted, got %#v", updatedProfile.ReviewState)
	}
}

func TestUpsertAdminReviewStateRejectsInvalidTransition(t *testing.T) {
	t.Parallel()

	service := NewService(portalstore.NewMemoryStore())
	ctx := context.Background()

	seedReviewReadyProfile(t, service, "prof-invalid-transition")

	_, err := service.UpsertAdminReviewState(ctx, ProfessionalPortalAdminReviewStateData{
		ProfessionalID: "prof-invalid-transition",
		ReviewState: ProfessionalPortalReviewState{
			PublishedAt:  "2026-03-24T10:00:00Z",
			ReviewedAt:   "2026-03-24T09:00:00Z",
			ReviewerName: "Admin BidanCare",
			Status:       "published",
			SubmittedAt:  "2026-03-24T08:00:00Z",
		},
	})
	if err != ErrInvalidReviewTransition {
		t.Fatalf("UpsertAdminReviewState() error = %v, want ErrInvalidReviewTransition", err)
	}
}

func seedReviewReadyProfile(t *testing.T, service *Service, professionalID string) {
	t.Helper()

	ctx := context.Background()

	if _, err := service.UpsertProfile(ctx, UpsertProfessionalPortalProfileData{
		AcceptingNewClients:        true,
		AutoApproveInstantBookings: true,
		City:                       "Bandung",
		CredentialNumber:           "STR-PRESERVE-001",
		DisplayName:                "Bidan Maya",
		Phone:                      "+62 811 0000 3333",
		ProfessionalID:             professionalID,
		PublicBio:                  "Pendamping nifas dan laktasi.",
		ResponseTimeGoal:           "< 10 menit",
		YearsExperience:            "6 years",
	}); err != nil {
		t.Fatalf("UpsertProfile() error = %v", err)
	}

	seedReviewReadyResources(t, service, seedReviewReadyResourcesInput{
		AcceptingNewClients:        true,
		AutoApproveInstantBookings: true,
		City:                       "Bandung",
		ProfessionalID:             professionalID,
		PublicBio:                  "Pendamping nifas dan laktasi.",
		ResponseTimeGoal:           "< 10 menit",
	})
}

type seedReviewReadyResourcesInput struct {
	AcceptingNewClients        bool
	AutoApproveInstantBookings bool
	City                       string
	ProfessionalID             string
	PublicBio                  string
	ResponseTimeGoal           string
}

func seedReviewReadyResources(t *testing.T, service *Service, input seedReviewReadyResourcesInput) {
	t.Helper()

	ctx := context.Background()

	if _, err := service.UpsertCoverage(ctx, ProfessionalPortalCoverageData{
		AcceptingNewClients:        input.AcceptingNewClients,
		AutoApproveInstantBookings: input.AutoApproveInstantBookings,
		AvailabilityRulesByMode:    map[string]readmodel.ProfessionalAvailabilityRules{},
		City:                       input.City,
		CoverageAreaIDs:            []string{"area-1"},
		PracticeAddress:            "Jl. Melati 10",
		PracticeLabel:              "Klinik Melati",
		ProfessionalID:             input.ProfessionalID,
		PublicBio:                  input.PublicBio,
		ResponseTimeGoal:           input.ResponseTimeGoal,
	}); err != nil {
		t.Fatalf("UpsertCoverage() error = %v", err)
	}

	if _, err := service.UpsertServices(ctx, ProfessionalPortalServicesData{
		ProfessionalID: input.ProfessionalID,
		ServiceConfigurations: []ProfessionalPortalManagedService{
			{
				BookingFlow:  "instant",
				DefaultMode:  "online",
				Duration:     "60 min",
				Featured:     true,
				ID:           "svc-config-ready",
				Index:        1,
				IsActive:     true,
				Price:        "Rp 250.000",
				ServiceID:    "svc-1",
				ServiceModes: readmodel.ServiceMode{Online: true},
				Source:       "existing",
				Summary:      "Konsultasi laktasi online.",
			},
		},
	}); err != nil {
		t.Fatalf("UpsertServices() error = %v", err)
	}

	if _, err := service.UpsertPortfolio(ctx, ProfessionalPortalPortfolioData{
		ProfessionalID: input.ProfessionalID,
		PortfolioEntries: []ProfessionalPortalPortfolioEntry{
			{
				ID:          "portfolio-ready",
				Index:       1,
				Image:       "portfolio.jpg",
				Outcomes:    []string{"ASI eksklusif stabil"},
				PeriodLabel: "Maret 2026",
				ServiceID:   "svc-1",
				Summary:     "Pendampingan laktasi intensif.",
				Title:       "Kasus laktasi rumah",
				Visibility:  "public",
			},
		},
	}); err != nil {
		t.Fatalf("UpsertPortfolio() error = %v", err)
	}
}
