package health

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/config"
)

type info struct {
	Status      string `json:"status"`
	Service     string `json:"service"`
	Version     string `json:"version"`
	Environment string `json:"environment"`
}

type responseBody struct {
	Data info `json:"data"`
}

type response struct {
	Body responseBody
}

func RegisterRoutes(api huma.API, cfg config.Config) {
	huma.Register(api, huma.Operation{
		OperationID: "get-health",
		Method:      http.MethodGet,
		Path:        "/health",
		Summary:     "Get health status",
		Tags:        []string{"Health"},
	}, func(ctx context.Context, input *struct{}) (*response, error) {
		result := &response{}
		result.Body.Data = info{
			Status:      "ok",
			Service:     cfg.App.Name,
			Version:     cfg.App.Version,
			Environment: cfg.App.Environment,
		}
		return result, nil
	})
}
