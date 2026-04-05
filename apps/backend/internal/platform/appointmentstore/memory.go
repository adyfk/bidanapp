package appointmentstore

import (
	"context"
	"sync"
	"time"
)

type MemoryStore struct {
	mu            sync.RWMutex
	appointments  map[string]AppointmentRecord
	statusHistory map[string][]AppointmentStatusEvent
	participants  map[string][]AppointmentParticipant
	changes       map[string][]AppointmentChangeRequest
	events        map[string][]AppointmentOperationalEvent
	payments      map[string]PaymentRequest
	paymentEvents map[string][]PaymentEvent
	refunds       map[string]RefundRequest
	refundEvents  map[string][]RefundEvent
	earnings      map[string][]EarningsLedgerEntry
	payouts       map[string]PayoutBatch
	executions    map[string]HomeVisitExecution
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		appointments:  map[string]AppointmentRecord{},
		statusHistory: map[string][]AppointmentStatusEvent{},
		participants:  map[string][]AppointmentParticipant{},
		changes:       map[string][]AppointmentChangeRequest{},
		events:        map[string][]AppointmentOperationalEvent{},
		payments:      map[string]PaymentRequest{},
		paymentEvents: map[string][]PaymentEvent{},
		refunds:       map[string]RefundRequest{},
		refundEvents:  map[string][]RefundEvent{},
		earnings:      map[string][]EarningsLedgerEntry{},
		payouts:       map[string]PayoutBatch{},
		executions:    map[string]HomeVisitExecution{},
	}
}

func (s *MemoryStore) ListAppointments(_ context.Context) ([]AppointmentRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	appointments := make([]AppointmentRecord, 0, len(s.appointments))
	for _, appointment := range s.appointments {
		appointments = append(appointments, cloneAppointmentRecord(appointment))
	}
	SortAppointments(appointments)
	return appointments, nil
}

func (s *MemoryStore) AppointmentsByConsumerID(_ context.Context, consumerID string) ([]AppointmentRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	appointments := make([]AppointmentRecord, 0)
	for _, appointment := range s.appointments {
		if appointment.ConsumerID == consumerID {
			appointments = append(appointments, cloneAppointmentRecord(appointment))
		}
	}
	SortAppointments(appointments)
	return appointments, nil
}

func (s *MemoryStore) AppointmentsByProfessionalID(_ context.Context, professionalID string) ([]AppointmentRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	appointments := make([]AppointmentRecord, 0)
	for _, appointment := range s.appointments {
		if appointment.ProfessionalID == professionalID {
			appointments = append(appointments, cloneAppointmentRecord(appointment))
		}
	}
	SortAppointments(appointments)
	return appointments, nil
}

func (s *MemoryStore) AppointmentByID(_ context.Context, appointmentID string) (AppointmentRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	appointment, ok := s.appointments[appointmentID]
	if !ok {
		return AppointmentRecord{}, ErrNotFound
	}
	return cloneAppointmentRecord(appointment), nil
}

func (s *MemoryStore) UpsertAppointment(_ context.Context, appointment AppointmentRecord) (AppointmentRecord, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	existing, ok := s.appointments[appointment.ID]
	if ok {
		appointment.CreatedAt = existing.CreatedAt
	} else if appointment.CreatedAt.IsZero() {
		appointment.CreatedAt = now
	}
	if appointment.UpdatedAt.IsZero() {
		appointment.UpdatedAt = now
	}

	s.appointments[appointment.ID] = cloneAppointmentRecord(appointment)
	return cloneAppointmentRecord(appointment), nil
}

func (s *MemoryStore) ListAppointmentStatusHistory(_ context.Context) (map[string][]AppointmentStatusEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make(map[string][]AppointmentStatusEvent, len(s.statusHistory))
	for appointmentID, events := range s.statusHistory {
		result[appointmentID] = cloneStatusEvents(events)
	}
	return result, nil
}

func (s *MemoryStore) AppointmentStatusHistoryByAppointmentID(
	_ context.Context,
	appointmentID string,
) ([]AppointmentStatusEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return cloneStatusEvents(s.statusHistory[appointmentID]), nil
}

func (s *MemoryStore) AppendAppointmentStatusEvent(
	_ context.Context,
	event AppointmentStatusEvent,
) (AppointmentStatusEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	s.statusHistory[event.AppointmentID] = append(s.statusHistory[event.AppointmentID], cloneStatusEvent(event))
	return cloneStatusEvent(event), nil
}

func (s *MemoryStore) ReplaceAppointmentParticipants(
	_ context.Context,
	appointmentID string,
	participants []AppointmentParticipant,
) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	nextParticipants := make([]AppointmentParticipant, 0, len(participants))
	for _, participant := range participants {
		if participant.CreatedAt.IsZero() {
			participant.CreatedAt = time.Now().UTC()
		}
		nextParticipants = append(nextParticipants, participant)
	}
	s.participants[appointmentID] = nextParticipants
	return nil
}

