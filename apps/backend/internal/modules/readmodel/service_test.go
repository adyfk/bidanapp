package readmodel

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"bidanapp/apps/backend/internal/platform/portalstore"
)

func TestAppointmentsApplyPortalOverlay(t *testing.T) {
	dataDir := t.TempDir()

	servicesJSON := `[
  {
    "index": 1,
    "id": "svc-1",
    "slug": "postpartum-visit",
    "name": "Postpartum Visit",
    "categoryId": "cat-1",
    "description": "Visit description",
    "shortDescription": "Visit short",
    "image": "service.jpg",
    "coverImage": "service-cover.jpg",
    "tags": ["postpartum"],
    "highlights": ["home visit"],
    "serviceModes": {
      "online": false,
      "homeVisit": true,
      "onsite": false
    },
    "defaultMode": "home_visit"
  }
]`
	offeringsJSON := `[
  {
    "index": 1,
    "id": "offering-1",
    "professionalId": "prof-1",
    "serviceId": "svc-1",
    "duration": "60 min",
    "price": "Rp 250.000",
    "defaultMode": "home_visit",
    "bookingFlow": "request",
    "summary": "Home visit summary",
    "supportsOnline": false,
    "supportsHomeVisit": true,
    "supportsOnsite": false
  }
]`
	appointmentsJSON := `[
  {
    "index": 1,
    "id": "apt-seed",
    "consumerId": "consumer-1",
    "professionalId": "prof-1",
    "serviceId": "svc-1",
    "areaId": "area-bandung",
    "requestedMode": "home_visit",
    "requestNote": "Seed note",
    "requestedAt": "2026-03-20T09:00:00Z",
    "status": "requested",
    "scheduledTimeLabel": "20 Mar 2026 · 10:00",
    "totalPriceLabel": "Rp 250.000",
    "bookingFlow": "request",
    "cancellationPolicySnapshot": {
      "customerPaidCancelCutoffHours": 12,
      "professionalCancelOutcome": "full_refund",
      "beforeCutoffOutcome": "full_refund",
      "afterCutoffOutcome": "manual_refund_required"
    },
    "scheduleSnapshot": {
      "dateIso": "2026-03-20",
      "requiresSchedule": true,
      "scheduleDayId": "day-1",
      "scheduleDayLabel": "Fri, 20 Mar",
      "scheduledTimeLabel": "20 Mar 2026 · 10:00",
      "timeSlotId": "slot-1",
      "timeSlotLabel": "10:00"
    },
    "serviceOfferingId": "offering-1",
    "timeline": []
  }
]`

	for name, contents := range map[string]string{
		"appointments.json":                   appointmentsJSON,
		"professional_service_offerings.json": offeringsJSON,
		"services.json":                       servicesJSON,
	} {
		if err := os.WriteFile(filepath.Join(dataDir, name), []byte(contents), 0o644); err != nil {
			t.Fatalf("write %s fixture: %v", name, err)
		}
	}

	portalStateStore := portalstore.NewMemoryStore()
	if _, err := portalStateStore.Upsert(context.Background(), portalstore.Record{
		ProfessionalID: "prof-1",
		SavedAt:        "2026-03-23T08:00:00Z",
		Snapshot: map[string]any{
			"appointmentRecordsByProfessionalId": map[string]any{
				"prof-1": []map[string]any{
					{
						"id":                "apt-seed",
						"index":             1,
						"consumerId":        "consumer-1",
						"professionalId":    "prof-1",
						"serviceId":         "svc-1",
						"serviceOfferingId": "offering-1",
						"areaId":            "area-bandung",
						"requestedMode":     "home_visit",
						"requestNote":       "Updated from portal",
						"requestedAt":       "2026-03-20T09:00:00Z",
						"status":            "confirmed",
						"bookingFlow":       "request",
						"cancellationPolicySnapshot": map[string]any{
							"customerPaidCancelCutoffHours": 12,
							"professionalCancelOutcome":     "full_refund",
							"beforeCutoffOutcome":           "full_refund",
							"afterCutoffOutcome":            "manual_refund_required",
						},
						"scheduleSnapshot": map[string]any{
							"dateIso":            "2026-03-20",
							"requiresSchedule":   true,
							"scheduleDayId":      "day-1",
							"scheduleDayLabel":   "Fri, 20 Mar",
							"scheduledTimeLabel": "20 Mar 2026 · 10:00",
							"timeSlotId":         "slot-1",
							"timeSlotLabel":      "10:00",
						},
						"serviceSnapshot": map[string]any{
							"bookingFlow":       "request",
							"categoryId":        "cat-1",
							"coverImage":        "service-cover.jpg",
							"defaultMode":       "home_visit",
							"description":       "Visit description",
							"durationLabel":     "60 min",
							"highlights":        []string{"home visit"},
							"image":             "service.jpg",
							"name":              "Postpartum Visit",
							"priceAmount":       250000,
							"priceLabel":        "Rp 250.000",
							"serviceId":         "svc-1",
							"serviceModes":      map[string]any{"online": false, "homeVisit": true, "onsite": false},
							"serviceOfferingId": "offering-1",
							"shortDescription":  "Visit short",
							"slug":              "postpartum-visit",
							"summary":           "Updated summary",
							"tags":              []string{"postpartum"},
						},
						"timeline": []map[string]any{},
					},
					{
						"id":                "apt-live",
						"index":             2,
						"consumerId":        "consumer-2",
						"professionalId":    "prof-1",
						"serviceId":         "svc-1",
						"serviceOfferingId": "offering-1",
						"areaId":            "area-bandung",
						"requestedMode":     "home_visit",
						"requestNote":       "Created from portal",
						"requestedAt":       "2026-03-21T09:00:00Z",
						"status":            "paid",
						"bookingFlow":       "request",
						"cancellationPolicySnapshot": map[string]any{
							"customerPaidCancelCutoffHours": 12,
							"professionalCancelOutcome":     "full_refund",
							"beforeCutoffOutcome":           "full_refund",
							"afterCutoffOutcome":            "manual_refund_required",
						},
						"scheduleSnapshot": map[string]any{
							"dateIso":            "2026-03-21",
							"requiresSchedule":   true,
							"scheduleDayId":      "day-2",
							"scheduleDayLabel":   "Sat, 21 Mar",
							"scheduledTimeLabel": "21 Mar 2026 · 11:00",
							"timeSlotId":         "slot-2",
							"timeSlotLabel":      "11:00",
						},
						"serviceSnapshot": map[string]any{
							"bookingFlow":       "request",
							"categoryId":        "cat-1",
							"coverImage":        "service-cover.jpg",
							"defaultMode":       "home_visit",
							"description":       "Visit description",
							"durationLabel":     "60 min",
							"highlights":        []string{"home visit"},
							"image":             "service.jpg",
							"name":              "Postpartum Visit",
							"priceAmount":       260000,
							"priceLabel":        "Rp 260.000",
							"serviceId":         "svc-1",
							"serviceModes":      map[string]any{"online": false, "homeVisit": true, "onsite": false},
							"serviceOfferingId": "offering-1",
							"shortDescription":  "Visit short",
							"slug":              "postpartum-visit",
							"summary":           "Live appointment summary",
							"tags":              []string{"postpartum"},
						},
						"timeline": []map[string]any{},
					},
				},
			},
		},
	}, "prof-1"); err != nil {
		t.Fatalf("seed portal appointment overlay store: %v", err)
	}

	service := NewService(dataDir, portalStateStore)

	payload, err := service.Appointments(context.Background())
	if err != nil {
		t.Fatalf("load appointments: %v", err)
	}

	if len(payload.Appointments) != 2 {
		t.Fatalf("expected 2 appointments after overlay, got %d", len(payload.Appointments))
	}

	if payload.Appointments[0].Status != AppointmentStatusConfirmed {
		t.Fatalf("expected seed appointment to be replaced by portal record, got %#v", payload.Appointments[0])
	}

	if payload.Appointments[1].ID != "apt-live" || payload.Appointments[1].TotalPriceLabel != "Rp 260.000" {
		t.Fatalf("expected live appointment from portal overlay, got %#v", payload.Appointments[1])
	}
}

