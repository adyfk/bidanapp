package professionalworkspace

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

const SecuritySchemeName = "ViewerSessionAuth"

type platformInput struct {
	PlatformID string `path:"platform_id"`
}

type profileInput struct {
	PlatformID string `path:"platform_id"`
	Body       UpsertProfessionalWorkspaceProfileRequest
}

type portfolioInput struct {
	PlatformID string `path:"platform_id"`
	Body       ReplaceProfessionalPortfolioRequest
}

type trustInput struct {
	PlatformID string `path:"platform_id"`
	Body       ReplaceProfessionalTrustRequest
}

type coverageInput struct {
	PlatformID string `path:"platform_id"`
	Body       ReplaceProfessionalCoverageRequest
}

type availabilityInput struct {
	PlatformID string `path:"platform_id"`
	Body       ReplaceProfessionalAvailabilityRequest
}

type notificationsInput struct {
	PlatformID string `path:"platform_id"`
	Body       UpdateProfessionalNotificationPreferencesRequest
}

type professionalWorkspaceResponseBody struct {
	Data ProfessionalWorkspaceSnapshot `json:"data"`
}

type professionalWorkspaceResponse struct {
	Body professionalWorkspaceResponseBody
}

type professionalWorkspaceOrdersResponseBody struct {
	Data struct {
		Orders []ProfessionalOrderSummary `json:"orders"`
	} `json:"data"`
}

type professionalWorkspaceOrdersResponse struct {
	Body professionalWorkspaceOrdersResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "get-professional-workspace-snapshot",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/professionals/me/workspace",
		Summary:     "Get the workspace snapshot for the authenticated professional on one platform",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *platformInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.Snapshot(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "list-professional-workspace-orders",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/orders",
		Summary:     "List order queue items for the authenticated professional on one platform",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *platformInput) (*professionalWorkspaceOrdersResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		items, err := service.ListOrders(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceOrdersResponse{}
		response.Body.Data.Orders = items
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "upsert-professional-workspace-profile",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/profile",
		Summary:     "Create or update professional profile data for one platform",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *profileInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.UpsertProfile(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "replace-professional-workspace-portfolio",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/portfolio",
		Summary:     "Replace portfolio and gallery entries for one professional workspace",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *portfolioInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.ReplacePortfolio(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "replace-professional-workspace-trust",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/trust",
		Summary:     "Replace trust-building content such as credentials and stories",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *trustInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.ReplaceTrust(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "replace-professional-workspace-coverage",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/coverage",
		Summary:     "Replace coverage areas for one professional workspace",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *coverageInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.ReplaceCoverage(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "replace-professional-workspace-availability",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/availability",
		Summary:     "Replace availability rules for one professional workspace",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *availabilityInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.ReplaceAvailability(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "update-professional-workspace-notifications",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/workspace/notifications",
		Summary:     "Update notification preferences for one professional workspace",
		Tags:        []string{"Professional Workspace"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *notificationsInput) (*professionalWorkspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.UpdateNotifications(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &professionalWorkspaceResponse{}
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
	case errors.Is(err, ErrInvalidPayload):
		return web.NewAPIError(http.StatusBadRequest, "invalid_professional_workspace_payload", "invalid professional workspace payload")
	case errors.Is(err, ErrProfileNotFound):
		return web.NewAPIError(http.StatusBadRequest, "platform_profile_not_found", "professional platform profile not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
