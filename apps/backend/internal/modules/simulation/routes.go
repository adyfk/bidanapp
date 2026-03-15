package simulation

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/web"
)

type rootInfo struct {
	Name           string `json:"name"`
	Version        string `json:"version"`
	Environment    string `json:"environment"`
	FrontendOrigin string `json:"frontendOrigin"`
	Docs           string `json:"docs"`
}

type healthInfo struct {
	Status      string `json:"status"`
	Service     string `json:"service"`
	Version     string `json:"version"`
	Environment string `json:"environment"`
}

type rootResponseBody struct {
	Data rootInfo `json:"data"`
}

type rootResponse struct {
	Body rootResponseBody
}

type healthResponseBody struct {
	Data healthInfo `json:"data"`
}

type healthResponse struct {
	Body healthResponseBody
}

type settingsResponseBody struct {
	Data AppSettings `json:"data"`
}

type settingsResponse struct {
	Body settingsResponseBody
}

type catalogResponseBody struct {
	Data CatalogData `json:"data"`
}

type catalogResponse struct {
	Body catalogResponseBody
}

type professionalsResponseBody struct {
	Data []Professional `json:"data"`
}

type professionalsResponse struct {
	Body professionalsResponseBody
}

type professionalResponseBody struct {
	Data Professional `json:"data"`
}

type professionalResponse struct {
	Body professionalResponseBody
}

type appointmentsResponseBody struct {
	Data AppointmentData `json:"data"`
}

type appointmentsResponse struct {
	Body appointmentsResponseBody
}

type chatResponseBody struct {
	Data ChatData `json:"data"`
}

type chatResponse struct {
	Body chatResponseBody
}

type professionalInput struct {
	Slug string `path:"slug" doc:"Professional slug"`
}

func RegisterRoutes(api huma.API, cfg config.Config, service Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-health",
		Method:      http.MethodGet,
		Path:        "/health",
		Summary:     "Get health status",
		Tags:        []string{"Health"},
	}, func(ctx context.Context, input *struct{}) (*healthResponse, error) {
		response := &healthResponse{}
		response.Body.Data = healthInfo{
			Status:      "ok",
			Service:     cfg.App.Name,
			Version:     cfg.App.Version,
			Environment: cfg.App.Environment,
		}
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-settings",
		Method:      http.MethodGet,
		Path:        "/settings",
		Summary:     "Get app settings payload",
		Tags:        []string{"Simulation"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*settingsResponse, error) {
		payload, err := service.Settings(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &settingsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-catalog",
		Method:      http.MethodGet,
		Path:        "/catalog",
		Summary:     "Get categories, services, and professionals",
		Tags:        []string{"Simulation"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*catalogResponse, error) {
		payload, err := service.Catalog(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &catalogResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-professionals",
		Method:      http.MethodGet,
		Path:        "/professionals",
		Summary:     "List professionals",
		Tags:        []string{"Simulation"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*professionalsResponse, error) {
		payload, err := service.Professionals(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-professional",
		Method:      http.MethodGet,
		Path:        "/professionals/{slug}",
		Summary:     "Get professional by slug",
		Tags:        []string{"Simulation"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusInternalServerError},
	}, func(ctx context.Context, input *professionalInput) (*professionalResponse, error) {
		payload, err := service.ProfessionalBySlug(ctx, input.Slug)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-appointments",
		Method:      http.MethodGet,
		Path:        "/appointments",
		Summary:     "Get normalized appointment simulation payload",
		Tags:        []string{"Simulation"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*appointmentsResponse, error) {
		payload, err := service.Appointments(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-chat",
		Method:      http.MethodGet,
		Path:        "/chat",
		Summary:     "Get direct and appointment chat threads",
		Tags:        []string{"Simulation"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*chatResponse, error) {
		payload, err := service.Chat(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &chatResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrInvalidSlug):
		return web.NewAPIError(http.StatusBadRequest, "invalid_slug", "slug must contain only lowercase letters, numbers, and hyphens")
	case errors.Is(err, ErrNotFound):
		return web.NewAPIError(http.StatusNotFound, "not_found", "requested resource was not found")
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "simulation_error", "internal server error")
	}
}