func (s *MemoryStore) AppendAppointmentOperationalEvent(
	_ context.Context,
	event AppointmentOperationalEvent,
) (AppointmentOperationalEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	event.Payload = CloneMap(event.Payload)
	s.events[event.AppointmentID] = append(s.events[event.AppointmentID], event)
	return cloneOperationalEvent(event), nil
}

func (s *MemoryStore) CreateAppointmentChangeRequest(
	_ context.Context,
	changeRequest AppointmentChangeRequest,
) (AppointmentChangeRequest, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if changeRequest.CreatedAt.IsZero() {
		changeRequest.CreatedAt = time.Now().UTC()
	}
	changeRequest.RequestedScheduleSnapshot = CloneMap(changeRequest.RequestedScheduleSnapshot)
	s.changes[changeRequest.AppointmentID] = append(s.changes[changeRequest.AppointmentID], changeRequest)
	return cloneChangeRequest(changeRequest), nil
}

func (s *MemoryStore) LatestPaymentRequestByAppointmentID(
	_ context.Context,
	appointmentID string,
) (PaymentRequest, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var latest *PaymentRequest
	for _, payment := range s.payments {
		if payment.AppointmentID != appointmentID {
			continue
		}
		candidate := clonePaymentRequest(payment)
		if latest == nil || candidate.CreatedAt.After(latest.CreatedAt) {
			latest = &candidate
		}
	}
	if latest == nil {
		return PaymentRequest{}, ErrNotFound
	}
	return *latest, nil
}

func (s *MemoryStore) PaymentRequestByID(_ context.Context, paymentRequestID string) (PaymentRequest, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	paymentRequest, ok := s.payments[paymentRequestID]
	if !ok {
		return PaymentRequest{}, ErrNotFound
	}

	return clonePaymentRequest(paymentRequest), nil
}

func (s *MemoryStore) UpsertPaymentRequest(_ context.Context, paymentRequest PaymentRequest) (PaymentRequest, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	existing, ok := s.payments[paymentRequest.ID]
	if ok {
		paymentRequest.CreatedAt = existing.CreatedAt
	} else if paymentRequest.CreatedAt.IsZero() {
		paymentRequest.CreatedAt = now
	}
	if paymentRequest.UpdatedAt.IsZero() {
		paymentRequest.UpdatedAt = now
	}
	paymentRequest.Metadata = CloneMap(paymentRequest.Metadata)
	s.payments[paymentRequest.ID] = clonePaymentRequest(paymentRequest)
	return clonePaymentRequest(paymentRequest), nil
}

func (s *MemoryStore) AppendPaymentEvent(_ context.Context, event PaymentEvent) (PaymentEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if event.ReceivedAt.IsZero() {
		event.ReceivedAt = time.Now().UTC()
	}
	event.Payload = CloneMap(event.Payload)
	s.paymentEvents[event.PaymentRequestID] = append(s.paymentEvents[event.PaymentRequestID], event)
	return clonePaymentEvent(event), nil
}

func (s *MemoryStore) UpsertRefundRequest(_ context.Context, refundRequest RefundRequest) (RefundRequest, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	existing, ok := s.refunds[refundRequest.ID]
	if ok {
		refundRequest.CreatedAt = existing.CreatedAt
	} else if refundRequest.CreatedAt.IsZero() {
		refundRequest.CreatedAt = now
	}
	if refundRequest.UpdatedAt.IsZero() {
		refundRequest.UpdatedAt = now
	}
	s.refunds[refundRequest.ID] = refundRequest
	return refundRequest, nil
}

func (s *MemoryStore) AppendRefundEvent(_ context.Context, event RefundEvent) (RefundEvent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if event.ReceivedAt.IsZero() {
		event.ReceivedAt = time.Now().UTC()
	}
	event.Payload = CloneMap(event.Payload)
	s.refundEvents[event.RefundRequestID] = append(s.refundEvents[event.RefundRequestID], event)
	return cloneRefundEvent(event), nil
}

func (s *MemoryStore) AppendEarningsLedgerEntry(
	_ context.Context,
	entry EarningsLedgerEntry,
) (EarningsLedgerEntry, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now().UTC()
	}
	s.earnings[entry.ProfessionalID] = append(s.earnings[entry.ProfessionalID], entry)
	return entry, nil
}

func (s *MemoryStore) UpsertPayoutBatch(_ context.Context, payoutBatch PayoutBatch) (PayoutBatch, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	existing, ok := s.payouts[payoutBatch.ID]
	if ok {
		payoutBatch.CreatedAt = existing.CreatedAt
	} else if payoutBatch.CreatedAt.IsZero() {
		payoutBatch.CreatedAt = now
	}
	if payoutBatch.UpdatedAt.IsZero() {
		payoutBatch.UpdatedAt = now
	}
	s.payouts[payoutBatch.ID] = payoutBatch
	return payoutBatch, nil
}

