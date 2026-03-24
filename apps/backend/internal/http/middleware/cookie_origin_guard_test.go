package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCookieOriginGuardRejectsUnsafeCookieRequestWithoutTrustedOrigin(t *testing.T) {
	t.Parallel()

	handler := CookieOriginGuard([]string{"https://app.bidanapp.id"}, []string{"bidanapp_admin_session"})(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	)

	request := httptest.NewRequest(http.MethodPut, "/api/v1/admin/console", nil)
	request.AddCookie(&http.Cookie{Name: "bidanapp_admin_session", Value: "seed-token"})
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusForbidden)
	}
}

func TestCookieOriginGuardAllowsUnsafeCookieRequestFromTrustedOrigin(t *testing.T) {
	t.Parallel()

	handler := CookieOriginGuard([]string{"https://app.bidanapp.id"}, []string{"bidanapp_admin_session"})(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	)

	request := httptest.NewRequest(http.MethodPut, "/api/v1/admin/console", nil)
	request.Header.Set("Origin", "https://app.bidanapp.id")
	request.AddCookie(&http.Cookie{Name: "bidanapp_admin_session", Value: "seed-token"})
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusNoContent)
	}
}

func TestCookieOriginGuardSkipsBearerAuthorizedRequests(t *testing.T) {
	t.Parallel()

	handler := CookieOriginGuard([]string{"https://app.bidanapp.id"}, []string{"bidanapp_admin_session"})(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusAccepted)
		}),
	)

	request := httptest.NewRequest(http.MethodPut, "/api/v1/admin/console", nil)
	request.Header.Set("Authorization", "Bearer explicit-token")
	request.AddCookie(&http.Cookie{Name: "bidanapp_admin_session", Value: "cookie-token"})
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusAccepted {
		t.Fatalf("unexpected status: got %d want %d", recorder.Code, http.StatusAccepted)
	}
}
