package appointments

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/appointmentstore"
)

type xenditInvoiceResponse struct {
	ExternalID string `json:"external_id"`
	ID         string `json:"id"`
	InvoiceURL string `json:"invoice_url"`
	Status     string `json:"status"`
}

func (s *Service) newPaymentRequest(
	ctx context.Context,
	appointment appointmentstore.AppointmentRecord,
	input CreatePaymentRequestInputData,
) (appointmentstore.PaymentRequest, error) {
	if s.executionStore == nil {
		return appointmentstore.PaymentRequest{}, ErrServiceUnavailable
	}

	now := time.Now().UTC()
	paymentRequestID := nextID("payreq")
	provider := strings.TrimSpace(s.paymentProvider)
	if provider == "" {
		provider = "manual_test"
	}

	paymentRequest := appointmentstore.PaymentRequest{
		ID:            paymentRequestID,
		AppointmentID: appointment.ID,
		Provider:      provider,
		ExternalID:    paymentRequestID,
		Status:        "pending",
		Currency:      nonEmptyOr(appointment.Currency, nonEmptyOr(s.paymentCurrency, "IDR")),
		Amount:        appointment.TotalPriceAmount,
		Metadata: map[string]any{
			"failureRedirectUrl": strings.TrimSpace(input.FailureRedirectURL),
			"successRedirectUrl": strings.TrimSpace(input.SuccessRedirectURL),
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	switch provider {
	case "manual_test":
		paymentRequest.CheckoutURL = ""
		paymentRequest.PaymentMethod = "manual_test"
		expiresAt := now.Add(24 * time.Hour)
		paymentRequest.ExpiresAt = &expiresAt
		return paymentRequest, nil
	case "xendit":
		if strings.TrimSpace(s.xenditSecretKey) == "" {
			return appointmentstore.PaymentRequest{}, ErrPaymentProviderMisconfigured
		}
		xenditPaymentRequest, err := s.createXenditInvoice(ctx, appointment, paymentRequest)
		if err != nil {
			return appointmentstore.PaymentRequest{}, err
		}
		return xenditPaymentRequest, nil
	default:
		return appointmentstore.PaymentRequest{}, ErrPaymentProviderMisconfigured
	}
}

func (s *Service) markPaymentSettled(
	ctx context.Context,
	appointment appointmentstore.AppointmentRecord,
	paymentRequest appointmentstore.PaymentRequest,
	provider string,
	externalEventID string,
	paymentStatus string,
) error {
	now := time.Now().UTC()

	paymentRequest.Status = "paid"
	paymentRequest.PaidAt = &now
	paymentRequest.UpdatedAt = now
	if _, err := s.executionStore.UpsertPaymentRequest(ctx, paymentRequest); err != nil {
		return err
	}
	if _, err := s.executionStore.AppendPaymentEvent(ctx, appointmentstore.PaymentEvent{
		ID:               nextID("pyev"),
		PaymentRequestID: paymentRequest.ID,
		Provider:         provider,
		EventType:        "payment.settled",
		ExternalEventID:  nonEmptyOr(strings.TrimSpace(externalEventID), paymentRequest.ID),
		PaymentStatus:    nonEmptyOr(strings.TrimSpace(paymentStatus), "paid"),
		Payload: map[string]any{
			"appointmentId": appointment.ID,
		},
		ReceivedAt: now,
	}); err != nil {
		return err
	}

	if appointment.Status != appointmentstore.StatusAwaitingPayment {
		return nil
	}

	appointment.LatestPaymentRequestID = paymentRequest.ID
	appointment.Status = appointmentstore.StatusConfirmed
	appointment.UpdatedAt = now
	if _, err := s.executionStore.UpsertAppointment(ctx, appointment); err != nil {
		return err
	}
	if _, err := s.appendStatusTransition(ctx, appointment, appointmentstore.StatusAwaitingPayment, appointmentstore.StatusConfirmed, "system", provider, AppointmentActionInputData{
		CustomerSummary: "Payment settled and appointment confirmed.",
		InternalNote:    "Appointment advanced to confirmed after payment settlement.",
	}, "Payment settled and appointment confirmed."); err != nil {
		return err
	}
	return nil
}

func (s *Service) createXenditInvoice(
	ctx context.Context,
	appointment appointmentstore.AppointmentRecord,
	paymentRequest appointmentstore.PaymentRequest,
) (appointmentstore.PaymentRequest, error) {
	body := map[string]any{
		"amount":      paymentRequest.Amount,
		"currency":    paymentRequest.Currency,
		"description": fmt.Sprintf("Appointment %s payment", appointment.ID),
		"external_id": paymentRequest.ExternalID,
	}
	if s.frontendOrigin != "" {
		body["success_redirect_url"] = s.frontendOrigin + "/id/activity/" + appointment.ID
		body["failure_redirect_url"] = s.frontendOrigin + "/id/activity/" + appointment.ID
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return appointmentstore.PaymentRequest{}, err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.xendit.co/v2/invoices", bytes.NewReader(payload))
	if err != nil {
		return appointmentstore.PaymentRequest{}, err
	}
	request.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(s.xenditSecretKey+":")))
	request.Header.Set("Content-Type", "application/json")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return appointmentstore.PaymentRequest{}, err
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
		return appointmentstore.PaymentRequest{}, fmt.Errorf("xendit create invoice failed: status=%d body=%s", response.StatusCode, strings.TrimSpace(string(body)))
	}

	var invoice xenditInvoiceResponse
	if err := json.NewDecoder(response.Body).Decode(&invoice); err != nil {
		return appointmentstore.PaymentRequest{}, err
	}

	paymentRequest.CheckoutURL = strings.TrimSpace(invoice.InvoiceURL)
	paymentRequest.ProviderReferenceID = strings.TrimSpace(invoice.ID)
	paymentRequest.Status = strings.ToLower(nonEmptyOr(strings.TrimSpace(invoice.Status), "pending"))
	paymentRequest.PaymentMethod = "xendit_invoice"
	return paymentRequest, nil
}
