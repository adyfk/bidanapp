package offerings

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type platformInput struct {
	PlatformID string `path:"platform_id"`
}

type createOfferingInput struct {
	PlatformID string `path:"platform_id"`
	Body       CreatePlatformOfferingRequest
}

type offeringResponseBody struct {
	Data PlatformOffering `json:"data"`
}

type offeringResponse struct {
	Body offeringResponseBody
}

type offeringListResponseBody struct {
	Data PlatformOfferingList `json:"data"`
}

type offeringListResponse struct {
	Body offeringListResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "list-platform-offerings",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/offerings",
		Summary:     "List public offerings for one platform",
		Tags:        []string{"Offerings"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *platformInput) (*offeringListResponse, error) {
		offerings, err := service.ListPublic(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &offeringListResponse{}
		response.Body.Data = offerings
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "list-professional-platform-offerings",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/professionals/me/offerings",
		Summary:     "List offerings owned by the authenticated professional for one platform",
		Tags:        []string{"Offerings"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *platformInput) (*offeringListResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		offerings, err := service.ListMine(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &offeringListResponse{}
		response.Body.Data = offerings
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "create-professional-platform-offering",
		Method:      http.MethodPost,
		Path:        "/platforms/{platform_id}/professionals/me/offerings",
		Summary:     "Create one offering under the authenticated professional storefront",
		Tags:        []string{"Offerings"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createOfferingInput) (*offeringResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		offering, err := service.Create(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &offeringResponse{}
		response.Body.Data = offering
		return response, nil
	})
}

func withProfessionalSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, viewerauth.ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_not_found", "viewer session not found")
	case errors.Is(err, ErrInvalidPayload):
		return web.NewAPIError(http.StatusBadRequest, "invalid_offering_payload", "invalid offering payload")
	case errors.Is(err, ErrProfileNotFound):
		return web.NewAPIError(http.StatusBadRequest, "platform_profile_not_found", "professional platform profile not found")
	case errors.Is(err, ErrProfileNotApproved):
		return web.NewAPIError(http.StatusBadRequest, "platform_profile_not_approved", "professional platform profile must be approved before publishing")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
