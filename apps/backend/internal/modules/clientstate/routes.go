package clientstate

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/platform/web"
)

type professionalNotificationsQueryInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to scope professional notification read state"`
}

type consumerPreferencesQueryInput struct {
	ConsumerID string `query:"consumer_id" doc:"Optional consumer id to scope consumer preference state"`
}

type viewerSessionInput struct {
	Body ViewerSessionData
}

type customerNotificationsInput struct {
	Body CustomerNotificationStateData
}

type customerPushSubscriptionInput struct {
	Body CustomerPushSubscriptionData
}

type professionalNotificationsInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to scope professional notification read state"`
	Body           ProfessionalNotificationStateData
}

type consumerPreferencesInput struct {
	ConsumerID string `query:"consumer_id" doc:"Optional consumer id to scope consumer preference state"`
	Body       ConsumerPreferencesData
}

type adminSessionInput struct {
	Body AdminSessionData
}

type adminSessionQueryInput struct{}

type supportDeskInput struct {
	Body SupportDeskData
}

type supportDeskQueryInput struct{}

type adminConsoleInput struct {
	Body AdminConsoleData
}

type adminConsoleQueryInput struct{}

type adminConsoleTablePathInput struct {
	TableName string `path:"table_name" doc:"Admin console table name"`
}

type adminConsoleTableInput struct {
	TableName string `path:"table_name" doc:"Admin console table name"`
	Body      AdminConsoleTableUpsertData
}

type viewerSessionResponseBody struct {
	Data ViewerSessionData `json:"data"`
}

type customerNotificationsResponseBody struct {
	Data CustomerNotificationStateData `json:"data"`
}

type customerPushSubscriptionResponseBody struct {
	Data CustomerPushSubscriptionData `json:"data"`
}

type professionalNotificationsResponseBody struct {
	Data ProfessionalNotificationStateData `json:"data"`
}

type consumerPreferencesResponseBody struct {
	Data ConsumerPreferencesData `json:"data"`
}

type adminSessionResponseBody struct {
	Data AdminSessionData `json:"data"`
}

type supportDeskResponseBody struct {
	Data SupportDeskData `json:"data"`
}

type adminConsoleResponseBody struct {
	Data AdminConsoleData `json:"data"`
}

type adminConsoleTableResponseBody struct {
	Data AdminConsoleTableData `json:"data"`
}

type viewerSessionResponse struct {
	Body viewerSessionResponseBody
}

type customerNotificationsResponse struct {
	Body customerNotificationsResponseBody
}

type customerPushSubscriptionResponse struct {
	Body customerPushSubscriptionResponseBody
}

type professionalNotificationsResponse struct {
	Body professionalNotificationsResponseBody
}

type consumerPreferencesResponse struct {
	Body consumerPreferencesResponseBody
}

type adminSessionResponse struct {
	Body adminSessionResponseBody
}

type supportDeskResponse struct {
	Body supportDeskResponseBody
}

type adminConsoleResponse struct {
	Body adminConsoleResponseBody
}

type adminConsoleTableResponse struct {
	Body adminConsoleTableResponseBody
}

type customerNotificationsHeaderInput struct{}

