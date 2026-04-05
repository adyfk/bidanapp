package clientstate

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/portalstore"
	"bidanapp/apps/backend/internal/platform/pushstore"
)

func TestUpsertAdminConsoleTableKeepsAggregateSnapshotInSync(t *testing.T) {
	t.Parallel()

	contentStore := contentstore.NewMemoryStore()
	service := NewService(documentstore.NewMemoryStore(), pushstore.NewMemoryStore(), contentStore)
	payload, err := service.UpsertAdminConsoleTable(context.Background(), "admin_staff", AdminConsoleTableUpsertData{
		SchemaVersion: 1,
		Rows: []map[string]any{
			{
				"id":    "admin-1",
				"name":  "Admin One",
				"email": "admin.one@example.com",
			},
		},
	})
	if err != nil {
		t.Fatalf("UpsertAdminConsoleTable() error = %v", err)
	}

	if payload.TableName != "admin_staff" {
		t.Fatalf("UpsertAdminConsoleTable() tableName = %q", payload.TableName)
	}

	contentRecord, err := contentStore.Read(context.Background(), "published_readmodel", "admin_staff.json")
	if err != nil {
		t.Fatalf("contentStore.Read() error = %v", err)
	}

	var mirroredRows []map[string]any
	if err := json.Unmarshal(contentRecord.Payload, &mirroredRows); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if len(mirroredRows) != 1 {
		t.Fatalf("mirrored admin_staff row length = %d", len(mirroredRows))
	}

	aggregate, err := service.AdminConsole(context.Background())
	if err != nil {
		t.Fatalf("AdminConsole() error = %v", err)
	}

	if aggregate.SchemaVersion != 1 {
		t.Fatalf("AdminConsole() schemaVersion = %d", aggregate.SchemaVersion)
	}
	if len(aggregate.Tables["admin_staff"]) != 1 {
		t.Fatalf("AdminConsole() admin_staff length = %d", len(aggregate.Tables["admin_staff"]))
	}
}

