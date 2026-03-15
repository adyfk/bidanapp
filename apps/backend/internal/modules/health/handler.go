package health

import (
	"net/http"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/web"
)

type Handler struct {
	app config.AppConfig
}

func NewHandler(app config.AppConfig) Handler {
	return Handler{app: app}
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	web.WriteJSON(w, http.StatusOK, map[string]any{
		"data": map[string]any{
			"status":      "ok",
			"service":     h.app.Name,
			"version":     h.app.Version,
			"environment": h.app.Environment,
		},
	})
}
