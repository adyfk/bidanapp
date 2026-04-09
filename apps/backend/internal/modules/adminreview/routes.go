package adminreview

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type platformInput struct {
	PlatformID string `path:"platform_id"`
}

type reviewInput struct {
	ApplicationID string `path:"application_id"`
	PlatformID    string `path:"platform_id"`
	Body          ReviewProfessionalApplicationRequest
}

type reviewListResponseBody struct {
	Data ProfessionalApplicationReviewList `json:"data"`
}

type reviewListResponse struct {
	Body reviewListResponseBody
}

type reviewResponseBody struct {
	Data ProfessionalApplicationReviewItem `json:"data"`
}

type reviewResponse struct {
	Body reviewResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "list-platform-professional-applications",
		Method:      http.MethodGet,
		Path:        "/admin/platforms/{platform_id}/professional-applications",
		Summary:     "List professional applications for one platform review queue",
		Tags:        []string{"Admin Review"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *platformInput) (*reviewListResponse, error) {
		if _, ok := adminauth.ContextSession(ctx); !ok {
			return nil, toAPIError(adminauth.ErrSessionNotFound)
		}

		payload, err := service.ListPlatformApplications(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &reviewListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "review-platform-professional-application",
		Method:      http.MethodPost,
		Path:        "/admin/platforms/{platform_id}/professional-applications/{application_id}/review",
		Summary:     "Approve, reject, or request changes for one professional application",
		Tags:        []string{"Admin Review"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *reviewInput) (*reviewResponse, error) {
		authSession, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(adminauth.ErrSessionNotFound)
		}

		payload, err := service.ReviewApplication(ctx, input.PlatformID, input.ApplicationID, authSession.Session.AdminID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &reviewResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withAdminSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, adminauth.ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
	case errors.Is(err, ErrInvalidPayload):
		return web.NewAPIError(http.StatusBadRequest, "invalid_review_payload", err.Error())
	case errors.Is(err, ErrNotFound):
		return web.NewAPIError(http.StatusBadRequest, "application_not_found", "professional application not found")
	case errors.Is(err, ErrDatabaseUnavailable):
		return web.NewAPIError(http.StatusInternalServerError, "database_unavailable", "database connection is required")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
