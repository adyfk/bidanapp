package notifications

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type listInput struct {
	PlatformID string `path:"platform_id"`
}

type notificationsResponseBody struct {
	Data NotificationList `json:"data"`
}

type notificationsResponse struct {
	Body notificationsResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "list-platform-notifications",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/notifications",
		Summary:     "List customer and professional notifications for the authenticated viewer on one platform",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *listInput) (*notificationsResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.List(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &notificationsResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withViewerSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, viewerauth.ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_not_found", "viewer session not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
