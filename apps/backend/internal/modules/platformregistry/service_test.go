package platformregistry

import "testing"

func TestResolvePlatformByHostFallsBackToSubdomain(t *testing.T) {
	service := NewService(nil)

	platform, err := service.ResolvePlatform(t.Context(), "bidan.preview.local")
	if err != nil {
		t.Fatalf("ResolvePlatform returned error: %v", err)
	}

	if platform.ID != "bidan" {
		t.Fatalf("expected bidan platform, got %s", platform.ID)
	}
}
