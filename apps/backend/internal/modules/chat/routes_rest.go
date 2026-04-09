package chat

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type listThreadsInput struct {
	OrderID    string `query:"order_id"`
	PlatformID string `query:"platform_id"`
}

type createThreadInput struct {
	Body CreateChatThreadRequest
}

type threadInput struct {
	ThreadID string `path:"thread_id"`
}

type createMessageInput struct {
	ThreadID string `path:"thread_id"`
	Body     CreateChatMessageRequest
}

type threadListResponseBody struct {
	Data ChatThreadList `json:"data"`
}

type threadListResponse struct {
	Body threadListResponseBody
}

type threadResponseBody struct {
	Data ChatThreadDetail `json:"data"`
}

type threadResponse struct {
	Body threadResponseBody
}

func RegisterRESTRoutes(api huma.API, service *Service) {
	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "list-chat-threads",
		Method:      http.MethodGet,
		Path:        "/chat/threads",
		Summary:     "List conversation and order chat threads for the authenticated viewer",
		Tags:        []string{"Chat"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *listThreadsInput) (*threadListResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toChatAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.ListThreads(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toChatAPIError(err)
		}
		if input.OrderID != "" {
			filtered := make([]ChatThreadSummary, 0, len(payload.Threads))
			for _, item := range payload.Threads {
				if item.OrderID == input.OrderID {
					filtered = append(filtered, item)
				}
			}
			payload.Threads = filtered
		}
		response := &threadListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "create-chat-thread",
		Method:      http.MethodPost,
		Path:        "/chat/threads",
		Summary:     "Create a conversation or order-linked chat thread",
		Tags:        []string{"Chat"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createThreadInput) (*threadResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toChatAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.CreateThread(ctx, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toChatAPIError(err)
		}
		response := &threadResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "get-chat-thread",
		Method:      http.MethodGet,
		Path:        "/chat/threads/{thread_id}",
		Summary:     "Get one chat thread and its message history",
		Tags:        []string{"Chat"},
		Errors:      []int{http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *threadInput) (*threadResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toChatAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.GetThread(ctx, input.ThreadID, session.Session.UserID)
		if err != nil {
			return nil, toChatAPIError(err)
		}
		response := &threadResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withViewerSecurity(huma.Operation{
		OperationID: "create-chat-message",
		Method:      http.MethodPost,
		Path:        "/chat/threads/{thread_id}/messages",
		Summary:     "Create a message inside one chat thread",
		Tags:        []string{"Chat"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createMessageInput) (*threadResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toChatAPIError(viewerauth.ErrSessionNotFound)
		}
		payload, err := service.CreateMessage(ctx, input.ThreadID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toChatAPIError(err)
		}
		response := &threadResponse{}
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

func toChatAPIError(err error) error {
	switch {
	case errors.Is(err, viewerauth.ErrSessionNotFound):
		return web.NewAPIError(http.StatusUnauthorized, "viewer_session_not_found", "viewer session not found")
	case errors.Is(err, ErrChatInvalidPayload):
		return web.NewAPIError(http.StatusBadRequest, "invalid_chat_payload", "invalid chat payload")
	case errors.Is(err, ErrChatThreadNotFound):
		return web.NewAPIError(http.StatusNotFound, "chat_thread_not_found", "chat thread not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
