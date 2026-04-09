package adminops

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type queryInput struct {
	PlatformID string `query:"platform_id"`
}

type orderInput struct {
	OrderID string `path:"order_id"`
	Body    UpdateAdminOrderRequest
}

type createRefundInput struct {
	Body CreateAdminRefundRequest
}

type refundInput struct {
	RefundID string `path:"refund_id"`
	Body     UpdateRefundStatusRequest
}

type createPayoutInput struct {
	Body CreateAdminPayoutRequest
}

type payoutInput struct {
	PayoutID string `path:"payout_id"`
	Body     UpdatePayoutStatusRequest
}

type adminOverviewResponseBody struct {
	Data AdminOverview `json:"data"`
}

type adminOverviewResponse struct {
	Body adminOverviewResponseBody
}

type adminCustomerListResponseBody struct {
	Data AdminCustomerList `json:"data"`
}

type adminCustomerListResponse struct {
	Body adminCustomerListResponseBody
}

type adminOrderListResponseBody struct {
	Data AdminOrderList `json:"data"`
}

type adminOrderListResponse struct {
	Body adminOrderListResponseBody
}

type adminOrderResponseBody struct {
	Data AdminOrder `json:"data"`
}

type adminOrderResponse struct {
	Body adminOrderResponseBody
}

type adminRefundListResponseBody struct {
	Data RefundList `json:"data"`
}

type adminRefundListResponse struct {
	Body adminRefundListResponseBody
}

type adminRefundResponseBody struct {
	Data RefundRecord `json:"data"`
}

type adminRefundResponse struct {
	Body adminRefundResponseBody
}

type adminPayoutListResponseBody struct {
	Data PayoutList `json:"data"`
}

type adminPayoutListResponse struct {
	Body adminPayoutListResponseBody
}

type adminPayoutResponseBody struct {
	Data PayoutRecord `json:"data"`
}

type adminPayoutResponse struct {
	Body adminPayoutResponseBody
}

type adminStudioResponseBody struct {
	Data AdminStudioSnapshot `json:"data"`
}

type adminStudioResponse struct {
	Body adminStudioResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-overview",
		Method:      http.MethodGet,
		Path:        "/admin/overview",
		Summary:     "Get top-level admin overview metrics",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *queryInput) (*adminOverviewResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.Overview(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminOverviewResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "list-admin-customers",
		Method:      http.MethodGet,
		Path:        "/admin/customers",
		Summary:     "List customer rows for admin ops",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *queryInput) (*adminCustomerListResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.ListCustomers(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminCustomerListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "list-admin-orders",
		Method:      http.MethodGet,
		Path:        "/admin/orders",
		Summary:     "List orders for admin operations",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *queryInput) (*adminOrderListResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.ListOrders(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminOrderListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "update-admin-order-status",
		Method:      http.MethodPost,
		Path:        "/admin/orders/{order_id}/status",
		Summary:     "Update order and payment status from the admin console",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *orderInput) (*adminOrderResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.UpdateOrder(ctx, input.OrderID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminOrderResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "list-admin-refunds",
		Method:      http.MethodGet,
		Path:        "/admin/refunds",
		Summary:     "List refunds for admin finance ops",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *queryInput) (*adminRefundListResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.ListRefunds(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminRefundListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "create-admin-refund",
		Method:      http.MethodPost,
		Path:        "/admin/refunds",
		Summary:     "Create a refund request from admin ops",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createRefundInput) (*adminRefundResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.CreateRefund(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminRefundResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "update-admin-refund-status",
		Method:      http.MethodPost,
		Path:        "/admin/refunds/{refund_id}/status",
		Summary:     "Update refund state from the admin console",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *refundInput) (*adminRefundResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.UpdateRefund(ctx, input.RefundID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminRefundResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "list-admin-payouts",
		Method:      http.MethodGet,
		Path:        "/admin/payouts",
		Summary:     "List payouts for admin finance ops",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *queryInput) (*adminPayoutListResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.ListPayouts(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminPayoutListResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "create-admin-payout",
		Method:      http.MethodPost,
		Path:        "/admin/payouts",
		Summary:     "Create a payout row from the admin console",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createPayoutInput) (*adminPayoutResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.CreatePayout(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminPayoutResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "update-admin-payout-status",
		Method:      http.MethodPost,
		Path:        "/admin/payouts/{payout_id}/status",
		Summary:     "Update payout state from the admin console",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusBadRequest, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *payoutInput) (*adminPayoutResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.UpdatePayout(ctx, input.PayoutID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminPayoutResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-studio",
		Method:      http.MethodGet,
		Path:        "/admin/studio",
		Summary:     "Get a lightweight studio snapshot for finance and ops",
		Tags:        []string{"Admin Ops"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *queryInput) (*adminStudioResponse, error) {
		_, ok := adminauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "admin_session_not_found", "admin session not found")
		}
		payload, err := service.Studio(ctx, input.PlatformID)
		if err != nil {
			return nil, toAPIError(err)
		}
		response := &adminStudioResponse{}
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
	case errors.Is(err, ErrInvalidPayload):
		return web.NewAPIError(http.StatusBadRequest, "invalid_admin_ops_payload", "invalid admin ops payload")
	case errors.Is(err, ErrOrderNotFound):
		return web.NewAPIError(http.StatusNotFound, "admin_order_not_found", "admin order not found")
	case errors.Is(err, ErrRefundNotFound):
		return web.NewAPIError(http.StatusNotFound, "refund_not_found", "refund not found")
	case errors.Is(err, ErrPayoutNotFound):
		return web.NewAPIError(http.StatusNotFound, "payout_not_found", "payout not found")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
