package openapi

import (
	"net/http"
	"sync"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/adminops"
	"bidanapp/apps/backend/internal/modules/adminreview"
	"bidanapp/apps/backend/internal/modules/chat"
	"bidanapp/apps/backend/internal/modules/directory"
	"bidanapp/apps/backend/internal/modules/health"
	"bidanapp/apps/backend/internal/modules/notifications"
	"bidanapp/apps/backend/internal/modules/offerings"
	"bidanapp/apps/backend/internal/modules/orders"
	"bidanapp/apps/backend/internal/modules/platformregistry"
	"bidanapp/apps/backend/internal/modules/professionalonboarding"
	"bidanapp/apps/backend/internal/modules/professionalworkspace"
	"bidanapp/apps/backend/internal/modules/support"
	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/sms"
	"bidanapp/apps/backend/internal/platform/web"
)

var configureErrorsOnce sync.Once

type RuntimeServices struct {
	AdminOps               *adminops.Service
	AdminAuth              *adminauth.Service
	AdminReview            *adminreview.Service
	Chat                   *chat.Service
	Directory              *directory.Service
	Notifications          *notifications.Service
	ViewerAuth             *viewerauth.Service
	PlatformRegistry       *platformregistry.Service
	ProfessionalOnboarding *professionalonboarding.Service
	ProfessionalWorkspace  *professionalworkspace.Service
	Offerings              *offerings.Service
	Orders                 *orders.Service
	Support                *support.Service
}

func Build(mux *http.ServeMux, cfg config.Config) huma.API {
	platforms := platformregistry.NewService(nil)
	return build(mux, cfg, RuntimeServices{
		AdminOps:               adminops.NewService(nil),
		AdminAuth:              adminauth.NewService(cfg.AdminAuth, authstore.NewMemoryStore()),
		AdminReview:            adminreview.NewService(nil),
		Chat:                   chat.NewService(nil),
		Directory:              directory.NewService(nil),
		Notifications:          notifications.NewService(nil),
		ViewerAuth:             viewerauth.NewService(cfg.ViewerAuth, nil, authstore.NewMemoryStore(), sms.NewSender(cfg.ViewerAuth.SMS, nil)),
		PlatformRegistry:       platforms,
		ProfessionalOnboarding: professionalonboarding.NewService(nil, platforms, ""),
		ProfessionalWorkspace:  professionalworkspace.NewService(nil),
		Offerings:              offerings.NewService(nil),
		Orders:                 orders.NewService(nil),
		Support:                support.NewService(nil),
	})
}

func BuildRuntime(mux *http.ServeMux, cfg config.Config, services RuntimeServices) huma.API {
	return build(mux, cfg, services)
}