func TestUpsertAdminConsoleBackfillsIndividualTableDocuments(t *testing.T) {
	t.Parallel()

	contentStore := contentstore.NewMemoryStore()
	service := NewService(documentstore.NewMemoryStore(), pushstore.NewMemoryStore(), contentStore)
	_, err := service.UpsertAdminConsole(context.Background(), AdminConsoleData{
		SchemaVersion: 1,
		Tables: map[string][]map[string]any{
			"services": {
				{
					"id":   "svc-1",
					"name": "Layanan Demo",
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("UpsertAdminConsole() error = %v", err)
	}

	tablePayload, err := service.AdminConsoleTable(context.Background(), "services")
	if err != nil {
		t.Fatalf("AdminConsoleTable() error = %v", err)
	}

	if tablePayload.SchemaVersion != 1 {
		t.Fatalf("AdminConsoleTable() schemaVersion = %d", tablePayload.SchemaVersion)
	}
	if len(tablePayload.Rows) != 1 {
		t.Fatalf("AdminConsoleTable() rows length = %d", len(tablePayload.Rows))
	}

	contentRecord, err := contentStore.Read(context.Background(), "published_readmodel", "services.json")
	if err != nil {
		t.Fatalf("contentStore.Read() error = %v", err)
	}

	var mirroredRows []map[string]any
	if err := json.Unmarshal(contentRecord.Payload, &mirroredRows); err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	if len(mirroredRows) != 1 {
		t.Fatalf("mirrored services row length = %d", len(mirroredRows))
	}
}

func TestAdminConsoleTableRejectsUnknownTableName(t *testing.T) {
	t.Parallel()

	service := NewService(documentstore.NewMemoryStore(), pushstore.NewMemoryStore())
	_, err := service.AdminConsoleTable(context.Background(), "unknown_table")
	if !errors.Is(err, errInvalidAdminConsoleTable) {
		t.Fatalf("AdminConsoleTable() error = %v, want invalid table error", err)
	}
}

func TestAdminConsoleTableFallsBackToContentStore(t *testing.T) {
	t.Parallel()

	contentStore := contentstore.NewMemoryStore()
	_, err := contentStore.Upsert(context.Background(), contentstore.Record{
		Namespace: "published_readmodel",
		Key:       "services.json",
		Payload:   []byte(`[{"id":"svc-1","name":"Layanan API"}]`),
	})
	if err != nil {
		t.Fatalf("contentStore.Upsert() error = %v", err)
	}

	service := NewService(documentstore.NewMemoryStore(), pushstore.NewMemoryStore(), contentStore)
	payload, err := service.AdminConsoleTable(context.Background(), "services")
	if err != nil {
		t.Fatalf("AdminConsoleTable() error = %v", err)
	}

	if len(payload.Rows) != 1 {
		t.Fatalf("AdminConsoleTable() rows length = %d", len(payload.Rows))
	}
	if payload.Rows[0]["name"] != "Layanan API" {
		t.Fatalf("AdminConsoleTable() unexpected row payload = %#v", payload.Rows[0])
	}
}

func TestAdminConsoleTableMirrorsIntoReadModelContent(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	contentStore := contentstore.NewMemoryStore()
	service := NewService(documentstore.NewMemoryStore(), pushstore.NewMemoryStore(), contentStore)

	seedJSONFixture(t, contentStore, "areas.json", []map[string]any{
		{
			"city":      "Bandung",
			"district":  "Coblong",
			"id":        "area-1",
			"index":     1,
			"label":     "Bandung",
			"latitude":  -6.9,
			"longitude": 107.6,
			"province":  "Jawa Barat",
		},
	})
	seedJSONFixture(t, contentStore, "service_categories.json", []map[string]any{
		{
			"accentColor":    "#F59E0B",
			"coverImage":     "",
			"description":    "Kategori contoh",
			"iconImage":      "https://example.com/category-icon.png",
			"id":             "cat-1",
			"image":          "https://example.com/category.png",
			"index":          1,
			"name":           "Konsultasi",
			"overviewPoints": []string{"Konsultasi awal"},
			"shortLabel":     "Konsultasi",
		},
	})
	seedJSONFixture(t, contentStore, "professionals.json", []map[string]any{
		{
			"about":             "Bidan senior",
			"availabilityLabel": "Tersedia",
			"badgeLabel":        "Senior",
			"clientsServed":     "120",
			"coverImage":        "https://example.com/prof-cover.png",
			"experience":        "8 tahun",
			"gender":            "female",
			"id":                "prof-1",
			"image":             "https://example.com/prof.png",
			"index":             1,
			"isAvailable":       true,
			"location":          "Bandung",
			"name":              "Bidan Sari",
			"rating":            4.9,
			"responseTime":      "5 menit",
			"reviews":           "120",
			"slug":              "bidan-sari",
			"title":             "Senior Midwife",
		},
	})
	seedJSONFixture(t, contentStore, "services.json", []map[string]any{
		{
			"categoryId":       "cat-1",
			"coverImage":       "https://example.com/service-cover.png",
			"defaultMode":      "online",
			"description":      "Deskripsi awal",
			"highlights":       []string{"Awal"},
			"id":               "svc-1",
			"image":            "https://example.com/service.png",
			"index":            1,
			"name":             "Layanan Lama",
			"serviceModes":     map[string]any{"homeVisit": false, "online": true, "onsite": false},
			"shortDescription": "Ringkas awal",
			"slug":             "layanan-lama",
			"tags":             []string{"awal"},
		},
	})

	if _, err := service.UpsertAdminConsoleTable(ctx, "services", AdminConsoleTableUpsertData{
		SchemaVersion: 1,
		Rows: []map[string]any{
			{
				"categoryId":       "cat-1",
				"coverImage":       "https://example.com/service-cover.png",
				"defaultMode":      "online",
				"description":      "Deskripsi baru",
				"highlights":       []string{"Sinkron"},
				"id":               "svc-1",
				"image":            "https://example.com/service.png",
				"index":            1,
				"name":             "Layanan Baru",
				"serviceModes":     map[string]any{"homeVisit": false, "online": true, "onsite": false},
				"shortDescription": "Ringkas baru",
				"slug":             "layanan-baru",
				"tags":             []string{"baru"},
			},
		},
	}); err != nil {
		t.Fatalf("UpsertAdminConsoleTable() error = %v", err)
	}

	readModelService := readmodel.NewServiceWithRepository(
		readmodel.NewRepository("", contentStore),
		portalstore.NewMemoryStore(),
	)
	catalog, err := readModelService.Catalog(ctx)
	if err != nil {
		t.Fatalf("Catalog() error = %v", err)
	}

	if len(catalog.Services) != 1 {
		t.Fatalf("Catalog() services length = %d", len(catalog.Services))
	}
	if catalog.Services[0].Name != "Layanan Baru" || catalog.Services[0].Slug != "layanan-baru" {
		t.Fatalf("Catalog() did not reflect admin console update: %#v", catalog.Services[0])
	}
}

func TestUpsertSupportDeskRejectsInvalidTicketPayload(t *testing.T) {
	t.Parallel()

	service := NewService(documentstore.NewMemoryStore(), pushstore.NewMemoryStore())
	_, err := service.UpsertSupportDesk(context.Background(), SupportDeskData{
		SchemaVersion: 1,
		Tickets: []SupportTicketData{
			{
				ID:               "SUP-1",
				CategoryID:       "refundRequest",
				ContactValue:     "+62 812 0000 0000",
				CreatedAt:        "2026-04-04T09:00:00Z",
				Details:          "Butuh refund",
				EtaKey:           "normal",
				PreferredChannel: "pager",
				ReporterName:     "Alya",
				ReporterPhone:    "+62 812 0000 0000",
				ReporterRole:     "customer",
				SourceSurface:    "profile_customer",
				Status:           "new",
				Summary:          "Refund request",
				UpdatedAt:        "2026-04-04T09:10:00Z",
				Urgency:          "normal",
			},
		},
	})
	if !errors.Is(err, errInvalidSupportDesk) {
		t.Fatalf("UpsertSupportDesk() error = %v, want invalid support desk", err)
	}
}

func TestSupportTicketsPersistPerReporterAndRemainVisibleToAdminDesk(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	store := documentstore.NewMemoryStore()
	service := NewService(store, pushstore.NewMemoryStore())

	customerTicket, err := service.CreateSupportTicket(ctx, "customer", "consumer-1", CreateSupportTicketData{
		CategoryID:       "refundRequest",
		ContactValue:     "+62 812 0000 0000",
		Details:          "Mohon tindak lanjut refund untuk appointment terakhir.",
		PreferredChannel: "whatsapp",
		ReporterName:     "Alya",
		ReporterPhone:    "+62 812 0000 0000",
		SourceSurface:    "profile_customer",
		Summary:          "Refund appointment",
		Urgency:          "high",
	})
	if err != nil {
		t.Fatalf("CreateSupportTicket(customer-1) error = %v", err)
	}

	if _, err := service.CreateSupportTicket(ctx, "customer", "consumer-2", CreateSupportTicketData{
		CategoryID:       "paymentIssue",
		ContactValue:     "consumer-2@example.com",
		Details:          "Pembayaran berhasil tapi status belum berubah.",
		PreferredChannel: "email",
		ReporterName:     "Dina",
		ReporterPhone:    "+62 813 0000 0000",
		SourceSurface:    "profile_customer",
		Summary:          "Payment sync issue",
		Urgency:          "normal",
	}); err != nil {
		t.Fatalf("CreateSupportTicket(customer-2) error = %v", err)
	}

	professionalTicket, err := service.CreateSupportTicket(ctx, "professional", "prof-1", CreateSupportTicketData{
		CategoryID:       "technicalIssue",
		ContactValue:     "prof-1@example.com",
		Details:          "Dashboard tidak menampilkan update appointment terbaru.",
		PreferredChannel: "email",
		ReporterName:     "Bidan Rani",
		ReporterPhone:    "+62 814 0000 0000",
		SourceSurface:    "profile_professional",
		Summary:          "Dashboard sync issue",
		Urgency:          "urgent",
	})
	if err != nil {
		t.Fatalf("CreateSupportTicket(prof-1) error = %v", err)
	}

	reloadedService := NewService(store, pushstore.NewMemoryStore())

	customerScoped, err := reloadedService.SupportTicketsByReporter(ctx, "customer", "consumer-1")
	if err != nil {
		t.Fatalf("SupportTicketsByReporter(customer-1) error = %v", err)
	}
	if len(customerScoped.Tickets) != 1 {
		t.Fatalf("SupportTicketsByReporter(customer-1) length = %d, want 1", len(customerScoped.Tickets))
	}
	if customerScoped.Tickets[0].ID != customerTicket.ID || customerScoped.Tickets[0].ReporterID != "consumer-1" {
		t.Fatalf("unexpected customer-scoped ticket payload = %#v", customerScoped.Tickets[0])
	}

	professionalScoped, err := reloadedService.SupportTicketsByReporter(ctx, "professional", "prof-1")
	if err != nil {
		t.Fatalf("SupportTicketsByReporter(prof-1) error = %v", err)
	}
	if len(professionalScoped.Tickets) != 1 {
		t.Fatalf("SupportTicketsByReporter(prof-1) length = %d, want 1", len(professionalScoped.Tickets))
	}
	if professionalScoped.Tickets[0].ID != professionalTicket.ID || professionalScoped.Tickets[0].ReporterID != "prof-1" {
		t.Fatalf("unexpected professional-scoped ticket payload = %#v", professionalScoped.Tickets[0])
	}

	adminDesk, err := reloadedService.SupportDesk(ctx)
	if err != nil {
		t.Fatalf("SupportDesk() error = %v", err)
	}
	if len(adminDesk.Tickets) != 3 {
		t.Fatalf("SupportDesk() tickets length = %d, want 3", len(adminDesk.Tickets))
	}
}

func seedJSONFixture(t *testing.T, store contentstore.Store, fileName string, payload any) {
	t.Helper()

	rawPayload, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	if _, err := store.Upsert(context.Background(), contentstore.Record{
		Namespace: "published_readmodel",
		Key:       fileName,
		Payload:   rawPayload,
	}); err != nil {
		t.Fatalf("contentStore.Upsert() error = %v", err)
	}
}
