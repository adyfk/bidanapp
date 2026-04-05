package professionalauth

import (
	"context"
	"testing"
	"time"

	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/authstore"
)

type stubCatalogReader struct {
	catalog readmodel.CatalogData
}

func (s stubCatalogReader) Catalog(context.Context) (readmodel.CatalogData, error) {
	return s.catalog, nil
}

func TestResolveRawSessionTokenPrefersAuthorizationHeader(t *testing.T) {
	t.Parallel()

	token, err := resolveRawSessionToken("cookie-token", "Bearer bearer-token")
	if err != nil {
		t.Fatalf("resolveRawSessionToken() error = %v", err)
	}

	if token != "bearer-token" {
		t.Fatalf("unexpected token: got %q want %q", token, "bearer-token")
	}
}

func TestRegisterAllowsSelfSignupWithoutProvisionedProfessionalID(t *testing.T) {
	t.Parallel()

	service := &Service{
		catalogReader: stubCatalogReader{},
		sessionTTL:    24 * time.Hour,
		store:         authstore.NewMemoryStore(),
	}

	issuedSession, err := service.Register(context.Background(), ProfessionalAuthRegisterRequest{
		City:             "Jakarta Selatan",
		CredentialNumber: "STR-SELF-001",
		DisplayName:      "Self Signup Midwife",
		Password:         "Professional2026A",
		Phone:            "+6281388880001",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}

	if issuedSession.Session.ProfessionalID == "" {
		t.Fatal("expected generated professional id")
	}
	if issuedSession.Session.ProfessionalID[:4] != "pro_" {
		t.Fatalf("expected generated professional id prefix pro_, got %q", issuedSession.Session.ProfessionalID)
	}
	if issuedSession.Session.DisplayName != "Self Signup Midwife" {
		t.Fatalf("expected display name to round-trip, got %q", issuedSession.Session.DisplayName)
	}
	if issuedSession.RawToken == "" {
		t.Fatal("expected raw session token")
	}
}

func TestRegisterStillValidatesProvisionedProfessionalIDWhenProvided(t *testing.T) {
	t.Parallel()

	service := &Service{
		catalogReader: stubCatalogReader{},
		sessionTTL:    24 * time.Hour,
		store:         authstore.NewMemoryStore(),
	}

	_, err := service.Register(context.Background(), ProfessionalAuthRegisterRequest{
		City:             "Jakarta Selatan",
		CredentialNumber: "STR-SELF-002",
		DisplayName:      "Provisioned Claim",
		Password:         "Professional2026A",
		Phone:            "+6281388880002",
		ProfessionalID:   "missing-professional",
	})
	if err != ErrProfessionalNotFound {
		t.Fatalf("expected ErrProfessionalNotFound, got %v", err)
	}
}
