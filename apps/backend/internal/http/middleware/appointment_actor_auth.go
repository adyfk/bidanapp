package middleware

import (
	"net/http"
	"strings"

	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/platform/web"
)

func AppointmentActorAuth(
	customerService *customerauth.Service,
	professionalService *professionalauth.Service,
) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !requiresAppointmentActorAuth(r) {
				next.ServeHTTP(w, r)
				return
			}

			authorizationHeader := r.Header.Get("Authorization")

			if customerService != nil {
				customerSession, err := customerService.AuthenticateRequest(
					r.Context(),
					authorizationHeader,
					readCookieValue(r, customerService.CookieName()),
				)
				if err == nil {
					next.ServeHTTP(w, r.WithContext(customerauth.WithSession(r.Context(), customerSession)))
					return
				}
			}

			if professionalService != nil {
				professionalSession, err := professionalService.AuthenticateRequest(
					r.Context(),
					authorizationHeader,
					readCookieValue(r, professionalService.CookieName()),
				)
				if err == nil {
					next.ServeHTTP(w, r.WithContext(professionalauth.WithSession(r.Context(), professionalSession)))
					return
				}
			}

			web.WriteError(w, http.StatusUnauthorized, "appointment_actor_not_found", "appointment actor not found")
		})
	}
}

func requiresAppointmentActorAuth(r *http.Request) bool {
	return r.Method == http.MethodPost &&
		strings.HasPrefix(r.URL.Path, "/api/v1/appointments/") &&
		strings.HasSuffix(r.URL.Path, "/change-requests")
}
