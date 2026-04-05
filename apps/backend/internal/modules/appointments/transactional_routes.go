package appointments

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/appointmentstore"
	"bidanapp/apps/backend/internal/platform/web"
)

var (
	ErrAppointmentConflict          = errors.New("appointment state transition is not allowed")
	ErrInvalidAppointmentInput      = errors.New("appointment input is invalid")
	ErrInvalidAppointmentFeedback   = errors.New("appointment feedback is invalid")
	ErrAppointmentFeedbackConflict  = errors.New("appointment feedback cannot be submitted")
	ErrPaymentProviderMisconfigured = errors.New("payment provider is not configured")
)

type AppointmentScheduleInputData struct {
	DateISO            string `json:"dateIso,omitempty"`
	RequiresSchedule   bool   `json:"requiresSchedule"`
	ScheduleDayID      string `json:"scheduleDayId,omitempty"`
	ScheduleDayLabel   string `json:"scheduleDayLabel,omitempty"`
	ScheduledTimeLabel string `json:"scheduledTimeLabel"`
	TimeSlotID         string `json:"timeSlotId,omitempty"`
	TimeSlotLabel      string `json:"timeSlotLabel,omitempty"`
}

type CreateAppointmentInputData struct {
	ProfessionalID    string                       `json:"professionalId" required:"true"`
	RequestNote       string                       `json:"requestNote"`
	RequestedMode     string                       `json:"requestedMode" required:"true"`
	ScheduleSnapshot  AppointmentScheduleInputData `json:"scheduleSnapshot"`
	ServiceID         string                       `json:"serviceId" required:"true"`
	ServiceOfferingID string                       `json:"serviceOfferingId" required:"true"`
}

type AppointmentActionInputData struct {
	CustomerSummary string `json:"customerSummary,omitempty"`
	EvidenceURL     string `json:"evidenceUrl,omitempty"`
	InternalNote    string `json:"internalNote,omitempty"`
	Reason          string `json:"reason,omitempty"`
}

type SubmitAppointmentFeedbackInputData struct {
	Rating float64 `json:"rating" required:"true"`
	Text   string  `json:"text" required:"true"`
}

type CreatePaymentRequestInputData struct {
	FailureRedirectURL string `json:"failureRedirectUrl,omitempty"`
	SuccessRedirectURL string `json:"successRedirectUrl,omitempty"`
}

type AppointmentCommandData struct {
	AppointmentID    string `json:"appointmentId"`
	CheckoutURL      string `json:"checkoutUrl,omitempty"`
	Message          string `json:"message"`
	PaymentProvider  string `json:"paymentProvider,omitempty"`
	PaymentRequestID string `json:"paymentRequestId,omitempty"`
	PaymentStatus    string `json:"paymentStatus,omitempty"`
	Status           string `json:"status"`
}

type createAppointmentInput struct {
	Body CreateAppointmentInputData
}

type createAppointmentResponse struct {
	Body struct {
		Data AppointmentCommandData `json:"data"`
	}
}

type appointmentActionPathInput struct {
	AppointmentID string `path:"appointment_id"`
	Body          AppointmentActionInputData
}

type paymentRequestPathInput struct {
	AppointmentID string `path:"appointment_id"`
	Body          CreatePaymentRequestInputData
}

type appointmentFeedbackPathInput struct {
	AppointmentID string `path:"appointment_id"`
	Body          SubmitAppointmentFeedbackInputData
}

type paymentRequestCheckoutPathInput struct {
	PaymentRequestID string `path:"payment_request_id"`
}

type appointmentCommandResponse struct {
	Body struct {
		Data AppointmentCommandData `json:"data"`
	}
}

type scopedAppointmentsResponse struct {
	Body struct {
		Data readmodel.AppointmentData `json:"data"`
	}
}

type xenditWebhookInput struct {
	XCallbackToken string `header:"x-callback-token"`
	Body           map[string]any
}

