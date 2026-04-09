package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAdminAuthModeForRequest(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		target string
		want   adminAuthMode
	}{
		{
			name:   "admin login stays public",
			method: http.MethodPost,
			target: "/api/v1/admin/auth/session",
			want:   adminAuthNone,
		},
		{
			name:   "admin orders require admin session",
			method: http.MethodGet,
			target: "/api/v1/admin/orders",
			want:   adminAuthRequired,
		},
		{
			name:   "professional document download allows optional admin auth",
			method: http.MethodGet,
			target: "/api/v1/professional-documents/pdoc_demo",
			want:   adminAuthOptional,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			req := httptest.NewRequest(tt.method, tt.target, nil)
			got := adminAuthModeForRequest(req)
			if got != tt.want {
				t.Fatalf("adminAuthModeForRequest(%s %s) = %v, want %v", tt.method, tt.target, got, tt.want)
			}
		})
	}
}
