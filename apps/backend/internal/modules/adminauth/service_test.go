package adminauth

import "testing"

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
