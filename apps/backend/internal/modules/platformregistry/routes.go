package platformregistry

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/platform/web"
)

type listPlatformsResponseBody struct {
	Data struct {
		Platforms []PlatformDefinition `json:"platforms"`
	} `json:"data"`
}

type listPlatformsResponse struct {
	Body listPlatformsResponseBody
}

type getPlatformInput struct {
	PlatformID string `path:"platform_id"`
}

type resolvePlatformInput struct {
	Host string `query:"host"`
}

type getPlatformResponseBody struct {
	Data PlatformDefinition `json:"data"`
}

type getPlatformResponse struct {
	Body getPlatformResponseBody
}

type getSchemaResponseBody struct {
	Data PlatformProfessionalSchema `json:"data"`
}

type getSchemaResponse struct {
	Body getSchemaResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-platforms",
		Method:      http.MethodGet,
		Path:        "/platforms",
		Summary:     "List configured service platforms",
		Tags:        []string{"Platform Registry"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*listPlatformsResponse, error) {
		platforms, err := service.ListPlatforms(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &listPlatformsResponse{}
		response.Body.Data.Platforms = platforms
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-platform-by-id",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}",
		Summary:     "Get one platform by id",
		Tags:        []string{"Platform Registry"},
		Errors:      []int{http.StatusNotFound, http.StatusInternalServerError},
	}, func(ctx context.Context, input *getPlatformInput) (*getPlatformResponse, error) {
		platform, err := service.PlatformByID(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &getPlatformResponse{}
		response.Body.Data = platform
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "resolve-platform-by-host",
		Method:      http.MethodGet,
		Path:        "/platforms/resolve",
		Summary:     "Resolve one platform from a host or subdomain",
		Tags:        []string{"Platform Registry"},
		Errors:      []int{http.StatusNotFound, http.StatusInternalServerError},
	}, func(ctx context.Context, input *resolvePlatformInput) (*getPlatformResponse, error) {
		platform, err := service.ResolvePlatform(ctx, input.Host)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &getPlatformResponse{}
		response.Body.Data = platform
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-professional-schema-by-platform",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/professional-schema",
		Summary:     "Get the active professional registration schema for one platform",
		Tags:        []string{"Platform Registry"},
		Errors:      []int{http.StatusNotFound, http.StatusInternalServerError},
	}, func(ctx context.Context, input *getPlatformInput) (*getSchemaResponse, error) {
		schema, err := service.ActiveSchemaByPlatformID(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &getSchemaResponse{}
		response.Body.Data = schema
		return response, nil
	})
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrPlatformNotFound):
		return web.NewAPIError(http.StatusNotFound, "platform_not_found", "platform not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
