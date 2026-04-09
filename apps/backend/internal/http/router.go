package http

import (
	"database/sql"
	"log/slog"
	"net/http"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/http/middleware"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/adminops"
	"bidanapp/apps/backend/internal/modules/adminreview"
	"bidanapp/apps/backend/internal/modules/chat"
	"bidanapp/apps/backend/internal/modules/directory"
	"bidanapp/apps/backend/internal/modules/notifications"
	"bidanapp/apps/backend/internal/modules/offerings"
	"bidanapp/apps/backend/internal/modules/orders"
	"bidanapp/apps/backend/internal/modules/platformregistry"
	"bidanapp/apps/backend/internal/modules/professionalonboarding"
	"bidanapp/apps/backend/internal/modules/professionalworkspace"
	"bidanapp/apps/backend/internal/modules/support"
	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/authstore"
	openapibuilder "bidanapp/apps/backend/internal/platform/openapi"
	"bidanapp/apps/backend/internal/platform/ratelimit"
	"bidanapp/apps/backend/internal/platform/sms"
	"bidanapp/apps/backend/internal/platform/web"
)

type Dependencies struct {
	AuthRateLimiter ratelimit.Limiter
	AuthStore       authstore.Store
	ChatStore       chat.Store
	Database        *sql.DB
}

func NewRouter(cfg config.Config, logger *slog.Logger, deps ...Dependencies) http.Handler {
	mux := http.NewServeMux()
	runtimeDependencies := resolveDependencies(deps)
	if runtimeDependencies.AuthRateLimiter == nil {
		runtimeDependencies.AuthRateLimiter = ratelimit.NewMemoryLimiter(cfg.AuthRateLimit)
	}

	chatHub := chat.NewHub(runtimeDependencies.ChatStore)
	chatHandler := chat.NewHandler(chatHub, logger, cfg.CORS.AllowedOrigins)

	adminAuthService := adminauth.NewService(cfg.AdminAuth, runtimeDependencies.AuthStore)
	adminOpsService := adminops.NewService(runtimeDependencies.Database)
	adminReviewService := adminreview.NewService(runtimeDependencies.Database)
	chatRESTService := chat.NewService(runtimeDependencies.Database)
	directoryService := directory.NewService(runtimeDependencies.Database)
	notificationsService := notifications.NewService(runtimeDependencies.Database)
	viewerAuthService := viewerauth.NewService(cfg.ViewerAuth, runtimeDependencies.Database, runtimeDependencies.AuthStore, sms.NewSender(cfg.ViewerAuth.SMS, logger))
	platformRegistryService := platformregistry.NewService(runtimeDependencies.Database)
	professionalOnboardingService := professionalonboarding.NewService(runtimeDependencies.Database, platformRegistryService, cfg.Assets.RootDir)
	professionalWorkspaceService := professionalworkspace.NewService(runtimeDependencies.Database)
	offeringService := offerings.NewService(runtimeDependencies.Database)
	orderService := orders.NewService(runtimeDependencies.Database)
	supportService := support.NewService(runtimeDependencies.Database)

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		web.WriteJSON(w, http.StatusOK, map[string]any{
			"data": map[string]any{
				"name":        cfg.App.Name,
				"version":     cfg.App.Version,
				"environment": cfg.App.Environment,
				"docs":        "/api/v1/docs",
				"openapi":     "/api/v1/openapi.json",
			},
		})
	})
	mux.Handle("GET /api/v1/ws/chat", chatHandler)
	mux.HandleFunc("PUT /api/v1/uploads/professional-documents/{document_id}", professionalOnboardingService.HandleDocumentUpload)
	mux.HandleFunc("GET /api/v1/professional-documents/{document_id}", professionalOnboardingService.HandleDocumentDownload)

	openapibuilder.BuildRuntime(mux, cfg, openapibuilder.RuntimeServices{
		AdminOps:               adminOpsService,
		AdminAuth:              adminAuthService,
		AdminReview:            adminReviewService,
		Chat:                   chatRESTService,
		Directory:              directoryService,
		Notifications:          notificationsService,
		ViewerAuth:             viewerAuthService,
		PlatformRegistry:       platformRegistryService,
		ProfessionalOnboarding: professionalOnboardingService,
		ProfessionalWorkspace:  professionalWorkspaceService,
		Offerings:              offeringService,
		Orders:                 orderService,
		Support:                supportService,
	})

	return middleware.Chain(
		mux,
		middleware.SecurityHeaders(),
		middleware.CORS(cfg.CORS.AllowedOrigins),
		middleware.RequestID(),
		middleware.RequestMetadata(),
		middleware.Recover(logger),
		middleware.LogRequest(logger, time.Now),
		middleware.AuthRateLimit(runtimeDependencies.AuthRateLimiter),
		middleware.CookieOriginGuard(cfg.CORS.AllowedOrigins, []string{
			cfg.AdminAuth.Cookie.Name,
			cfg.ViewerAuth.Cookie.Name,
		}),
		middleware.AdminAuth(adminAuthService),
		middleware.ViewerAuth(viewerAuthService),
	)
}

func resolveDependencies(deps []Dependencies) Dependencies {
	if len(deps) > 0 {
		resolved := deps[0]
		if resolved.AuthStore == nil {
			resolved.AuthStore = authstore.NewMemoryStore()
		}
		if resolved.ChatStore == nil {
			resolved.ChatStore = chat.NewMemoryStore()
		}
		return resolved
	}

	return Dependencies{
		AuthStore: authstore.NewMemoryStore(),
		ChatStore: chat.NewMemoryStore(),
	}
}