func RegisterRoutes(api huma.API, service *Service) {
	huma.Register(api, huma.Operation{
		OperationID: "get-viewer-session",
		Method:      http.MethodGet,
		Path:        "/viewer/session",
		Summary:     "Get persisted viewer session state",
		Tags:        []string{"App State"},
		Errors:      []int{http.StatusInternalServerError},
	}, func(ctx context.Context, input *struct{}) (*viewerSessionResponse, error) {
		payload, err := service.ViewerSession(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "upsert-viewer-session",
		Method:      http.MethodPut,
		Path:        "/viewer/session",
		Summary:     "Persist viewer session state",
		Tags:        []string{"App State"},
		Errors:      []int{http.StatusBadRequest, http.StatusInternalServerError},
	}, func(ctx context.Context, input *viewerSessionInput) (*viewerSessionResponse, error) {
		payload, err := service.UpsertViewerSession(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &viewerSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "get-customer-notifications-state",
		Method:      http.MethodGet,
		Path:        "/notifications/customer",
		Summary:     "Get persisted customer notification read state",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerNotificationsHeaderInput) (*customerNotificationsResponse, error) {
		consumerID, err := resolveCustomerScope(ctx, "")
		if err != nil {
			return nil, err
		}

		payload, err := service.CustomerNotifications(ctx, consumerID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerNotificationsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "upsert-customer-notifications-state",
		Method:      http.MethodPut,
		Path:        "/notifications/customer",
		Summary:     "Persist customer notification read state",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerNotificationsInput) (*customerNotificationsResponse, error) {
		consumerID, err := resolveCustomerScope(ctx, "")
		if err != nil {
			return nil, err
		}

		payload, err := service.UpsertCustomerNotifications(ctx, input.Body, consumerID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerNotificationsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "upsert-customer-push-subscription",
		Method:      http.MethodPut,
		Path:        "/notifications/customer/push-subscription",
		Summary:     "Persist customer web push subscription",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerPushSubscriptionInput) (*customerPushSubscriptionResponse, error) {
		consumerID, err := resolveCustomerScope(ctx, "")
		if err != nil {
			return nil, err
		}

		payload, err := service.UpsertCustomerPushSubscription(ctx, input.Body, consumerID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &customerPushSubscriptionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "delete-customer-push-subscription",
		Method:      http.MethodDelete,
		Path:        "/notifications/customer/push-subscription",
		Summary:     "Delete customer web push subscription",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *customerPushSubscriptionInput) (*struct{}, error) {
		consumerID, err := resolveCustomerScope(ctx, "")
		if err != nil {
			return nil, err
		}

		if err := service.DeleteCustomerPushSubscription(ctx, input.Body, consumerID); err != nil {
			return nil, toAPIError(err)
		}

		return &struct{}{}, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-notifications-state",
		Method:      http.MethodGet,
		Path:        "/notifications/professional",
		Summary:     "Get persisted professional notification read state",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *professionalNotificationsQueryInput) (*professionalNotificationsResponse, error) {
		professionalID, err := resolveProfessionalNotificationsScope(ctx, input.ProfessionalID)
		if err != nil {
			return nil, err
		}

		payload, err := service.ProfessionalNotifications(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalNotificationsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-notifications-state",
		Method:      http.MethodPut,
		Path:        "/notifications/professional",
		Summary:     "Persist professional notification read state",
		Tags:        []string{"Notifications"},
		Errors:      []int{http.StatusBadRequest, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *professionalNotificationsInput) (*professionalNotificationsResponse, error) {
		professionalID, err := resolveProfessionalNotificationsScope(ctx, input.ProfessionalID)
		if err != nil {
			return nil, err
		}

		payload, err := service.UpsertProfessionalNotifications(ctx, ProfessionalNotificationStateData{
			ReadIDsByProfessional: map[string][]string{
				professionalID: append([]string(nil), input.Body.ReadIDsByProfessional[professionalID]...),
			},
		}, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &professionalNotificationsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "get-consumer-preferences",
		Method:      http.MethodGet,
		Path:        "/consumers/preferences",
		Summary:     "Get persisted consumer preference state",
		Tags:        []string{"App State"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *consumerPreferencesQueryInput) (*consumerPreferencesResponse, error) {
		consumerID, err := resolveCustomerScope(ctx, input.ConsumerID)
		if err != nil {
			return nil, err
		}

		payload, err := service.ConsumerPreferences(ctx, consumerID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &consumerPreferencesResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "upsert-consumer-preferences",
		Method:      http.MethodPut,
		Path:        "/consumers/preferences",
		Summary:     "Persist consumer preference state",
		Tags:        []string{"App State"},
		Errors:      []int{http.StatusBadRequest, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *consumerPreferencesInput) (*consumerPreferencesResponse, error) {
		consumerID, err := resolveCustomerScope(ctx, input.ConsumerID)
		if err != nil {
			return nil, err
		}

		input.Body.ConsumerID = consumerID
		payload, err := service.UpsertConsumerPreferences(ctx, input.Body, consumerID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &consumerPreferencesResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-session",
		Method:      http.MethodGet,
		Path:        "/admin/session",
		Summary:     "Get persisted admin session state",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminSessionQueryInput) (*adminSessionResponse, error) {
		payload, err := service.AdminSession(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "upsert-admin-session",
		Method:      http.MethodPut,
		Path:        "/admin/session",
		Summary:     "Persist admin session state",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminSessionInput) (*adminSessionResponse, error) {
		payload, err := service.UpsertAdminSession(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminSessionResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-support-desk",
		Method:      http.MethodGet,
		Path:        "/admin/support-desk",
		Summary:     "Get persisted admin support desk snapshot",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *supportDeskQueryInput) (*supportDeskResponse, error) {
		payload, err := service.SupportDesk(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &supportDeskResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "upsert-admin-support-desk",
		Method:      http.MethodPut,
		Path:        "/admin/support-desk",
		Summary:     "Persist admin support desk snapshot",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *supportDeskInput) (*supportDeskResponse, error) {
		payload, err := service.UpsertSupportDesk(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &supportDeskResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-console",
		Method:      http.MethodGet,
		Path:        "/admin/console",
		Summary:     "Get persisted admin console snapshot",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminConsoleQueryInput) (*adminConsoleResponse, error) {
		payload, err := service.AdminConsole(ctx)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminConsoleResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "upsert-admin-console",
		Method:      http.MethodPut,
		Path:        "/admin/console",
		Summary:     "Persist admin console snapshot",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminConsoleInput) (*adminConsoleResponse, error) {
		payload, err := service.UpsertAdminConsole(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminConsoleResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "get-admin-console-table",
		Method:      http.MethodGet,
		Path:        "/admin/console/tables/{table_name}",
		Summary:     "Get persisted admin console table snapshot",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminConsoleTablePathInput) (*adminConsoleTableResponse, error) {
		payload, err := service.AdminConsoleTable(ctx, input.TableName)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminConsoleTableResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withAdminSecurity(huma.Operation{
		OperationID: "upsert-admin-console-table",
		Method:      http.MethodPut,
		Path:        "/admin/console/tables/{table_name}",
		Summary:     "Persist admin console table snapshot",
		Tags:        []string{"Admin"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *adminConsoleTableInput) (*adminConsoleTableResponse, error) {
		payload, err := service.UpsertAdminConsoleTable(ctx, input.TableName, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &adminConsoleTableResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func withAdminSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{adminauth.SecuritySchemeName: {}},
	}
	return operation
}

func withCustomerSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{customerauth.SecuritySchemeName: {}},
	}
	return operation
}

func withProfessionalSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{professionalauth.SecuritySchemeName: {}},
	}
	return operation
}

func resolveCustomerScope(ctx context.Context, requestedConsumerID string) (string, error) {
	authSession, ok := customerauth.ContextSession(ctx)
	if !ok {
		return "", web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
	}

	consumerID := authSession.Session.ConsumerID
	if requestedConsumerID != "" && requestedConsumerID != consumerID {
		return "", web.NewAPIError(http.StatusForbidden, "customer_scope_forbidden", "consumer scope does not match the authenticated customer")
	}

	return consumerID, nil
}

func resolveProfessionalNotificationsScope(ctx context.Context, requestedProfessionalID string) (string, error) {
	authSession, ok := professionalauth.ContextSession(ctx)
	if !ok {
		return "", web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
	}

	professionalID := authSession.Session.ProfessionalID
	if requestedProfessionalID != "" && requestedProfessionalID != professionalID {
		return "", web.NewAPIError(http.StatusForbidden, "professional_scope_forbidden", "professional notification scope does not match the authenticated professional")
	}

	return professionalID, nil
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, errInvalidAdminConsoleTable):
		return web.NewAPIError(http.StatusBadRequest, "invalid_admin_console_table", "invalid admin console table")
	case errors.Is(err, errInvalidCustomerPushSubscription):
		return web.NewAPIError(http.StatusBadRequest, "invalid_customer_push_subscription", "invalid customer push subscription")
	case errors.Is(err, errInvalidSupportDesk):
		return web.NewAPIError(http.StatusBadRequest, "invalid_support_desk", "invalid support desk payload")
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