func build(mux *http.ServeMux, cfg config.Config, services RuntimeServices) huma.API {
	configureErrorsOnce.Do(func() {
		huma.NewError = func(status int, msg string, errs ...error) huma.StatusError {
			return web.NewAPIError(status, web.DefaultErrorCode(status), msg)
		}
	})

	humaConfig := huma.DefaultConfig(cfg.App.Name, cfg.App.Version)
	humaConfig.OpenAPI.Info.Description = "Backend-generated OpenAPI contract for the marketplace runtime."
	humaConfig.OpenAPIPath = "/openapi"
	humaConfig.DocsPath = "/docs"

	if services.PlatformRegistry == nil {
		services.PlatformRegistry = platformregistry.NewService(nil)
	}
	if services.AdminAuth == nil {
		services.AdminAuth = adminauth.NewService(cfg.AdminAuth, authstore.NewMemoryStore())
	}
	if services.AdminOps == nil {
		services.AdminOps = adminops.NewService(nil)
	}
	if services.AdminReview == nil {
		services.AdminReview = adminreview.NewService(nil)
	}
	if services.Chat == nil {
		services.Chat = chat.NewService(nil)
	}
	if services.Directory == nil {
		services.Directory = directory.NewService(nil)
	}
	if services.Notifications == nil {
		services.Notifications = notifications.NewService(nil)
	}
	if services.ViewerAuth == nil {
		services.ViewerAuth = viewerauth.NewService(cfg.ViewerAuth, nil, authstore.NewMemoryStore(), sms.NewSender(cfg.ViewerAuth.SMS, nil))
	}
	if services.ProfessionalOnboarding == nil {
		services.ProfessionalOnboarding = professionalonboarding.NewService(nil, services.PlatformRegistry, "")
	}
	if services.ProfessionalWorkspace == nil {
		services.ProfessionalWorkspace = professionalworkspace.NewService(nil)
	}
	if services.Offerings == nil {
		services.Offerings = offerings.NewService(nil)
	}
	if services.Orders == nil {
		services.Orders = orders.NewService(nil)
	}
	if services.Support == nil {
		services.Support = support.NewService(nil)
	}

	api := humago.NewWithPrefix(mux, "/api/v1", humaConfig)
	configureSecuritySchemes(api, cfg)
	health.RegisterRoutes(api, cfg)
	adminauth.RegisterRoutes(api, services.AdminAuth)
	adminops.RegisterRoutes(api, services.AdminOps)
	adminreview.RegisterRoutes(api, services.AdminReview)
	chat.RegisterRESTRoutes(api, services.Chat)
	directory.RegisterRoutes(api, services.Directory)
	notifications.RegisterRoutes(api, services.Notifications)
	viewerauth.RegisterRoutes(api, services.ViewerAuth)
	platformregistry.RegisterRoutes(api, services.PlatformRegistry)
	professionalonboarding.RegisterRoutes(api, services.ProfessionalOnboarding)
	professionalworkspace.RegisterRoutes(api, services.ProfessionalWorkspace)
	offerings.RegisterRoutes(api, services.Offerings)
	orders.RegisterRoutes(api, services.Orders)
	support.RegisterRoutes(api, services.Support)
	registerWebsocketContract(api)

	return api
}

func configureSecuritySchemes(api huma.API, cfg config.Config) {
	if api.OpenAPI().Components == nil {
		api.OpenAPI().Components = &huma.Components{
			Schemas: huma.NewMapRegistry("#/components/schemas/", huma.DefaultSchemaNamer),
		}
	}
	if api.OpenAPI().Components.SecuritySchemes == nil {
		api.OpenAPI().Components.SecuritySchemes = map[string]*huma.SecurityScheme{}
	}

	api.OpenAPI().Components.SecuritySchemes[adminauth.SecuritySchemeName] = &huma.SecurityScheme{
		Type:        "apiKey",
		In:          "cookie",
		Name:        cfg.AdminAuth.Cookie.Name,
		Description: "Admin session cookie issued by POST /api/v1/admin/auth/session.",
	}
	api.OpenAPI().Components.SecuritySchemes[viewerauth.SecuritySchemeName] = &huma.SecurityScheme{
		Type:        "apiKey",
		In:          "cookie",
		Name:        cfg.ViewerAuth.Cookie.Name,
		Description: "Viewer session cookie issued by POST /api/v1/auth/login or POST /api/v1/auth/register.",
	}
}

func registerWebsocketContract(api huma.API) {
	api.OpenAPI().Paths["/ws/chat"] = &huma.PathItem{
		Get: &huma.Operation{
			Tags:        []string{"Realtime"},
			Summary:     "Upgrade chat connection to WebSocket",
			Description: "WebSocket handshake endpoint for live chat. The HTTP handshake is documented here; realtime event payloads are defined in the SDK package and project docs.",
			OperationID: "connect-chat-websocket",
			Parameters: []*huma.Param{
				{
					Name:        "thread_id",
					In:          "query",
					Description: "Chat thread identifier. Defaults to default-thread when omitted.",
					Schema:      &huma.Schema{Type: "string"},
					Example:     "integration-thread",
				},
				{
					Name:        "client_id",
					In:          "query",
					Description: "Unique client identifier. Defaults to web-client when omitted.",
					Schema:      &huma.Schema{Type: "string"},
					Example:     "web-client",
				},
				{
					Name:        "sender",
					In:          "query",
					Description: "Display name used as the sender fallback for outbound messages.",
					Schema:      &huma.Schema{Type: "string"},
					Example:     "Web Client",
				},
			},
			Responses: map[string]*huma.Response{
				"101": {Description: "WebSocket handshake accepted."},
				"403": {Description: "Origin is not authorized for this WebSocket endpoint."},
			},
		},
	}
}
