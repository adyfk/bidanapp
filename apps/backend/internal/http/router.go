package http

import (
	"log/slog"
	"net/http"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/http/middleware"
	"bidanapp/apps/backend/internal/modules/chat"
	openapibuilder "bidanapp/apps/backend/internal/platform/openapi"
	"bidanapp/apps/backend/internal/platform/web"
)

func NewRouter(cfg config.Config, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	chatHub := chat.NewHub()
	chatHandler := chat.NewHandler(chatHub, logger, cfg.CORS.AllowedOrigins)

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		web.WriteJSON(w, http.StatusOK, map[string]any{
			"data": map[string]any{
				"name":           cfg.App.Name,
				"version":        cfg.App.Version,
				"environment":    cfg.App.Environment,
				"frontendOrigin": cfg.CORS.PrimaryOrigin(),
				"docs":           "/api/v1/docs",
				"openapi":        "/api/v1/openapi.json",
			},
		})
	})
	mux.Handle("GET /api/v1/ws/chat", chatHandler)

	openapibuilder.Build(mux, cfg)

	return middleware.Chain(
		mux,
		middleware.SecurityHeaders(),
		middleware.CORS(cfg.CORS.AllowedOrigins),
		middleware.RequestID(),
		middleware.Recover(logger),
		middleware.LogRequest(logger, time.Now),
	)
}