func TestProfessionalBySlugReturnsProfessional(t *testing.T) {
	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	service := NewService(dataDir, portalstore.NewMemoryStore())

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

	service := NewService(dataDir, portalstore.NewMemoryStore())

	_, err := service.ProfessionalBySlug(context.Background(), "../etc/passwd")
	if !errors.Is(err, ErrInvalidSlug) {
		t.Fatalf("expected ErrInvalidSlug, got %v", err)
	}
}

func TestProfessionalBySlugAppliesPublishedPortalOverlay(t *testing.T) {
	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	portalStateStore := portalstore.NewMemoryStore()
	if _, err := portalStateStore.Upsert(context.Background(), portalstore.Record{
		ProfessionalID: "prof-1",
		SavedAt:        "2026-03-22T10:00:00Z",
		Snapshot: map[string]any{
			"reviewStatesByProfessionalId": map[string]any{
				"prof-1": map[string]any{
					"status": "published",
				},
			},
			"state": map[string]any{
				"acceptingNewClients": false,
				"activityStories": []map[string]any{
					{
						"capturedAt": "22 Mar 2026",
						"image":      "story.jpg",
						"index":      1,
						"location":   "Bandung",
						"note":       "Pendampingan keluarga",
						"title":      "Kunjungan keluarga",
					},
				},
				"coverageAreaIds": []string{"area-bandung"},
				"coverageCenter": map[string]any{
					"latitude":  -6.9147,
					"longitude": 107.6098,
				},
				"credentials": []map[string]any{
					{
						"index":  1,
						"issuer": "Kemenkes",
						"note":   "Terdaftar aktif",
						"title":  "STR Bidan",
						"year":   "2026",
					},
				},
				"displayName": "Bidan Sari Utama",
				"galleryItems": []map[string]any{
					{
						"alt":        "Galeri profesional",
						"id":         "gallery-1",
						"image":      "gallery.jpg",
						"index":      1,
						"isFeatured": true,
						"label":      "Home visit",
					},
				},
				"homeVisitRadiusKm": 18,
				"portfolioEntries": []map[string]any{
					{
						"id":          "portfolio-1",
						"image":       "portfolio.jpg",
						"index":       1,
						"outcomes":    []string{"ASI eksklusif stabil"},
						"periodLabel": "Maret 2026",
						"serviceId":   "svc-1",
						"summary":     "Pendampingan laktasi intensif.",
						"title":       "Kasus laktasi rumah",
						"visibility":  "public",
					},
				},
				"practiceAddress":  "Jl. Melati 10",
				"practiceLabel":    "Klinik Melati",
				"publicBio":        "Profil publik terbaru dari portal profesional.",
				"responseTimeGoal": "< 20 menit",
				"serviceConfigurations": []map[string]any{
					{
						"bookingFlow": "request",
						"defaultMode": "home_visit",
						"duration":    "60 min",
						"featured":    true,
						"id":          "svc-config-1",
						"index":       1,
						"isActive":    true,
						"price":       "Rp 250.000",
						"serviceId":   "svc-1",
						"serviceModes": map[string]any{
							"online":    false,
							"homeVisit": true,
							"onsite":    false,
						},
						"summary": "Kunjungan rumah pasca persalinan",
					},
				},
				"yearsExperience": "10 years",
			},
		},
	}, "prof-1"); err != nil {
		t.Fatalf("seed portal overlay store: %v", err)
	}

	service := NewService(dataDir, portalStateStore)

	payload, err := service.ProfessionalBySlug(context.Background(), "bidan-sari")
	if err != nil {
		t.Fatalf("lookup professional by slug with overlay: %v", err)
	}

	if payload.Name != "Bidan Sari Utama" {
		t.Fatalf("expected portal display name overlay, got %s", payload.Name)
	}

	if payload.Location != "Klinik Melati" {
		t.Fatalf("expected portal location overlay, got %s", payload.Location)
	}

	if payload.About != "Profil publik terbaru dari portal profesional." {
		t.Fatalf("expected portal bio overlay, got %s", payload.About)
	}

	if payload.Availability.IsAvailable {
		t.Fatal("expected acceptingNewClients overlay to update availability")
	}

	if len(payload.Services) != 1 || payload.Services[0].ID != "svc-config-1" {
		t.Fatalf("expected active service overlay, got %#v", payload.Services)
	}

	if len(payload.PortfolioEntries) != 1 || payload.PortfolioEntries[0].ID != "portfolio-1" {
		t.Fatalf("expected public portfolio overlay, got %#v", payload.PortfolioEntries)
	}

	if len(payload.Gallery) != 1 || payload.Gallery[0].ID != "gallery-1" {
		t.Fatalf("expected gallery overlay, got %#v", payload.Gallery)
	}

	if len(payload.Credentials) != 1 || payload.Credentials[0].Title != "STR Bidan" {
		t.Fatalf("expected credential overlay, got %#v", payload.Credentials)
	}

	if len(payload.ActivityStories) != 1 || payload.ActivityStories[0].Title != "Kunjungan keluarga" {
		t.Fatalf("expected story overlay, got %#v", payload.ActivityStories)
	}
}

