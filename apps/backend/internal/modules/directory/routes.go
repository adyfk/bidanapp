package directory

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/platform/web"
)

type platformInput struct {
	PlatformID string `path:"platform_id"`
}

type professionalInput struct {
	PlatformID string `path:"platform_id"`
	Slug       string `path:"slug"`
}

type offeringInput struct {
	PlatformID string `path:"platform_id"`
	Slug       string `path:"slug"`
}

type directoryProfessionalListResponseBody struct {
	Data DirectoryProfessionalList `json:"data"`
}

type directoryProfessionalListResponse struct {
	Body directoryProfessionalListResponseBody
}

type directoryProfessionalDetailResponseBody struct {
	Data DirectoryProfessionalDetail `json:"data"`
}

type directoryProfessionalDetailResponse struct {
	Body directoryProfessionalDetailResponseBody
}

type directoryOfferingListResponseBody struct {
	Data DirectoryOfferingList `json:"data"`
}

type directoryOfferingListResponse struct {
	Body directoryOfferingListResponseBody
}

type directoryOfferingDetailResponseBody struct {
	Data DirectoryOfferingDetail `json:"data"`
}

type directoryOfferingDetailResponse struct {
	Body directoryOfferingDetailResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-directory-professionals",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/directory/professionals",
		Summary:     "List public professionals for one platform",
		Tags:        []string{"Directory"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *platformInput) (*directoryProfessionalListResponse, error) {
		payload, err := service.ListProfessionals(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &directoryProfessionalListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-directory-professional-by-slug",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/directory/professionals/{slug}",
		Summary:     "Get one public professional storefront by slug",
		Tags:        []string{"Directory"},
		Errors:      []int{http.StatusNotFound, http.StatusInternalServerError},
	}, func(ctx context.Context, input *professionalInput) (*directoryProfessionalDetailResponse, error) {
		payload, err := service.ProfessionalBySlug(ctx, input.PlatformID, input.Slug)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &directoryProfessionalDetailResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "list-directory-offerings",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/directory/offerings",
		Summary:     "List public offerings for one platform with directory metadata",
		Tags:        []string{"Directory"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *platformInput) (*directoryOfferingListResponse, error) {
		payload, err := service.ListOfferings(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &directoryOfferingListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "get-directory-offering-by-slug",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/directory/offerings/{slug}",
		Summary:     "Get one public offering by slug",
		Tags:        []string{"Directory"},
		Errors:      []int{http.StatusNotFound, http.StatusInternalServerError},
	}, func(ctx context.Context, input *offeringInput) (*directoryOfferingDetailResponse, error) {
		payload, err := service.OfferingBySlug(ctx, input.PlatformID, input.Slug)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &directoryOfferingDetailResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, ErrProfessionalNotFound):
		return web.NewAPIError(http.StatusNotFound, "directory_professional_not_found", "directory professional not found")
	case errors.Is(err, ErrOfferingNotFound):
		return web.NewAPIError(http.StatusNotFound, "directory_offering_not_found", "directory offering not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
