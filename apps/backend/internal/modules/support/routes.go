package support

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type viewerListInput struct {
	PlatformID string `query:"platform_id"`
}

type createInput struct {
	Body CreateSupportTicketRequest
}

type ticketInput struct {
	TicketID string `path:"ticket_id"`
}

type triageInput struct {
	TicketID string `path:"ticket_id"`
	Body     TriageSupportTicketRequest
}

type adminListInput struct {
	PlatformID string `query:"platform_id"`
}

type ticketResponseBody struct {
	Data SupportTicket `json:"data"`
}

type ticketResponse struct {
	Body ticketResponseBody
}

type ticketListResponseBody struct {
	Data SupportTicketList `json:"data"`
}

type ticketListResponse struct {
	Body ticketListResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "list-viewer-support-tickets",
		Method:      http.MethodGet,
		Path:        "/support/tickets",
		Summary:     "List support tickets owned by the authenticated viewer",
		Tags:        []string{"Support"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *viewerListInput) (*ticketListResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.ListViewerTickets(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &ticketListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "create-viewer-support-ticket",
		Method:      http.MethodPost,
		Path:        "/support/tickets",
		Summary:     "Create a new support ticket for the authenticated viewer",
		Tags:        []string{"Support"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createInput) (*ticketResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.Create(ctx, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &ticketResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "get-viewer-support-ticket",
		Method:      http.MethodGet,
		Path:        "/support/tickets/{ticket_id}",
		Summary:     "Get one viewer-owned support ticket",
		Tags:        []string{"Support"},
		Errors:      []int{http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *ticketInput) (*ticketResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.GetViewerTicket(ctx, input.TicketID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &ticketResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "list-admin-support-tickets",
		Method:      http.MethodGet,
		Path:        "/admin/support/tickets",
		Summary:     "List support tickets for admin triage",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminListInput) (*ticketListResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.ListAdminTickets(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &ticketListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "triage-admin-support-ticket",
		Method:      http.MethodPost,
		Path:        "/admin/support/tickets/{ticket_id}/triage",
		Summary:     "Triage and update a support ticket as an admin",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *triageInput) (*ticketResponse, error) {
		session, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.Triage(ctx, input.TicketID, session.Session.AdminID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &ticketResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withViewerSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{ViewerSecuritySchemeName: {}},
	}
	return operation
}

func withAdminSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{AdminSecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, viewerauth.ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_not_found", "viewer session not found")
	case errors.Is(err, ErrInvalidPayload):
		return web.NewAPIError(http.StatusBadRequest, "invalid_support_payload", "invalid support payload")
	case errors.Is(err, ErrTicketNotFound):
		return web.NewAPIError(http.StatusNotFound, "support_ticket_not_found", "support ticket not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