func (s *MemoryStore) HomeVisitExecutionByAppointmentID(_ context.Context, appointmentID string) (HomeVisitExecution, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	execution, ok := s.executions[appointmentID]
	if !ok {
		return HomeVisitExecution{}, ErrNotFound
	}

	return cloneExecution(execution), nil
}

func (s *MemoryStore) UpsertHomeVisitExecution(_ context.Context, execution HomeVisitExecution) (HomeVisitExecution, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	existing, ok := s.executions[execution.AppointmentID]
	if ok {
		execution.CreatedAt = existing.CreatedAt
	} else if execution.CreatedAt.IsZero() {
		execution.CreatedAt = now
	}
	if execution.UpdatedAt.IsZero() {
		execution.UpdatedAt = now
	}

	s.executions[execution.AppointmentID] = cloneExecution(execution)
	return cloneExecution(execution), nil
}

func cloneExecution(execution HomeVisitExecution) HomeVisitExecution {
	cloned := execution
	cloned.DepartureOriginLat = cloneFloat(execution.DepartureOriginLat)
	cloned.DepartureOriginLng = cloneFloat(execution.DepartureOriginLng)
	cloned.DestinationLat = cloneFloat(execution.DestinationLat)
	cloned.DestinationLng = cloneFloat(execution.DestinationLng)
	cloned.DistanceKMHint = cloneFloat(execution.DistanceKMHint)
	cloned.ETAMinutesHint = cloneInt(execution.ETAMinutesHint)
	cloned.DepartedAt = cloneTime(execution.DepartedAt)
	cloned.ServiceStartedAt = cloneTime(execution.ServiceStartedAt)
	cloned.ClosedAt = cloneTime(execution.ClosedAt)
	cloned.LastComputedAt = cloneTime(execution.LastComputedAt)
	cloned.DepartureNotificationSentAt = cloneTime(execution.DepartureNotificationSentAt)
	return cloned
}

func cloneAppointmentRecord(appointment AppointmentRecord) AppointmentRecord {
	cloned := appointment
	cloned.ServiceSnapshot = CloneMap(appointment.ServiceSnapshot)
	cloned.ScheduleSnapshot = CloneMap(appointment.ScheduleSnapshot)
	cloned.PricingSnapshot = CloneMap(appointment.PricingSnapshot)
	cloned.CancellationPolicySnapshot = CloneMap(appointment.CancellationPolicySnapshot)
	cloned.CancellationResolution = CloneMap(appointment.CancellationResolution)
	cloned.RecentActivity = CloneMap(appointment.RecentActivity)
	cloned.CustomerFeedback = CloneMap(appointment.CustomerFeedback)
	return cloned
}

func cloneStatusEvents(events []AppointmentStatusEvent) []AppointmentStatusEvent {
	if len(events) == 0 {
		return []AppointmentStatusEvent{}
	}

	cloned := make([]AppointmentStatusEvent, 0, len(events))
	for _, event := range events {
		cloned = append(cloned, cloneStatusEvent(event))
	}
	return cloned
}

func cloneStatusEvent(event AppointmentStatusEvent) AppointmentStatusEvent {
	return event
}

func cloneChangeRequest(changeRequest AppointmentChangeRequest) AppointmentChangeRequest {
	cloned := changeRequest
	cloned.RequestedScheduleSnapshot = CloneMap(changeRequest.RequestedScheduleSnapshot)
	cloned.ResolvedAt = cloneTime(changeRequest.ResolvedAt)
	return cloned
}

func cloneOperationalEvent(event AppointmentOperationalEvent) AppointmentOperationalEvent {
	cloned := event
	cloned.Payload = CloneMap(event.Payload)
	return cloned
}

func clonePaymentRequest(paymentRequest PaymentRequest) PaymentRequest {
	cloned := paymentRequest
	cloned.Metadata = CloneMap(paymentRequest.Metadata)
	cloned.ExpiresAt = cloneTime(paymentRequest.ExpiresAt)
	cloned.PaidAt = cloneTime(paymentRequest.PaidAt)
	return cloned
}

func clonePaymentEvent(event PaymentEvent) PaymentEvent {
	cloned := event
	cloned.Payload = CloneMap(event.Payload)
	return cloned
}

func cloneRefundEvent(event RefundEvent) RefundEvent {
	cloned := event
	cloned.Payload = CloneMap(event.Payload)
	return cloned
}

func cloneFloat(value *float64) *float64 {
	if value == nil {
		return nil
	}
	cloned := *value
	return &cloned
}

func cloneInt(value *int) *int {
	if value == nil {
		return nil
	}
	cloned := *value
	return &cloned
}

func cloneTime(value *time.Time) *time.Time {
	if value == nil {
		return nil
	}
	cloned := *value
	return &cloned
}
