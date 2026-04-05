package http

import (
	"log/slog"
	"net/http"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/http/middleware"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/appointments"
	"bidanapp/apps/backend/internal/modules/chat"
	"bidanapp/apps/backend/internal/modules/clientstate"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/modules/professionalportal"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/appointmentstore"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/documentstore"
	openapibuilder "bidanapp/apps/backend/internal/platform/openapi"
	"bidanapp/apps/backend/internal/platform/portalstore"
	"bidanapp/apps/backend/internal/platform/pushstore"
	"bidanapp/apps/backend/internal/platform/ratelimit"
	"bidanapp/apps/backend/internal/platform/web"
	internalwebpush "bidanapp/apps/backend/internal/platform/webpush"
)

type Dependencies struct {
	AuthRateLimiter  ratelimit.Limiter
	AppointmentStore appointmentstore.Store
	AuthStore        authstore.Store
	ChatStore        chat.Store
	PortalStore      portalstore.Store
	ContentStore     contentstore.Store
	DocumentStore    documentstore.Store
	PushStore        pushstore.Store
}

func NewRouter(cfg config.Config, logger *slog.Logger, deps ...Dependencies) http.Handler {
	mux := http.NewServeMux()
	runtimeDependencies := resolveDependencies(deps)
	if runtimeDependencies.AuthRateLimiter == nil {
		runtimeDependencies.AuthRateLimiter = ratelimit.NewMemoryLimiter(cfg.AuthRateLimit)
	}
	chatHub := chat.NewHub(runtimeDependencies.ChatStore)
	chatHandler := chat.NewHandler(chatHub, logger, cfg.CORS.AllowedOrigins)
	readModelService := readmodel.NewServiceWithStore(
		cfg.SeedData.DataDir,
		runtimeDependencies.ContentStore,
		runtimeDependencies.PortalStore,
		runtimeDependencies.AppointmentStore,
	)
	adminAuthService := adminauth.NewService(cfg.AdminAuth, runtimeDependencies.AuthStore)
	customerAuthService := customerauth.NewService(cfg.CustomerAuth, runtimeDependencies.AuthStore)
	professionalAuthService := professionalauth.NewService(
		cfg.ProfessionalAuth,
		readModelService,
		runtimeDependencies.AuthStore,
	)
	professionalPortalService := professionalportal.NewService(runtimeDependencies.PortalStore)
	pushSender := internalwebpush.NewVAPIDSender(cfg.WebPush)
	clientStateService := clientstate.NewService(
		runtimeDependencies.DocumentStore,
		runtimeDependencies.PushStore,
		runtimeDependencies.ContentStore,
	)

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

	openapibuilder.BuildRuntime(mux, cfg, openapibuilder.RuntimeServices{
		AdminAuth:        adminAuthService,
		CustomerAuth:     customerAuthService,
		ProfessionalAuth: professionalAuthService,
		AppointmentWrites: appointments.NewService(
			professionalPortalService,
			readModelService,
			readModelService,
			runtimeDependencies.AppointmentStore,
			runtimeDependencies.PushStore,
			pushSender,
			appointments.WithPaymentConfig(cfg.Payment),
			appointments.WithFrontendOrigin(cfg.CORS.PrimaryOrigin()),
		),
		ProfessionalPortal: professionalPortalService,
		ReadModel:          readModelService,
		ClientState:        clientStateService,
	})

	return middleware.Chain(
		mux,
		middleware.SecurityHeaders(),
		middleware.CORS(cfg.CORS.AllowedOrigins),
		middleware.RequestID(),
		middleware.Recover(logger),
		middleware.LogRequest(logger, time.Now),
		middleware.AuthRateLimit(runtimeDependencies.AuthRateLimiter),
		middleware.CookieOriginGuard(cfg.CORS.AllowedOrigins, []string{
			cfg.AdminAuth.Cookie.Name,
			cfg.CustomerAuth.Cookie.Name,
			cfg.ProfessionalAuth.Cookie.Name,
		}),
		middleware.AdminAuth(adminAuthService),
		middleware.CustomerAuth(customerAuthService),
		middleware.ProfessionalAuth(professionalAuthService),
	)
}

func resolveDependencies(deps []Dependencies) Dependencies {
	if len(deps) > 0 {
		resolved := deps[0]
		if resolved.ChatStore == nil {
			resolved.ChatStore = chat.NewMemoryStore()
		}
		if resolved.AppointmentStore == nil {
			resolved.AppointmentStore = appointmentstore.NewMemoryStore()
		}
		if resolved.AuthStore == nil {
			resolved.AuthStore = authstore.NewMemoryStore()
		}
		if resolved.PortalStore == nil {
			resolved.PortalStore = portalstore.NewMemoryStore()
		}
		if resolved.ContentStore == nil {
			resolved.ContentStore = contentstore.NewMemoryStore()
		}
		if resolved.DocumentStore == nil {
			resolved.DocumentStore = documentstore.NewMemoryStore()
		}
		if resolved.PushStore == nil {
			resolved.PushStore = pushstore.NewMemoryStore()
		}
		return resolved
	}

	return Dependencies{
		AppointmentStore: appointmentstore.NewMemoryStore(),
		AuthStore:        authstore.NewMemoryStore(),
		ChatStore:        chat.NewMemoryStore(),
		PortalStore:      portalstore.NewMemoryStore(),
		ContentStore:     contentstore.NewMemoryStore(),
		DocumentStore:    documentstore.NewMemoryStore(),
		PushStore:        pushstore.NewMemoryStore(),
	}
}
