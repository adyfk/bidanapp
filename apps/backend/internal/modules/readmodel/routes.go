package readmodel

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/platform/web"
)

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

type bootstrapResponseBody struct {
	Data BootstrapData `json:"data"`
}

type bootstrapResponse struct {
	Body bootstrapResponseBody
}

type professionalInput struct {
	Slug string `path:"slug" doc:"Professional slug"`
}

func RegisterRoutes(api huma.API, service Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-catalog",
		Method:      http.MethodGet,
		Path:        "/catalog",
		Summary:     "Get categories, services, and professionals",
		Tags:        []string{"Directory"},
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
		Tags:        []string{"Directory"},
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
		Tags:        []string{"Directory"},
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

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-appointments",
		Method:      http.MethodGet,
		Path:        "/appointments",
		Summary:     "Get appointment read model payload for admin operations",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*appointmentsResponse, error) {
		payload, err := service.Appointments(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-bootstrap",
		Method:      http.MethodGet,
		Path:        "/bootstrap",
		Summary:     "Get frontend-ready bootstrap payload",
		Tags:        []string{"Bootstrap"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*bootstrapResponse, error) {
		payload, err := service.Bootstrap(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &bootstrapResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-chat",
		Method:      http.MethodGet,
		Path:        "/chat",
		Summary:     "Get chat thread read model payload",
		Tags:        []string{"Chat"},
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

func withAdminSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{adminauth.SecuritySchemeName: {}},
	}
	return operation
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
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