func TestProfessionalBySlugReturnsPublishedPortalOnlyProfessional(t *testing.T) {
	dataDir := t.TempDir()
	writeCatalogFixture(t, dataDir)

	portalStateStore := portalstore.NewMemoryStore()
	if _, err := portalStateStore.Upsert(context.Background(), portalstore.Record{
		ProfessionalID: "pro_live_publish",
		SavedAt:        "2026-03-22T10:00:00Z",
		Snapshot: map[string]any{
			"reviewStatesByProfessionalId": map[string]any{
				"pro_live_publish": map[string]any{
					"status": "published",
				},
			},
			"state": map[string]any{
				"acceptingNewClients": true,
				"city":                "Bandung",
				"displayName":         "Bidan Rani Live",
				"practiceAddress":     "Jl. Mawar 12",
				"practiceLabel":       "Bandung Timur",
				"publicBio":           "Pendampingan homecare untuk ibu dan bayi.",
				"responseTimeGoal":    "< 15 menit",
				"serviceConfigurations": []map[string]any{
					{
						"bookingFlow": "request",
						"defaultMode": "home_visit",
						"duration":    "75 min",
						"featured":    true,
						"id":          "pro-live-service-1",
						"index":       1,
						"isActive":    true,
						"price":       "Rp 300.000",
						"serviceId":   "svc-1",
						"serviceModes": map[string]any{
							"online":    false,
							"homeVisit": true,
							"onsite":    false,
						},
						"summary": "Home visit pasca persalinan.",
					},
				},
				"yearsExperience": "7 years",
			},
		},
	}, "pro_live_publish"); err != nil {
		t.Fatalf("seed portal-only overlay store: %v", err)
	}

	service := NewService(dataDir, portalStateStore)

	payload, err := service.ProfessionalBySlug(context.Background(), "bidan-rani-live")
	if err != nil {
		t.Fatalf("lookup portal-only professional by slug: %v", err)
	}

	if payload.ID != "pro_live_publish" {
		t.Fatalf("expected portal-only professional id, got %s", payload.ID)
	}

	if payload.Name != "Bidan Rani Live" {
		t.Fatalf("expected portal-only display name, got %s", payload.Name)
	}

	if payload.Location != "Bandung Timur" {
		t.Fatalf("expected portal-only location, got %s", payload.Location)
	}

	if len(payload.Services) != 1 || payload.Services[0].ID != "pro-live-service-1" {
		t.Fatalf("expected portal-only active service, got %#v", payload.Services)
	}
}
