package http

import (
	"log/slog"
	"net/http"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/http/middleware"
	"bidanapp/apps/backend/internal/modules/health"
	"bidanapp/apps/backend/internal/modules/simulation"
	"bidanapp/apps/backend/internal/platform/web"
)

func NewRouter(cfg config.Config, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()
	healthHandler := health.NewHandler(cfg.App)
	simulationService := simulation.NewService(cfg.Simulation.DataDir)
	simulationHandler := simulation.NewHandler(simulationService)

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		web.WriteJSON(w, http.StatusOK, map[string]any{
			"data": map[string]any{
				"name":           cfg.App.Name,
				"version":        cfg.App.Version,
				"environment":    cfg.App.Environment,
				"frontendOrigin": cfg.CORS.PrimaryOrigin(),
				"docs":           "/api/v1/health",
			},
		})
	})
	mux.Handle("GET /api/v1/health", healthHandler)
	mux.HandleFunc("GET /api/v1/settings", simulationHandler.GetSettings)
	mux.HandleFunc("GET /api/v1/catalog", simulationHandler.GetCatalog)
	mux.HandleFunc("GET /api/v1/professionals", simulationHandler.ListProfessionals)
	mux.HandleFunc("GET /api/v1/professionals/{slug}", simulationHandler.GetProfessional)
	mux.HandleFunc("GET /api/v1/appointments", simulationHandler.GetAppointments)
	mux.HandleFunc("GET /api/v1/chat", simulationHandler.GetChat)

	return middleware.Chain(
		mux,
		middleware.SecurityHeaders(),
		middleware.CORS(cfg.CORS.AllowedOrigins),
		middleware.RequestID(),
		middleware.Recover(logger),
		middleware.LogRequest(logger, time.Now),
	)
}
