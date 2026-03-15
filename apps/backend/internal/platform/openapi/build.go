package openapi

import (
	"net/http"
	"sync"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/simulation"
	"bidanapp/apps/backend/internal/platform/web"
)

var configureErrorsOnce sync.Once

func Build(mux *http.ServeMux, cfg config.Config) huma.API {
	configureErrorsOnce.Do(func() {
		huma.NewError = func(status int, msg string, errs ...error) huma.StatusError {
			return web.NewAPIError(status, web.DefaultErrorCode(status), msg)
		}
	})

	humaConfig := huma.DefaultConfig(cfg.App.Name, cfg.App.Version)
	humaConfig.OpenAPI.Info.Description = "Backend-generated OpenAPI contract for BidanApp."
	humaConfig.OpenAPIPath = "/openapi"
	humaConfig.DocsPath = "/docs"

	api := humago.NewWithPrefix(mux, "/api/v1", humaConfig)
	simulation.RegisterRoutes(api, cfg, simulation.NewService(cfg.Simulation.DataDir))
	registerWebsocketContract(api)

	return api
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
					Description: "Chat thread identifier. Defaults to demo-thread when omitted.",
					Schema:      &huma.Schema{Type: "string"},
					Example:     "integration-demo",
				},
				{
					Name:        "client_id",
					In:          "query",
					Description: "Unique client identifier. Defaults to web-client when omitted.",
					Schema:      &huma.Schema{Type: "string"},
					Example:     "frontend-demo",
				},
				{
					Name:        "sender",
					In:          "query",
					Description: "Display name used as the sender fallback for outbound messages.",
					Schema:      &huma.Schema{Type: "string"},
					Example:     "Frontend Demo",
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
								"sender": "Frontend Demo",
								"text":   "Halo dari frontend",
							},
						},
					},
					"outgoing": []map[string]any{
						{
							"type": "connected",
							"shape": map[string]any{
								"type":      "connected",
								"threadId":  "integration-demo",
								"clientId":  "frontend-demo",
								"messages":  []map[string]any{},
								"timestamp": "2026-03-15T09:00:00Z",
							},
						},
						{
							"type": "message",
							"shape": map[string]any{
								"type":     "message",
								"threadId": "integration-demo",
								"message": map[string]any{
									"id":       "20260315090000-1",
									"threadId": "integration-demo",
									"sender":   "Frontend Demo",
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
