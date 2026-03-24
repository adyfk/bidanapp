package openapi

import (
	"net/http"
	"sync"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/appointments"
	"bidanapp/apps/backend/internal/modules/clientstate"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/health"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/modules/professionalportal"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/portalstore"
	"bidanapp/apps/backend/internal/platform/web"
)

var configureErrorsOnce sync.Once

type RuntimeServices struct {
	AdminAuth          *adminauth.Service
	CustomerAuth       *customerauth.Service
	ProfessionalAuth   *professionalauth.Service
	AppointmentWrites  *appointments.Service
	ProfessionalPortal *professionalportal.Service
	ReadModel          readmodel.Service
	ClientState        *clientstate.Service
}

func Build(mux *http.ServeMux, cfg config.Config) huma.API {
	return build(mux, cfg, RuntimeServices{
		AdminAuth:          adminauth.NewService(cfg.AdminAuth, documentstore.NewMemoryStore()),
		CustomerAuth:       customerauth.NewService(cfg.CustomerAuth, documentstore.NewMemoryStore()),
		ProfessionalAuth:   nil,
		AppointmentWrites:  nil,
		ProfessionalPortal: professionalportal.NewService(portalstore.NewMemoryStore()),
		ReadModel:          readmodel.NewService(cfg.SeedData.DataDir, portalstore.NewMemoryStore()),
		ClientState:        clientstate.NewService(documentstore.NewMemoryStore()),
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
	humaConfig.OpenAPI.Info.Description = "Backend-generated OpenAPI contract for BidanApp."
	humaConfig.OpenAPIPath = "/openapi"
	humaConfig.DocsPath = "/docs"

	if services.ProfessionalPortal == nil {
		services.ProfessionalPortal = professionalportal.NewService(portalstore.NewMemoryStore())
	}
	if services.AdminAuth == nil {
		services.AdminAuth = adminauth.NewService(cfg.AdminAuth, documentstore.NewMemoryStore())
	}
	if services.CustomerAuth == nil {
		services.CustomerAuth = customerauth.NewService(cfg.CustomerAuth, documentstore.NewMemoryStore())
	}
	var zeroReadModel readmodel.Service
	if services.ReadModel == zeroReadModel {
		services.ReadModel = readmodel.NewService(cfg.SeedData.DataDir, portalstore.NewMemoryStore())
	}
	if services.ProfessionalAuth == nil {
		services.ProfessionalAuth = professionalauth.NewService(
			cfg.ProfessionalAuth,
			services.ReadModel,
			documentstore.NewMemoryStore(),
		)
	}
	if services.AppointmentWrites == nil {
		services.AppointmentWrites = appointments.NewService(services.ProfessionalPortal)
	}
	if services.ClientState == nil {
		services.ClientState = clientstate.NewService(documentstore.NewMemoryStore())
	}

	api := humago.NewWithPrefix(mux, "/api/v1", humaConfig)
	configureSecuritySchemes(api, cfg)
	health.RegisterRoutes(api, cfg)
	adminauth.RegisterRoutes(api, services.AdminAuth)
	customerauth.RegisterRoutes(api, services.CustomerAuth)
	professionalauth.RegisterRoutes(api, services.ProfessionalAuth)
	readmodel.RegisterRoutes(api, services.ReadModel)
	appointments.RegisterRoutes(api, services.AppointmentWrites)
	professionalportal.RegisterRoutes(api, services.ProfessionalPortal)
	clientstate.RegisterRoutes(api, services.ClientState)
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
	api.OpenAPI().Components.SecuritySchemes[customerauth.SecuritySchemeName] = &huma.SecurityScheme{
		Type:        "apiKey",
		In:          "cookie",
		Name:        cfg.CustomerAuth.Cookie.Name,
		Description: "Customer session cookie issued by POST /api/v1/customers/auth/session.",
	}
	api.OpenAPI().Components.SecuritySchemes[professionalauth.SecuritySchemeName] = &huma.SecurityScheme{
		Type:        "apiKey",
		In:          "cookie",
		Name:        cfg.ProfessionalAuth.Cookie.Name,
		Description: "Professional session cookie issued by POST /api/v1/professionals/auth/session.",
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
				"101": {
					Description: "WebSocket handshake accepted.",
				},
				"403": {
					Description: "Origin is not authorized for this WebSocket endpoint.",
				},
			},
			Extensions: map[string]any{
				"x-bidanapp-realtime-events": map[string]any{
					"incoming": []map[string]any{
						{
							"type": "message",
							"shape": map[string]any{
								"type":   "message",
								"sender": "Web Client",
								"text":   "Halo dari frontend",
							},
						},
					},
					"outgoing": []map[string]any{
						{
							"type": "connected",
							"shape": map[string]any{
								"type":      "connected",
								"threadId":  "integration-thread",
								"clientId":  "web-client",
								"messages":  []map[string]any{},
								"timestamp": "2026-03-15T09:00:00Z",
							},
						},
						{
							"type": "message",
							"shape": map[string]any{
								"type":     "message",
								"threadId": "integration-thread",
								"message": map[string]any{
									"id":       "20260315090000-1",
									"threadId": "integration-thread",
									"sender":   "Web Client",
									"text":     "Halo dari frontend",
									"sentAt":   "2026-03-15T09:00:00Z",
								},
								"timestamp": "2026-03-15T09:00:00Z",
							},
						},
					},
				},
			},
		},
	}
}
