package adminauth

import (
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/authstore"
)

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

func TestLoginCreatesSessionWithNonEmptyID(t *testing.T) {
	t.Parallel()

	passwordHash, err := bcrypt.GenerateFromPassword([]byte("AdminDemo#2026"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}

	store := authstore.NewMemoryStore()
	service := NewService(config.AdminAuthConfig{
		Credentials: []config.AdminCredentialConfig{
			{
				AdminID:      "adm_demo",
				Email:        "ops@bidanapp.id",
				PasswordHash: string(passwordHash),
				FocusArea:    "ops",
			},
		},
		SessionTTL: 24 * time.Hour,
	}, store)

	if err := service.Bootstrap(t.Context()); err != nil {
		t.Fatalf("Bootstrap() error = %v", err)
	}

	if _, err := service.Login(t.Context(), AdminAuthCreateSessionRequest{
		Email:    "ops@bidanapp.id",
		Password: "AdminDemo#2026",
	}); err != nil {
		t.Fatalf("Login() error = %v", err)
	}

	sessions, err := store.SessionsBySubject(t.Context(), sessionRole, "adm_demo")
	if err != nil {
		t.Fatalf("SessionsBySubject() error = %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
	if sessions[0].ID == "" {
		t.Fatal("expected persisted admin session to have a non-empty id")
	}
}

func TestSeedSessionCreatesSessionWithNonEmptyID(t *testing.T) {
	t.Parallel()

	passwordHash, err := bcrypt.GenerateFromPassword([]byte("AdminDemo#2026"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("GenerateFromPassword() error = %v", err)
	}

	store := authstore.NewMemoryStore()
	service := NewService(config.AdminAuthConfig{
		Credentials: []config.AdminCredentialConfig{
			{
				AdminID:      "adm_demo",
				Email:        "ops@bidanapp.id",
				PasswordHash: string(passwordHash),
				FocusArea:    "ops",
			},
		},
		SessionTTL: 24 * time.Hour,
	}, store)

	if err := service.Bootstrap(t.Context()); err != nil {
		t.Fatalf("Bootstrap() error = %v", err)
	}

	if _, err := service.SeedSession(t.Context(), SeedSessionInput{
		AdminID:   "adm_demo",
		Email:     "ops@bidanapp.id",
		FocusArea: "ops",
		RawToken:  "badm_seed_session",
	}); err != nil {
		t.Fatalf("SeedSession() error = %v", err)
	}

	sessions, err := store.SessionsBySubject(t.Context(), sessionRole, "adm_demo")
	if err != nil {
		t.Fatalf("SessionsBySubject() error = %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
	if sessions[0].ID == "" {
		t.Fatal("expected seeded admin session to have a non-empty id")
	}
}
