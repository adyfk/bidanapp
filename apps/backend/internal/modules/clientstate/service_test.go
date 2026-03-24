package clientstate

import (
	"context"
	"errors"
	"testing"

	"bidanapp/apps/backend/internal/platform/documentstore"
)

func TestUpsertAdminConsoleTableKeepsAggregateSnapshotInSync(t *testing.T) {
	t.Parallel()

	service := NewService(documentstore.NewMemoryStore())
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

	service := NewService(documentstore.NewMemoryStore())
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
}

func TestAdminConsoleTableRejectsUnknownTableName(t *testing.T) {
	t.Parallel()

	service := NewService(documentstore.NewMemoryStore())
	_, err := service.AdminConsoleTable(context.Background(), "unknown_table")
	if !errors.Is(err, errInvalidAdminConsoleTable) {
		t.Fatalf("AdminConsoleTable() error = %v, want invalid table error", err)
	}
}