func registerTransactionalRoutes(api huma.API, service *Service) {
	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "list-customer-appointments",
		Method:      http.MethodGet,
		Path:        "/customers/appointments",
		Summary:     "List appointments for the authenticated customer",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*scopedAppointmentsResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.appointmentLookup.AppointmentsByConsumerID(ctx, authSession.Session.ConsumerID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &scopedAppointmentsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "list-professional-appointments",
		Method:      http.MethodGet,
		Path:        "/professionals/appointments",
		Summary:     "List appointments for the authenticated professional",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *struct{}) (*scopedAppointmentsResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.appointmentLookup.AppointmentsByProfessionalID(ctx, authSession.Session.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &scopedAppointmentsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "create-customer-appointment",
		Method:      http.MethodPost,
		Path:        "/customers/appointments",
		Summary:     "Create a transactional appointment request",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *createAppointmentInput) (*createAppointmentResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.CreateAppointment(ctx, authSession.Session.ConsumerID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &createAppointmentResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "approve-appointment",
		Method:      http.MethodPost,
		Path:        "/professionals/appointments/{appointment_id}/approve",
		Summary:     "Approve a requested appointment and advance it to payment",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentActionPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.ApproveAppointment(ctx, authSession.Session.ProfessionalID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "reject-appointment",
		Method:      http.MethodPost,
		Path:        "/professionals/appointments/{appointment_id}/reject",
		Summary:     "Reject a requested appointment",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentActionPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.RejectAppointment(ctx, authSession.Session.ProfessionalID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "cancel-professional-appointment",
		Method:      http.MethodPost,
		Path:        "/professionals/appointments/{appointment_id}/cancel",
		Summary:     "Cancel an active appointment as the assigned professional",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentActionPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.CancelAppointmentAsProfessional(ctx, authSession.Session.ProfessionalID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "cancel-customer-appointment",
		Method:      http.MethodPost,
		Path:        "/customers/appointments/{appointment_id}/cancel",
		Summary:     "Cancel a customer appointment",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentActionPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.CancelAppointmentAsCustomer(ctx, authSession.Session.ConsumerID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "start-appointment-service",
		Method:      http.MethodPost,
		Path:        "/professionals/appointments/{appointment_id}/start-service",
		Summary:     "Start the service for an appointment",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentActionPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.StartService(ctx, authSession.Session.ProfessionalID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "complete-appointment",
		Method:      http.MethodPost,
		Path:        "/professionals/appointments/{appointment_id}/complete",
		Summary:     "Complete an in-service appointment",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentActionPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.CompleteAppointment(ctx, authSession.Session.ProfessionalID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "submit-appointment-feedback",
		Method:      http.MethodPost,
		Path:        "/customers/appointments/{appointment_id}/feedback",
		Summary:     "Submit customer feedback for a completed appointment",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentFeedbackPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.SubmitAppointmentFeedback(
			ctx,
			authSession.Session.ConsumerID,
			authSession.Session.DisplayName,
			input.AppointmentID,
			input.Body,
		)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "create-appointment-payment-request",
		Method:      http.MethodPost,
		Path:        "/customers/appointments/{appointment_id}/payment-requests",
		Summary:     "Create a hosted payment request for an appointment",
		Tags:        []string{"Payments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *paymentRequestPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.CreatePaymentRequest(ctx, authSession.Session.ConsumerID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "complete-test-payment-request",
		Method:      http.MethodPost,
		Path:        "/customers/payments/requests/{payment_request_id}/complete-test",
		Summary:     "Complete a manual test payment request",
		Tags:        []string{"Payments"},
		Errors:      []int{http.StatusBadRequest, http.StatusConflict, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *paymentRequestCheckoutPathInput) (*appointmentCommandResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.CompleteTestPaymentRequest(ctx, authSession.Session.ConsumerID, input.PaymentRequestID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentCommandResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, huma.Operation{
		OperationID: "handle-xendit-payment-webhook",
		Method:      http.MethodPost,
		Path:        "/payments/webhooks/xendit",
		Summary:     "Handle Xendit payment webhooks",
		Tags:        []string{"Payments"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}, func(ctx context.Context, input *xenditWebhookInput) (*struct{}, error) {
		if err := service.HandleXenditWebhook(ctx, input.XCallbackToken, input.Body); err != nil {
			return nil, toAPIError(err)
		}
		return &struct{}{}, nil
	})

}

func (s *Service) CreateAppointment(
	ctx context.Context,
	consumerID string,
	input CreateAppointmentInputData,
) (AppointmentCommandData, error) {
	record, initialEvent, err := s.buildAppointmentRecord(ctx, strings.TrimSpace(consumerID), input)
	if err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.executionStore.UpsertAppointment(ctx, record); err != nil {
		return AppointmentCommandData{}, err
	}
	if err := s.executionStore.ReplaceAppointmentParticipants(ctx, record.ID, []appointmentstore.AppointmentParticipant{
		{
			AppointmentID:   record.ID,
			ParticipantKind: "customer",
			ParticipantID:   record.ConsumerID,
			DisplayName:     record.ConsumerID,
			CreatedAt:       record.CreatedAt,
		},
		{
			AppointmentID:   record.ID,
			ParticipantKind: "professional",
			ParticipantID:   record.ProfessionalID,
			DisplayName:     record.ProfessionalID,
			CreatedAt:       record.CreatedAt,
		},
	}); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.executionStore.AppendAppointmentStatusEvent(ctx, initialEvent); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.executionStore.AppendAppointmentOperationalEvent(ctx, appointmentstore.AppointmentOperationalEvent{
		ID:            nextID("opev"),
		AppointmentID: record.ID,
		EventType:     "appointment.created",
		ActorKind:     "customer",
		ActorID:       record.ConsumerID,
		Payload: map[string]any{
			"requestedMode": record.RequestedMode,
			"status":        record.Status,
		},
		CreatedAt: time.Now().UTC(),
	}); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID: record.ID,
		Message:       "Appointment created successfully.",
		Status:        record.Status,
	}, nil
}

func (s *Service) ApproveAppointment(
	ctx context.Context,
	professionalID string,
	appointmentID string,
	input AppointmentActionInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if appointment.Status != appointmentstore.StatusRequested {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	appointment.Status = appointmentstore.StatusAwaitingPayment
	appointment.UpdatedAt = time.Now().UTC()
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, appointmentstore.StatusRequested, appointmentstore.StatusAwaitingPayment, "professional", professionalID, input, "Appointment approved and waiting for payment."); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Appointment approved and moved to payment.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) RejectAppointment(
	ctx context.Context,
	professionalID string,
	appointmentID string,
	input AppointmentActionInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if appointment.Status != appointmentstore.StatusRequested {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	appointment.Status = appointmentstore.StatusRejected
	appointment.UpdatedAt = time.Now().UTC()
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, appointmentstore.StatusRequested, appointmentstore.StatusRejected, "professional", professionalID, input, "Appointment rejected by the professional."); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Appointment rejected.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) CancelAppointmentAsCustomer(
	ctx context.Context,
	consumerID string,
	appointmentID string,
	input AppointmentActionInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ConsumerID != strings.TrimSpace(consumerID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if !canCustomerCancelStatus(appointment.Status) {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	now := time.Now().UTC()
	previousStatus := appointment.Status
	appointment.Status = appointmentstore.StatusCancelled
	appointment.UpdatedAt = now
	appointment.CancellationResolution = map[string]any{
		"cancelledAt":        now.Format(time.RFC3339),
		"cancelledBy":        "customer",
		"cancellationReason": strings.TrimSpace(input.Reason),
		"financialOutcome":   customerFinancialOutcomeForStatus(previousStatus),
	}
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, previousStatus, appointmentstore.StatusCancelled, "customer", consumerID, input, "Appointment cancelled by the customer."); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Appointment cancelled.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) StartService(
	ctx context.Context,
	professionalID string,
	appointmentID string,
	input AppointmentActionInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if appointment.Status != appointmentstore.StatusConfirmed {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	now := time.Now().UTC()
	appointment.Status = appointmentstore.StatusInService
	appointment.UpdatedAt = now
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, appointmentstore.StatusConfirmed, appointmentstore.StatusInService, "professional", professionalID, input, "Service started."); err != nil {
		return AppointmentCommandData{}, err
	}

	execution, executionErr := s.readExecution(ctx, appointment.ID)
	if executionErr == nil && execution != nil {
		execution.ExecutionStatus = executionStatusServiceStarted
		execution.ServiceStartedAt = &now
		execution.UpdatedAt = now
		_, _ = s.executionStore.UpsertHomeVisitExecution(ctx, *execution)
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Service started.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) CancelAppointmentAsProfessional(
	ctx context.Context,
	professionalID string,
	appointmentID string,
	input AppointmentActionInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if !canProfessionalCancelStatus(appointment.Status) {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	now := time.Now().UTC()
	previousStatus := appointment.Status
	appointment.Status = appointmentstore.StatusCancelled
	appointment.UpdatedAt = now
	appointment.CancellationResolution = map[string]any{
		"cancelledAt":        now.Format(time.RFC3339),
		"cancelledBy":        "professional",
		"cancellationReason": strings.TrimSpace(input.Reason),
		"financialOutcome":   professionalFinancialOutcomeForAppointment(appointment),
	}
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, previousStatus, appointmentstore.StatusCancelled, "professional", professionalID, input, "Appointment cancelled by the professional."); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Appointment cancelled.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) CompleteAppointment(
	ctx context.Context,
	professionalID string,
	appointmentID string,
	input AppointmentActionInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if appointment.Status != appointmentstore.StatusInService {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	now := time.Now().UTC()
	appointment.Status = appointmentstore.StatusCompleted
	appointment.UpdatedAt = now
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, appointmentstore.StatusInService, appointmentstore.StatusCompleted, "professional", professionalID, input, "Appointment completed."); err != nil {
		return AppointmentCommandData{}, err
	}
	_, _ = s.executionStore.AppendEarningsLedgerEntry(ctx, appointmentstore.EarningsLedgerEntry{
		ID:             nextID("earn"),
		ProfessionalID: professionalID,
		AppointmentID:  appointment.ID,
		EntryType:      "appointment_completion",
		Amount:         appointment.TotalPriceAmount,
		Currency:       nonEmptyOr(appointment.Currency, s.paymentCurrency),
		Status:         "pending_payout",
		CreatedAt:      now,
	})

	execution, executionErr := s.readExecution(ctx, appointment.ID)
	if executionErr == nil && execution != nil {
		execution.ExecutionStatus = executionStatusClosed
		execution.ClosedAt = &now
		execution.UpdatedAt = now
		_, _ = s.executionStore.UpsertHomeVisitExecution(ctx, *execution)
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Appointment completed.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) SubmitAppointmentFeedback(
	ctx context.Context,
	consumerID string,
	consumerName string,
	appointmentID string,
	input SubmitAppointmentFeedbackInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ConsumerID != strings.TrimSpace(consumerID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if appointment.Status != appointmentstore.StatusCompleted {
		return AppointmentCommandData{}, ErrAppointmentFeedbackConflict
	}
	if len(appointment.CustomerFeedback) != 0 {
		return AppointmentCommandData{}, ErrAppointmentFeedbackConflict
	}

	feedback, err := normalizeAppointmentFeedback(input, consumerName, consumerID, time.Now().UTC())
	if err != nil {
		return AppointmentCommandData{}, err
	}

	appointment.CustomerFeedback = feedback
	appointment.UpdatedAt = time.Now().UTC()
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.executionStore.AppendAppointmentOperationalEvent(ctx, appointmentstore.AppointmentOperationalEvent{
		ID:            nextID("opev"),
		AppointmentID: appointment.ID,
		EventType:     "appointment.feedback_submitted",
		ActorKind:     "customer",
		ActorID:       consumerID,
		Payload: map[string]any{
			"rating": input.Rating,
		},
		CreatedAt: appointment.UpdatedAt,
	}); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID: appointment.ID,
		Message:       "Appointment feedback submitted.",
		Status:        appointment.Status,
	}, nil
}

func (s *Service) CreatePaymentRequest(
	ctx context.Context,
	consumerID string,
	appointmentID string,
	input CreatePaymentRequestInputData,
) (AppointmentCommandData, error) {
	appointment, err := s.executionStore.AppointmentByID(ctx, appointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ConsumerID != strings.TrimSpace(consumerID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}
	if appointment.Status != appointmentstore.StatusAwaitingPayment {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	if latest, latestErr := s.executionStore.LatestPaymentRequestByAppointmentID(ctx, appointment.ID); latestErr == nil && latest.Status == "pending" {
		return AppointmentCommandData{
			AppointmentID:    appointment.ID,
			CheckoutURL:      latest.CheckoutURL,
			Message:          "Active payment request already exists.",
			PaymentProvider:  latest.Provider,
			PaymentRequestID: latest.ID,
			PaymentStatus:    latest.Status,
			Status:           appointment.Status,
		}, nil
	}

	paymentRequest, err := s.newPaymentRequest(ctx, appointment, input)
	if err != nil {
		return AppointmentCommandData{}, err
	}
	if _, err := s.executionStore.UpsertPaymentRequest(ctx, paymentRequest); err != nil {
		return AppointmentCommandData{}, err
	}
	appointment.LatestPaymentRequestID = paymentRequest.ID
	appointment.UpdatedAt = time.Now().UTC()
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID:    appointment.ID,
		CheckoutURL:      paymentRequest.CheckoutURL,
		Message:          "Payment request created.",
		PaymentProvider:  paymentRequest.Provider,
		PaymentRequestID: paymentRequest.ID,
		PaymentStatus:    paymentRequest.Status,
		Status:           appointment.Status,
	}, nil
}

func (s *Service) CompleteTestPaymentRequest(
	ctx context.Context,
	consumerID string,
	paymentRequestID string,
) (AppointmentCommandData, error) {
	paymentRequest, err := s.executionStore.PaymentRequestByID(ctx, paymentRequestID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if paymentRequest.Provider != "manual_test" {
		return AppointmentCommandData{}, ErrAppointmentConflict
	}

	appointment, err := s.executionStore.AppointmentByID(ctx, paymentRequest.AppointmentID)
	if err != nil {
		return AppointmentCommandData{}, mapAppointmentStoreError(err)
	}
	if appointment.ConsumerID != strings.TrimSpace(consumerID) {
		return AppointmentCommandData{}, ErrAppointmentScopeMismatch
	}

	if err := s.markPaymentSettled(ctx, appointment, paymentRequest, "manual_test", paymentRequest.ID, "settled"); err != nil {
		return AppointmentCommandData{}, err
	}

	return AppointmentCommandData{
		AppointmentID:    appointment.ID,
		Message:          "Payment completed successfully.",
		PaymentProvider:  paymentRequest.Provider,
		PaymentRequestID: paymentRequest.ID,
		PaymentStatus:    "paid",
		Status:           appointmentstore.StatusConfirmed,
	}, nil
}

func (s *Service) HandleXenditWebhook(ctx context.Context, callbackToken string, payload map[string]any) error {
	if strings.TrimSpace(s.paymentProvider) != "xendit" {
		return nil
	}

	if strings.TrimSpace(s.xenditWebhookToken) == "" {
		return ErrPaymentProviderMisconfigured
	}
	if strings.TrimSpace(callbackToken) != strings.TrimSpace(s.xenditWebhookToken) {
		return web.NewAPIError(http.StatusUnauthorized, "invalid_payment_webhook_token", "payment webhook token is invalid")
	}

	externalID, _ := payload["external_id"].(string)
	if strings.TrimSpace(externalID) == "" {
		return ErrInvalidAppointmentInput
	}

	paymentRequest, err := s.executionStore.PaymentRequestByID(ctx, externalID)
	if err != nil {
		return mapAppointmentStoreError(err)
	}
	appointment, err := s.executionStore.AppointmentByID(ctx, paymentRequest.AppointmentID)
	if err != nil {
		return mapAppointmentStoreError(err)
	}

	status, _ := payload["status"].(string)
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "PAID", "SETTLED":
		return s.markPaymentSettled(ctx, appointment, paymentRequest, "xendit", stringValue(payload["id"]), strings.ToLower(status))
	case "EXPIRED":
		now := time.Now().UTC()
		paymentRequest.Status = "expired"
		paymentRequest.UpdatedAt = now
		if _, err := s.executionStore.UpsertPaymentRequest(ctx, paymentRequest); err != nil {
			return err
		}
		if appointment.Status == appointmentstore.StatusAwaitingPayment {
			appointment.Status = appointmentstore.StatusExpired
			appointment.UpdatedAt = now
			if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
				return err
			}
			if _, err := s.appendStatusTransition(ctx, appointment, appointmentstore.StatusAwaitingPayment, appointmentstore.StatusExpired, "system", "xendit", AppointmentActionInputData{
				CustomerSummary: "Payment window expired before settlement.",
			}, "Payment link expired."); err != nil {
				return err
			}
		}
		return nil
	default:
		return nil
	}
}

func (s *Service) buildAppointmentRecord(
	ctx context.Context,
	consumerID string,
	input CreateAppointmentInputData,
) (appointmentstore.AppointmentRecord, appointmentstore.AppointmentStatusEvent, error) {
	if s.catalogLookup == nil || s.executionStore == nil {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrServiceUnavailable
	}
	if consumerID == "" ||
		strings.TrimSpace(input.ProfessionalID) == "" ||
		strings.TrimSpace(input.ServiceID) == "" ||
		strings.TrimSpace(input.ServiceOfferingID) == "" ||
		!isAllowedRequestedMode(input.RequestedMode) {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrInvalidAppointmentInput
	}

	catalog, err := s.catalogLookup.Catalog(ctx)
	if err != nil {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, err
	}

	var (
		professional      readmodel.Professional
		foundProfessional bool
	)
	for _, candidate := range catalog.Professionals {
		if candidate.ID == strings.TrimSpace(input.ProfessionalID) {
			professional = candidate
			foundProfessional = true
			break
		}
	}
	if !foundProfessional {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrAppointmentNotFound
	}

	var (
		service      readmodel.GlobalService
		foundService bool
	)
	for _, candidate := range catalog.Services {
		if candidate.ID == strings.TrimSpace(input.ServiceID) {
			service = candidate
			foundService = true
			break
		}
	}
	if !foundService {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrAppointmentNotFound
	}

	var offering readmodel.ProfessionalService
	foundOffering := false
	for _, candidate := range professional.Services {
		if candidate.ID == strings.TrimSpace(input.ServiceOfferingID) || (candidate.ServiceID == service.ID && candidate.ID == "") {
			offering = candidate
			foundOffering = true
			if candidate.ID == strings.TrimSpace(input.ServiceOfferingID) {
				break
			}
		}
	}
	if !foundOffering {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrInvalidAppointmentInput
	}
	if !serviceSupportsRequestedMode(offering, input.RequestedMode) {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrInvalidAppointmentInput
	}

	areaID := ""
	if professional.PracticeLocation != nil {
		areaID = professional.PracticeLocation.AreaID
	}
	if input.RequestedMode == homeVisitRequestedMode && len(professional.Coverage.AreaIDs) > 0 {
		areaID = professional.Coverage.AreaIDs[0]
	}

	requestedAt := time.Now().UTC()
	initialStatus := appointmentstore.StatusRequested
	if strings.TrimSpace(offering.BookingFlow) == "instant" {
		initialStatus = appointmentstore.StatusAwaitingPayment
	}
	appointmentID := nextID("apt")
	serviceSnapshot := map[string]any{
		"bookingFlow":       nonEmptyOr(offering.BookingFlow, "request"),
		"categoryId":        service.CategoryID,
		"coverImage":        service.CoverImage,
		"defaultMode":       nonEmptyOr(offering.DefaultMode, service.DefaultMode),
		"description":       service.Description,
		"durationLabel":     offering.Duration,
		"highlights":        service.Highlights,
		"image":             service.Image,
		"name":              service.Name,
		"priceAmount":       priceAmountFromLabel(offering.Price),
		"priceLabel":        offering.Price,
		"serviceId":         service.ID,
		"serviceModes":      map[string]any{"online": offering.ServiceModes.Online, "homeVisit": offering.ServiceModes.HomeVisit, "onsite": offering.ServiceModes.Onsite},
		"serviceOfferingId": nonEmptyOr(offering.ID, input.ServiceOfferingID),
		"shortDescription":  service.ShortDescription,
		"slug":              service.Slug,
		"summary":           nonEmptyOr(offering.Summary, service.ShortDescription),
		"tags":              service.Tags,
	}
	scheduleSnapshot := map[string]any{
		"dateIso":            strings.TrimSpace(input.ScheduleSnapshot.DateISO),
		"requiresSchedule":   input.ScheduleSnapshot.RequiresSchedule,
		"scheduleDayId":      strings.TrimSpace(input.ScheduleSnapshot.ScheduleDayID),
		"scheduleDayLabel":   strings.TrimSpace(input.ScheduleSnapshot.ScheduleDayLabel),
		"scheduledTimeLabel": strings.TrimSpace(input.ScheduleSnapshot.ScheduledTimeLabel),
		"timeSlotId":         strings.TrimSpace(input.ScheduleSnapshot.TimeSlotID),
		"timeSlotLabel":      strings.TrimSpace(input.ScheduleSnapshot.TimeSlotLabel),
	}
	if input.RequestedMode == "online" && scheduleSnapshot["scheduledTimeLabel"] == "" {
		scheduleSnapshot["scheduledTimeLabel"] = "Waiting for session confirmation"
	}
	if (input.RequestedMode == "home_visit" || input.RequestedMode == "onsite") && scheduleSnapshot["scheduledTimeLabel"] == "" {
		return appointmentstore.AppointmentRecord{}, appointmentstore.AppointmentStatusEvent{}, ErrInvalidAppointmentInput
	}

	policy := readmodel.ProfessionalCancellationPolicy{
		CustomerPaidCancelCutoffHours: 6,
		ProfessionalCancelOutcome:     "full_refund",
		BeforeCutoffOutcome:           "full_refund",
		AfterCutoffOutcome:            "manual_refund_required",
	}
	if professional.CancellationPoliciesByMode != nil {
		if configured, ok := professional.CancellationPoliciesByMode[input.RequestedMode]; ok {
			policy = configured
		}
	}

	record := appointmentstore.AppointmentRecord{
		ID:                appointmentID,
		ConsumerID:        consumerID,
		ProfessionalID:    professional.ID,
		ServiceID:         service.ID,
		ServiceOfferingID: nonEmptyOr(offering.ID, input.ServiceOfferingID),
		AreaID:            areaID,
		BookingFlow:       nonEmptyOr(offering.BookingFlow, "request"),
		RequestedMode:     input.RequestedMode,
		RequestNote:       strings.TrimSpace(input.RequestNote),
		RequestedAt:       requestedAt,
		Status:            initialStatus,
		TotalPriceAmount:  priceAmountFromLabel(offering.Price),
		TotalPriceLabel:   offering.Price,
		Currency:          nonEmptyOr(s.paymentCurrency, "IDR"),
		ServiceSnapshot:   serviceSnapshot,
		ScheduleSnapshot:  scheduleSnapshot,
		PricingSnapshot:   map[string]any{"amount": priceAmountFromLabel(offering.Price), "currency": nonEmptyOr(s.paymentCurrency, "IDR"), "label": offering.Price},
		CancellationPolicySnapshot: map[string]any{
			"customerPaidCancelCutoffHours": policy.CustomerPaidCancelCutoffHours,
			"professionalCancelOutcome":     policy.ProfessionalCancelOutcome,
			"beforeCutoffOutcome":           policy.BeforeCutoffOutcome,
			"afterCutoffOutcome":            policy.AfterCutoffOutcome,
		},
		CreatedAt: requestedAt,
		UpdatedAt: requestedAt,
	}
	event := appointmentstore.AppointmentStatusEvent{
		ID:              nextID("aptev"),
		AppointmentID:   appointmentID,
		ToStatus:        initialStatus,
		ActorKind:       "customer",
		ActorID:         consumerID,
		ActorName:       consumerID,
		CustomerSummary: nonEmptyOr(record.RequestNote, fmt.Sprintf("New %s request for %s.", input.RequestedMode, service.Name)),
		InternalNote:    "Appointment created from customer checkout flow.",
		CreatedAt:       requestedAt,
		CreatedAtLabel:  requestedAt.Format(time.RFC3339),
	}
	if initialStatus == appointmentstore.StatusAwaitingPayment {
		event.FromStatus = appointmentstore.StatusRequested
	}
	return record, event, nil
}

func (s *Service) appendStatusTransition(
	ctx context.Context,
	appointment appointmentstore.AppointmentRecord,
	fromStatus string,
	toStatus string,
	actorKind string,
	actorID string,
	input AppointmentActionInputData,
	fallbackSummary string,
) (appointmentstore.AppointmentStatusEvent, error) {
	event := appointmentstore.AppointmentStatusEvent{
		ID:              nextID("aptev"),
		AppointmentID:   appointment.ID,
		FromStatus:      fromStatus,
		ToStatus:        toStatus,
		ActorKind:       actorKind,
		ActorID:         actorID,
		ActorName:       actorID,
		CustomerSummary: nonEmptyOr(strings.TrimSpace(input.CustomerSummary), fallbackSummary),
		InternalNote:    strings.TrimSpace(input.InternalNote),
		EvidenceURL:     strings.TrimSpace(input.EvidenceURL),
		CreatedAt:       appointment.UpdatedAt,
		CreatedAtLabel:  appointment.UpdatedAt.Format(time.RFC3339),
	}
	return s.executionStore.AppendAppointmentStatusEvent(ctx, event)
}

func normalizeAppointmentFeedback(
	input SubmitAppointmentFeedbackInputData,
	consumerName string,
	consumerID string,
	submittedAt time.Time,
) (map[string]any, error) {
	text := strings.TrimSpace(input.Text)
	if input.Rating <= 0 || input.Rating > 5 || text == "" {
		return nil, ErrInvalidAppointmentFeedback
	}

	author := strings.TrimSpace(consumerName)
	if author == "" {
		author = strings.TrimSpace(consumerID)
	}
	if author == "" {
		author = "Pelanggan BidanApp"
	}

	return map[string]any{
		"author":    author,
		"dateLabel": submittedAt.Format("02 Jan 2006"),
		"image":     "",
		"quote":     text,
		"rating":    input.Rating,
		"role":      "Klien terverifikasi",
	}, nil
}

func canCustomerCancelStatus(status string) bool {
	switch status {
	case appointmentstore.StatusRequested, appointmentstore.StatusAwaitingPayment, appointmentstore.StatusConfirmed:
		return true
	default:
		return false
	}
}

func canProfessionalCancelStatus(status string) bool {
	switch status {
	case appointmentstore.StatusAwaitingPayment, appointmentstore.StatusConfirmed:
		return true
	default:
		return false
	}
}

func customerFinancialOutcomeForStatus(status string) string {
	switch status {
	case appointmentstore.StatusAwaitingPayment:
		return "void_pending_payment"
	case appointmentstore.StatusConfirmed:
		return "manual_refund_required"
	default:
		return "none"
	}
}

func professionalFinancialOutcomeForAppointment(appointment appointmentstore.AppointmentRecord) string {
	if outcome, ok := appointment.CancellationPolicySnapshot["professionalCancelOutcome"].(string); ok && strings.TrimSpace(outcome) != "" {
		return strings.TrimSpace(outcome)
	}
	return "full_refund"
}

func isAllowedRequestedMode(value string) bool {
	switch strings.TrimSpace(value) {
	case "online", "home_visit", "onsite":
		return true
	default:
		return false
	}
}

func priceAmountFromLabel(value string) int {
	digitsOnly := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, value)
	if digitsOnly == "" {
		return 0
	}

	amount := 0
	for _, digit := range digitsOnly {
		amount = (amount * 10) + int(digit-'0')
	}
	return amount
}

func stringValue(value any) string {
	typed, _ := value.(string)
	return typed
}

func serviceSupportsRequestedMode(service readmodel.ProfessionalService, requestedMode string) bool {
	switch requestedMode {
	case "online":
		return service.ServiceModes.Online
	case "home_visit":
		return service.ServiceModes.HomeVisit
	case "onsite":
		return service.ServiceModes.Onsite
	default:
		return false
	}
}

func nonEmptyOr(value string, fallback string) string {
	if strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return fallback
}

func nextID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UTC().UnixNano())
}

func mapAppointmentStoreError(err error) error {
	if errors.Is(err, appointmentstore.ErrNotFound) {
		return ErrAppointmentNotFound
	}
	return err
}

func withAdminSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{adminauth.SecuritySchemeName: {}},
	}
	return operation
}
