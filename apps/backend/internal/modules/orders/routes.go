package orders

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

type createOrderInput struct {
	PlatformID string `path:"platform_id"`
	Body       CreatePlatformOrderRequest
}

type orderInput struct {
	OrderID string `path:"order_id"`
}

type customerOrderInput struct {
	OrderID    string `path:"order_id"`
	PlatformID string `path:"platform_id"`
}

type paymentSessionInput struct {
	OrderID string `path:"order_id"`
	Body    CreateOrderPaymentSessionRequest
}

type paymentWebhookInput struct {
	Provider string `path:"provider"`
	Body     PaymentWebhookRequest
}

type orderResponseBody struct {
	Data CustomerPlatformOrder `json:"data"`
}

type orderResponse struct {
	Body orderResponseBody
}

type orderListResponseBody struct {
	Data CustomerPlatformOrderList `json:"data"`
}

type orderListResponse struct {
	Body orderListResponseBody
}

type paymentSessionResponseBody struct {
	Data OrderPaymentSession `json:"data"`
}

type paymentSessionResponse struct {
	Body paymentSessionResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "list-customer-platform-orders",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/customers/me/orders",
		Summary:     "List orders for the authenticated customer on one platform",
		Tags:        []string{"Orders"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *platformInput) (*orderListResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		orders, err := service.ListByCustomer(ctx, input.PlatformID, session.Session.UserID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &orderListResponse{}
		response.Body.Data = orders
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "get-customer-platform-order",
		Method:      http.MethodGet,
		Path:        "/platforms/{platform_id}/customers/me/orders/{order_id}",
		Summary:     "Get one order for the authenticated customer on one platform",
		Tags:        []string{"Orders"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerOrderInput) (*orderResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		order, err := service.GetByCustomer(ctx, input.PlatformID, session.Session.UserID, input.OrderID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &orderResponse{}
		response.Body.Data = order
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "create-platform-order",
		Method:      http.MethodPost,
		Path:        "/platforms/{platform_id}/orders",
		Summary:     "Create one new order under the authenticated customer",
		Tags:        []string{"Orders"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createOrderInput) (*orderResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		order, err := service.Create(ctx, input.PlatformID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &orderResponse{}
		response.Body.Data = order
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "create-order-payment-session",
		Method:      http.MethodPost,
		Path:        "/orders/{order_id}/payments/session",
		Summary:     "Create one payment checkout session for an authenticated viewer-owned order",
		Tags:        []string{"Orders"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *paymentSessionInput) (*paymentSessionResponse, error) {
		session, ok := viewerauth.ContextSession(ctx)
		if !ok {
			return nil, toAPIError(viewerauth.ErrSessionNotFound)
		}

		payload, err := service.CreatePaymentSession(ctx, input.OrderID, session.Session.UserID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &paymentSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "handle-payment-webhook",
		Method:      http.MethodPost,
		Path:        "/webhooks/payments/{provider}",
		Summary:     "Update order and payment state from a payment provider callback",
		Tags:        []string{"Orders"},
		Errors:      []int{http.StatusBadRequest, http.StatusInternalServerError},
	}, func(ctx context.Context, input *paymentWebhookInput) (*paymentSessionResponse, error) {
		payload, err := service.HandlePaymentWebhook(ctx, input.Provider, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &paymentSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withCustomerSecurity(operation huma.Operation) huma.Operation {
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
		return web.NewAPIError(http.StatusBadRequest, "invalid_order_payload", "invalid order payload")
	case errors.Is(err, ErrOfferingNotFound):
		return web.NewAPIError(http.StatusBadRequest, "offering_not_found", "offering not found")
	case errors.Is(err, ErrOrderNotFound):
		return web.NewAPIError(http.StatusBadRequest, "order_not_found", "order not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
