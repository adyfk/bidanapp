package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestViewerAuthModeForRequest(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		target string
		want   viewerAuthMode
	}{
		{
			name:   "viewer session get remains optional",
			method: http.MethodGet,
			target: "/api/v1/auth/session",
			want:   viewerAuthOptional,
		},
		{
			name:   "platform notifications require viewer session",
			method: http.MethodGet,
			target: "/api/v1/platforms/bidan/notifications",
			want:   viewerAuthRequired,
		},
		{
			name:   "support tickets require viewer session",
			method: http.MethodPost,
			target: "/api/v1/support/tickets",
			want:   viewerAuthRequired,
		},
		{
			name:   "chat threads require viewer session",
			method: http.MethodGet,
			target: "/api/v1/chat/threads",
			want:   viewerAuthRequired,
		},
		{
			name:   "professional document download keeps viewer auth optional",
			method: http.MethodGet,
			target: "/api/v1/professional-documents/pdoc_demo",
			want:   viewerAuthOptional,
		},
		{
			name:   "directory listing stays public",
			method: http.MethodGet,
			target: "/api/v1/platforms/bidan/directory/professionals",
			want:   viewerAuthNone,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			req := httptest.NewRequest(tt.method, tt.target, nil)
			got := viewerAuthModeForRequest(req)
			if got != tt.want {
				t.Fatalf("viewerAuthModeForRequest(%s %s) = %v, want %v", tt.method, tt.target, got, tt.want)
			}
		})
	}
}
