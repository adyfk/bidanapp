package professionalonboarding

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type workspaceInput struct {
	PlatformID string `path:"platform_id"`
}

type upsertWorkspaceInput struct {
	PlatformID string `path:"platform_id"`
	Body       UpsertProfessionalPlatformApplicationRequest
}

type issueUploadInput struct {
	PlatformID string `path:"platform_id"`
	Body       IssueProfessionalDocumentUploadRequest
}

type workspaceResponseBody struct {
	Data ProfessionalPlatformWorkspace `json:"data"`
}

type workspaceResponse struct {
	Body workspaceResponseBody
}

type uploadTokenResponseBody struct {
	Data ProfessionalDocumentUploadToken `json:"data"`
}

type uploadTokenResponse struct {
	Body uploadTokenResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-platform-workspace",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/professionals/me/onboarding",
		Summary:     "Get the active professional workspace for one platform",
		Tags:        []string{"Professional Onboarding"},
		Errors:      []int{http.StatusUnauthorized, http.StatusNotFound, http.StatusInternalServerError},
	}), func(ctx context.Context, input *workspaceInput) (*workspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		workspace, err := service.Workspace(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &workspaceResponse{}
		response.Body.Data = workspace
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-platform-workspace",
		Method:      http.MethodPut,
		Path:        "/platforms/{platform_id}/professionals/me/onboarding",
		Summary:     "Create or update the professional application and storefront profile for one platform",
		Tags:        []string{"Professional Onboarding"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusNotFound, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertWorkspaceInput) (*workspaceResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		workspace, err := service.UpsertWorkspace(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &workspaceResponse{}
		response.Body.Data = workspace
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "issue-professional-document-upload-token",
		Method:      http.MethodPost,
		Path:        "/platforms/{platform_id}/professionals/me/documents/upload-token",
		Summary:     "Issue an upload token for one professional document in local storage",
		Tags:        []string{"Professional Onboarding"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *issueUploadInput) (*uploadTokenResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		token, err := service.IssueDocumentUploadToken(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &uploadTokenResponse{}
		response.Body.Data = token
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
	case errors.Is(err, ErrInvalidPayload), errors.Is(err, ErrMissingProfileName):
		return web.NewAPIError(http.StatusBadRequest, "invalid_professional_platform_payload", err.Error())
	case errors.Is(err, ErrDocumentNotFound):
		return web.NewAPIError(http.StatusBadRequest, "professional_document_not_found", "professional document not found")
	case errors.Is(err, ErrDatabaseUnavailable):
		return web.NewAPIError(http.StatusInternalServerError, "database_unavailable", "database connection is required")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
