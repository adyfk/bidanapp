package appointmentstore

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

func (s *PostgresStore) ListAppointments(ctx context.Context) ([]AppointmentRecord, error) {
	rows, err := s.queryAppointments(ctx, `
		SELECT
			id,
			consumer_id,
			professional_id,
			service_id,
			service_offering_id,
			area_id,
			booking_flow,
			requested_mode,
			request_note,
			requested_at,
			status,
			total_price_amount,
			total_price_label,
			currency,
			latest_payment_request_id,
			service_snapshot,
			schedule_snapshot,
			pricing_snapshot,
			cancellation_policy_snapshot,
			cancellation_resolution,
			recent_activity,
			customer_feedback,
			created_at,
			updated_at
		FROM appointments
		ORDER BY requested_at DESC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return collectAppointments(rows)
}

func (s *PostgresStore) AppointmentsByConsumerID(ctx context.Context, consumerID string) ([]AppointmentRecord, error) {
	rows, err := s.queryAppointments(ctx, `
		SELECT
			id,
			consumer_id,
			professional_id,
			service_id,
			service_offering_id,
			area_id,
			booking_flow,
			requested_mode,
			request_note,
			requested_at,
			status,
			total_price_amount,
			total_price_label,
			currency,
			latest_payment_request_id,
			service_snapshot,
			schedule_snapshot,
			pricing_snapshot,
			cancellation_policy_snapshot,
			cancellation_resolution,
			recent_activity,
			customer_feedback,
			created_at,
			updated_at
		FROM appointments
		WHERE consumer_id = $1
		ORDER BY requested_at DESC, id ASC
	`, consumerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return collectAppointments(rows)
}

func (s *PostgresStore) AppointmentsByProfessionalID(
	ctx context.Context,
	professionalID string,
) ([]AppointmentRecord, error) {
	rows, err := s.queryAppointments(ctx, `
		SELECT
			id,
			consumer_id,
			professional_id,
			service_id,
			service_offering_id,
			area_id,
			booking_flow,
			requested_mode,
			request_note,
			requested_at,
			status,
			total_price_amount,
			total_price_label,
			currency,
			latest_payment_request_id,
			service_snapshot,
			schedule_snapshot,
			pricing_snapshot,
			cancellation_policy_snapshot,
			cancellation_resolution,
			recent_activity,
			customer_feedback,
			created_at,
			updated_at
		FROM appointments
		WHERE professional_id = $1
		ORDER BY requested_at DESC, id ASC
	`, professionalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return collectAppointments(rows)
}

func (s *PostgresStore) AppointmentByID(ctx context.Context, appointmentID string) (AppointmentRecord, error) {
	if err := ctx.Err(); err != nil {
		return AppointmentRecord{}, err
	}
	if s.db == nil {
		return AppointmentRecord{}, ErrNilDB
	}

	row := s.db.QueryRowContext(ctx, `
		SELECT
			id,
			consumer_id,
			professional_id,
			service_id,
			service_offering_id,
			area_id,
			booking_flow,
			requested_mode,
			request_note,
			requested_at,
			status,
			total_price_amount,
			total_price_label,
			currency,
			latest_payment_request_id,
			service_snapshot,
			schedule_snapshot,
			pricing_snapshot,
			cancellation_policy_snapshot,
			cancellation_resolution,
			recent_activity,
			customer_feedback,
			created_at,
			updated_at
		FROM appointments
		WHERE id = $1
	`, appointmentID)

	record, err := scanAppointmentRecord(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return AppointmentRecord{}, ErrNotFound
		}
		return AppointmentRecord{}, err
	}
	return record, nil
}

func (s *PostgresStore) UpsertAppointment(ctx context.Context, appointment AppointmentRecord) (AppointmentRecord, error) {
	if err := ctx.Err(); err != nil {
		return AppointmentRecord{}, err
	}
	if s.db == nil {
		return AppointmentRecord{}, ErrNilDB
	}
	if appointment.CreatedAt.IsZero() {
		appointment.CreatedAt = time.Now().UTC()
	}
	if appointment.UpdatedAt.IsZero() {
		appointment.UpdatedAt = appointment.CreatedAt
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO appointments (
			id,
			consumer_id,
			professional_id,
			service_id,
			service_offering_id,
			area_id,
			booking_flow,
			requested_mode,
			request_note,
			requested_at,
			status,
			total_price_amount,
			total_price_label,
			currency,
			latest_payment_request_id,
			service_snapshot,
			schedule_snapshot,
			pricing_snapshot,
			cancellation_policy_snapshot,
			cancellation_resolution,
			recent_activity,
			customer_feedback,
			created_at,
			updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24
		)
		ON CONFLICT (id) DO UPDATE
		SET consumer_id = EXCLUDED.consumer_id,
		    professional_id = EXCLUDED.professional_id,
		    service_id = EXCLUDED.service_id,
		    service_offering_id = EXCLUDED.service_offering_id,
		    area_id = EXCLUDED.area_id,
		    booking_flow = EXCLUDED.booking_flow,
		    requested_mode = EXCLUDED.requested_mode,
		    request_note = EXCLUDED.request_note,
		    requested_at = EXCLUDED.requested_at,
		    status = EXCLUDED.status,
		    total_price_amount = EXCLUDED.total_price_amount,
		    total_price_label = EXCLUDED.total_price_label,
		    currency = EXCLUDED.currency,
		    latest_payment_request_id = EXCLUDED.latest_payment_request_id,
		    service_snapshot = EXCLUDED.service_snapshot,
		    schedule_snapshot = EXCLUDED.schedule_snapshot,
		    pricing_snapshot = EXCLUDED.pricing_snapshot,
		    cancellation_policy_snapshot = EXCLUDED.cancellation_policy_snapshot,
		    cancellation_resolution = EXCLUDED.cancellation_resolution,
		    recent_activity = EXCLUDED.recent_activity,
		    customer_feedback = EXCLUDED.customer_feedback,
		    updated_at = EXCLUDED.updated_at
		RETURNING
			id,
			consumer_id,
			professional_id,
			service_id,
			service_offering_id,
			area_id,
			booking_flow,
			requested_mode,
			request_note,
			requested_at,
			status,
			total_price_amount,
			total_price_label,
			currency,
			latest_payment_request_id,
			service_snapshot,
			schedule_snapshot,
			pricing_snapshot,
			cancellation_policy_snapshot,
			cancellation_resolution,
			recent_activity,
			customer_feedback,
			created_at,
			updated_at
	`,
		appointment.ID,
		appointment.ConsumerID,
		appointment.ProfessionalID,
		appointment.ServiceID,
		appointment.ServiceOfferingID,
		appointment.AreaID,
		appointment.BookingFlow,
		appointment.RequestedMode,
		appointment.RequestNote,
		appointment.RequestedAt,
		appointment.Status,
		appointment.TotalPriceAmount,
		appointment.TotalPriceLabel,
		appointment.Currency,
		appointment.LatestPaymentRequestID,
		marshalOrNullObject(appointment.ServiceSnapshot),
		marshalOrNullObject(appointment.ScheduleSnapshot),
		marshalOrNullObject(appointment.PricingSnapshot),
		marshalOrNullObject(appointment.CancellationPolicySnapshot),
		marshalOrNullValue(appointment.CancellationResolution),
		marshalOrNullValue(appointment.RecentActivity),
		marshalOrNullValue(appointment.CustomerFeedback),
		appointment.CreatedAt,
		appointment.UpdatedAt,
	)

	return scanAppointmentRecord(row)
}

func (s *PostgresStore) ListAppointmentStatusHistory(ctx context.Context) (map[string][]AppointmentStatusEvent, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilDB
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			id,
			appointment_id,
			from_status,
			to_status,
			actor_kind,
			actor_id,
			actor_name,
			customer_summary,
			internal_note,
			evidence_url,
			created_at,
			created_at_label
		FROM appointment_status_history
		ORDER BY appointment_id ASC, created_at ASC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string][]AppointmentStatusEvent{}
	for rows.Next() {
		event, err := scanStatusEvent(rows)
		if err != nil {
			return nil, err
		}
		result[event.AppointmentID] = append(result[event.AppointmentID], event)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func (s *PostgresStore) AppointmentStatusHistoryByAppointmentID(
	ctx context.Context,
	appointmentID string,
) ([]AppointmentStatusEvent, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilDB
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			id,
			appointment_id,
			from_status,
			to_status,
			actor_kind,
			actor_id,
			actor_name,
			customer_summary,
			internal_note,
			evidence_url,
			created_at,
			created_at_label
		FROM appointment_status_history
		WHERE appointment_id = $1
		ORDER BY created_at ASC, id ASC
	`, appointmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := make([]AppointmentStatusEvent, 0)
	for rows.Next() {
		event, err := scanStatusEvent(rows)
		if err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return events, nil
}

func (s *PostgresStore) AppendAppointmentStatusEvent(
	ctx context.Context,
	event AppointmentStatusEvent,
) (AppointmentStatusEvent, error) {
	if err := ctx.Err(); err != nil {
		return AppointmentStatusEvent{}, err
	}
	if s.db == nil {
		return AppointmentStatusEvent{}, ErrNilDB
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO appointment_status_history (
			id,
			appointment_id,
			from_status,
			to_status,
			actor_kind,
			actor_id,
			actor_name,
			customer_summary,
			internal_note,
			evidence_url,
			created_at,
			created_at_label
		) VALUES (
			$1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		RETURNING
			id,
			appointment_id,
			from_status,
			to_status,
			actor_kind,
			actor_id,
			actor_name,
			customer_summary,
			internal_note,
			evidence_url,
			created_at,
			created_at_label
	`,
		event.ID,
		event.AppointmentID,
		event.FromStatus,
		event.ToStatus,
		event.ActorKind,
		event.ActorID,
		event.ActorName,
		event.CustomerSummary,
		event.InternalNote,
		event.EvidenceURL,
		event.CreatedAt,
		event.CreatedAtLabel,
	)

	return scanStatusEvent(row)
}

func (s *PostgresStore) ReplaceAppointmentParticipants(
	ctx context.Context,
	appointmentID string,
	participants []AppointmentParticipant,
) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if s.db == nil {
		return ErrNilDB
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `DELETE FROM appointment_participants WHERE appointment_id = $1`, appointmentID); err != nil {
		return err
	}

	for _, participant := range participants {
		createdAt := participant.CreatedAt
		if createdAt.IsZero() {
			createdAt = time.Now().UTC()
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO appointment_participants (
				appointment_id,
				participant_kind,
				participant_id,
				display_name,
				created_at
			) VALUES ($1, $2, $3, $4, $5)
		`,
			appointmentID,
			participant.ParticipantKind,
			participant.ParticipantID,
			participant.DisplayName,
			createdAt,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *PostgresStore) AppendAppointmentOperationalEvent(
	ctx context.Context,
	event AppointmentOperationalEvent,
) (AppointmentOperationalEvent, error) {
	if err := ctx.Err(); err != nil {
		return AppointmentOperationalEvent{}, err
	}
	if s.db == nil {
		return AppointmentOperationalEvent{}, ErrNilDB
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO appointment_operational_events (
			id,
			appointment_id,
			event_type,
			actor_kind,
			actor_id,
			payload,
			created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, appointment_id, event_type, actor_kind, actor_id, payload, created_at
	`,
		event.ID,
		event.AppointmentID,
		event.EventType,
		event.ActorKind,
		event.ActorID,
		marshalOrNullValue(event.Payload),
		event.CreatedAt,
	)

	return scanOperationalEvent(row)
}

func (s *PostgresStore) CreateAppointmentChangeRequest(
	ctx context.Context,
	changeRequest AppointmentChangeRequest,
) (AppointmentChangeRequest, error) {
	if err := ctx.Err(); err != nil {
		return AppointmentChangeRequest{}, err
	}
	if s.db == nil {
		return AppointmentChangeRequest{}, ErrNilDB
	}
	if changeRequest.CreatedAt.IsZero() {
		changeRequest.CreatedAt = time.Now().UTC()
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO appointment_change_requests (
			id,
			appointment_id,
			requested_by_kind,
			requested_by_id,
			change_type,
			status,
			requested_mode,
			requested_schedule_snapshot,
			reason,
			admin_note,
			created_at,
			resolved_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		RETURNING
			id,
			appointment_id,
			requested_by_kind,
			requested_by_id,
			change_type,
			status,
			requested_mode,
			requested_schedule_snapshot,
			reason,
			admin_note,
			created_at,
			resolved_at
	`,
		changeRequest.ID,
		changeRequest.AppointmentID,
		changeRequest.RequestedByKind,
		changeRequest.RequestedByID,
		changeRequest.ChangeType,
		changeRequest.Status,
		changeRequest.RequestedMode,
		marshalOrNullValue(changeRequest.RequestedScheduleSnapshot),
		changeRequest.Reason,
		changeRequest.AdminNote,
		changeRequest.CreatedAt,
		nullTime(changeRequest.ResolvedAt),
	)

	return scanChangeRequest(row)
}

func (s *PostgresStore) LatestPaymentRequestByAppointmentID(
	ctx context.Context,
	appointmentID string,
) (PaymentRequest, error) {
	if err := ctx.Err(); err != nil {
		return PaymentRequest{}, err
	}
	if s.db == nil {
		return PaymentRequest{}, ErrNilDB
	}

	row := s.db.QueryRowContext(ctx, `
		SELECT
			id,
			appointment_id,
			provider,
			external_id,
			status,
			currency,
			amount,
			checkout_url,
			provider_reference_id,
			payment_method,
			expires_at,
			paid_at,
			metadata,
			created_at,
			updated_at
		FROM payment_requests
		WHERE appointment_id = $1
		ORDER BY created_at DESC, id DESC
		LIMIT 1
	`, appointmentID)

	paymentRequest, err := scanPaymentRequest(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PaymentRequest{}, ErrNotFound
		}
		return PaymentRequest{}, err
	}
	return paymentRequest, nil
}

func (s *PostgresStore) PaymentRequestByID(ctx context.Context, paymentRequestID string) (PaymentRequest, error) {
	if err := ctx.Err(); err != nil {
		return PaymentRequest{}, err
	}
	if s.db == nil {
		return PaymentRequest{}, ErrNilDB
	}

	row := s.db.QueryRowContext(ctx, `
		SELECT
			id,
			appointment_id,
			provider,
			external_id,
			status,
			currency,
			amount,
			checkout_url,
			provider_reference_id,
			payment_method,
			expires_at,
			paid_at,
			metadata,
			created_at,
			updated_at
		FROM payment_requests
		WHERE id = $1
	`, paymentRequestID)

	paymentRequest, err := scanPaymentRequest(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PaymentRequest{}, ErrNotFound
		}
		return PaymentRequest{}, err
	}
	return paymentRequest, nil
}

func (s *PostgresStore) UpsertPaymentRequest(
	ctx context.Context,
	paymentRequest PaymentRequest,
) (PaymentRequest, error) {
	if err := ctx.Err(); err != nil {
		return PaymentRequest{}, err
	}
	if s.db == nil {
		return PaymentRequest{}, ErrNilDB
	}
	if paymentRequest.CreatedAt.IsZero() {
		paymentRequest.CreatedAt = time.Now().UTC()
	}
	if paymentRequest.UpdatedAt.IsZero() {
		paymentRequest.UpdatedAt = paymentRequest.CreatedAt
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO payment_requests (
			id,
			appointment_id,
			provider,
			external_id,
			status,
			currency,
			amount,
			checkout_url,
			provider_reference_id,
			payment_method,
			expires_at,
			paid_at,
			metadata,
			created_at,
			updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
		ON CONFLICT (id) DO UPDATE
		SET provider = EXCLUDED.provider,
		    external_id = EXCLUDED.external_id,
		    status = EXCLUDED.status,
		    currency = EXCLUDED.currency,
		    amount = EXCLUDED.amount,
		    checkout_url = EXCLUDED.checkout_url,
		    provider_reference_id = EXCLUDED.provider_reference_id,
		    payment_method = EXCLUDED.payment_method,
		    expires_at = EXCLUDED.expires_at,
		    paid_at = EXCLUDED.paid_at,
		    metadata = EXCLUDED.metadata,
		    updated_at = EXCLUDED.updated_at
		RETURNING
			id,
			appointment_id,
			provider,
			external_id,
			status,
			currency,
			amount,
			checkout_url,
			provider_reference_id,
			payment_method,
			expires_at,
			paid_at,
			metadata,
			created_at,
			updated_at
	`,
		paymentRequest.ID,
		paymentRequest.AppointmentID,
		paymentRequest.Provider,
		paymentRequest.ExternalID,
		paymentRequest.Status,
		paymentRequest.Currency,
		paymentRequest.Amount,
		paymentRequest.CheckoutURL,
		paymentRequest.ProviderReferenceID,
		paymentRequest.PaymentMethod,
		nullTime(paymentRequest.ExpiresAt),
		nullTime(paymentRequest.PaidAt),
		marshalOrNullValue(paymentRequest.Metadata),
		paymentRequest.CreatedAt,
		paymentRequest.UpdatedAt,
	)

	return scanPaymentRequest(row)
}

func (s *PostgresStore) AppendPaymentEvent(ctx context.Context, event PaymentEvent) (PaymentEvent, error) {
	if err := ctx.Err(); err != nil {
		return PaymentEvent{}, err
	}
	if s.db == nil {
		return PaymentEvent{}, ErrNilDB
	}
	if event.ReceivedAt.IsZero() {
		event.ReceivedAt = time.Now().UTC()
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO payment_events (
			id,
			payment_request_id,
			provider,
			event_type,
			external_event_id,
			payment_status,
			payload,
			received_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (provider, external_event_id) DO UPDATE
		SET payment_status = EXCLUDED.payment_status,
		    payload = EXCLUDED.payload,
		    received_at = EXCLUDED.received_at
		RETURNING id, payment_request_id, provider, event_type, external_event_id, payment_status, payload, received_at
	`,
		event.ID,
		event.PaymentRequestID,
		event.Provider,
		event.EventType,
		event.ExternalEventID,
		event.PaymentStatus,
		marshalOrNullValue(event.Payload),
		event.ReceivedAt,
	)

	return scanPaymentEvent(row)
}

func (s *PostgresStore) UpsertRefundRequest(ctx context.Context, refundRequest RefundRequest) (RefundRequest, error) {
	if err := ctx.Err(); err != nil {
		return RefundRequest{}, err
	}
	if s.db == nil {
		return RefundRequest{}, ErrNilDB
	}
	if refundRequest.CreatedAt.IsZero() {
		refundRequest.CreatedAt = time.Now().UTC()
	}
	if refundRequest.UpdatedAt.IsZero() {
		refundRequest.UpdatedAt = refundRequest.CreatedAt
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO refund_requests (
			id,
			appointment_id,
			payment_request_id,
			amount,
			currency,
			reason,
			status,
			requested_by_kind,
			requested_by_id,
			approved_by_admin_id,
			created_at,
			processed_at,
			updated_at
		) VALUES (
			$1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, NULLIF($10, ''), $11, $12, $13
		)
		ON CONFLICT (id) DO UPDATE
		SET payment_request_id = NULLIF(EXCLUDED.payment_request_id, ''),
		    amount = EXCLUDED.amount,
		    currency = EXCLUDED.currency,
		    reason = EXCLUDED.reason,
		    status = EXCLUDED.status,
		    requested_by_kind = EXCLUDED.requested_by_kind,
		    requested_by_id = EXCLUDED.requested_by_id,
		    approved_by_admin_id = EXCLUDED.approved_by_admin_id,
		    processed_at = EXCLUDED.processed_at,
		    updated_at = EXCLUDED.updated_at
		RETURNING id, appointment_id, COALESCE(payment_request_id, ''), amount, currency, reason, status, requested_by_kind, requested_by_id, COALESCE(approved_by_admin_id, ''), created_at, processed_at, updated_at
	`,
		refundRequest.ID,
		refundRequest.AppointmentID,
		refundRequest.PaymentRequestID,
		refundRequest.Amount,
		refundRequest.Currency,
		refundRequest.Reason,
		refundRequest.Status,
		refundRequest.RequestedByKind,
		refundRequest.RequestedByID,
		refundRequest.ApprovedByAdminID,
		refundRequest.CreatedAt,
		nullTime(refundRequest.ProcessedAt),
		refundRequest.UpdatedAt,
	)

	return scanRefundRequest(row)
}

func (s *PostgresStore) AppendRefundEvent(ctx context.Context, event RefundEvent) (RefundEvent, error) {
	if err := ctx.Err(); err != nil {
		return RefundEvent{}, err
	}
	if s.db == nil {
		return RefundEvent{}, ErrNilDB
	}
	if event.ReceivedAt.IsZero() {
		event.ReceivedAt = time.Now().UTC()
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO refund_events (
			id,
			refund_request_id,
			provider,
			event_type,
			external_event_id,
			payload,
			received_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (provider, external_event_id) DO UPDATE
		SET payload = EXCLUDED.payload,
		    received_at = EXCLUDED.received_at
		RETURNING id, refund_request_id, provider, event_type, external_event_id, payload, received_at
	`,
		event.ID,
		event.RefundRequestID,
		event.Provider,
		event.EventType,
		event.ExternalEventID,
		marshalOrNullValue(event.Payload),
		event.ReceivedAt,
	)

	return scanRefundEvent(row)
}

func (s *PostgresStore) AppendEarningsLedgerEntry(
	ctx context.Context,
	entry EarningsLedgerEntry,
) (EarningsLedgerEntry, error) {
	if err := ctx.Err(); err != nil {
		return EarningsLedgerEntry{}, err
	}
	if s.db == nil {
		return EarningsLedgerEntry{}, ErrNilDB
	}
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now().UTC()
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO professional_earnings_ledger (
			id,
			professional_id,
			appointment_id,
			entry_type,
			amount,
			currency,
			status,
			available_at,
			created_at
		) VALUES (
			$1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9
		)
		RETURNING id, professional_id, COALESCE(appointment_id, ''), entry_type, amount, currency, status, available_at, created_at
	`,
		entry.ID,
		entry.ProfessionalID,
		entry.AppointmentID,
		entry.EntryType,
		entry.Amount,
		entry.Currency,
		entry.Status,
		nullTime(entry.AvailableAt),
		entry.CreatedAt,
	)

	return scanEarningsEntry(row)
}

func (s *PostgresStore) UpsertPayoutBatch(ctx context.Context, payoutBatch PayoutBatch) (PayoutBatch, error) {
	if err := ctx.Err(); err != nil {
		return PayoutBatch{}, err
	}
	if s.db == nil {
		return PayoutBatch{}, ErrNilDB
	}
	if payoutBatch.CreatedAt.IsZero() {
		payoutBatch.CreatedAt = time.Now().UTC()
	}
	if payoutBatch.UpdatedAt.IsZero() {
		payoutBatch.UpdatedAt = payoutBatch.CreatedAt
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO payout_batches (
			id,
			professional_id,
			provider,
			status,
			amount,
			currency,
			external_id,
			created_at,
			updated_at,
			paid_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
		ON CONFLICT (id) DO UPDATE
		SET professional_id = EXCLUDED.professional_id,
		    provider = EXCLUDED.provider,
		    status = EXCLUDED.status,
		    amount = EXCLUDED.amount,
		    currency = EXCLUDED.currency,
		    external_id = EXCLUDED.external_id,
		    updated_at = EXCLUDED.updated_at,
		    paid_at = EXCLUDED.paid_at
		RETURNING id, professional_id, provider, status, amount, currency, external_id, created_at, updated_at, paid_at
	`,
		payoutBatch.ID,
		payoutBatch.ProfessionalID,
		payoutBatch.Provider,
		payoutBatch.Status,
		payoutBatch.Amount,
		payoutBatch.Currency,
		payoutBatch.ExternalID,
		payoutBatch.CreatedAt,
		payoutBatch.UpdatedAt,
		nullTime(payoutBatch.PaidAt),
	)

	return scanPayoutBatch(row)
}

type appointmentRows interface {
	Next() bool
	Scan(dest ...any) error
	Err() error
}

func (s *PostgresStore) queryAppointments(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilDB
	}
	return s.db.QueryContext(ctx, query, args...)
}

func collectAppointments(rows *sql.Rows) ([]AppointmentRecord, error) {
	appointments := make([]AppointmentRecord, 0)
	for rows.Next() {
		record, err := scanAppointmentRecord(rows)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, record)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return appointments, nil
}

func scanAppointmentRecord(row scanner) (AppointmentRecord, error) {
	var (
		record                  AppointmentRecord
		serviceSnapshotBytes    []byte
		scheduleSnapshotBytes   []byte
		pricingSnapshotBytes    []byte
		cancellationPolicyBytes []byte
		cancellationResolution  []byte
		recentActivityBytes     []byte
		customerFeedbackBytes   []byte
	)
	if err := row.Scan(
		&record.ID,
		&record.ConsumerID,
		&record.ProfessionalID,
		&record.ServiceID,
		&record.ServiceOfferingID,
		&record.AreaID,
		&record.BookingFlow,
		&record.RequestedMode,
		&record.RequestNote,
		&record.RequestedAt,
		&record.Status,
		&record.TotalPriceAmount,
		&record.TotalPriceLabel,
		&record.Currency,
		&record.LatestPaymentRequestID,
		&serviceSnapshotBytes,
		&scheduleSnapshotBytes,
		&pricingSnapshotBytes,
		&cancellationPolicyBytes,
		&cancellationResolution,
		&recentActivityBytes,
		&customerFeedbackBytes,
		&record.CreatedAt,
		&record.UpdatedAt,
	); err != nil {
		return AppointmentRecord{}, err
	}

	record.ServiceSnapshot = decodeJSONMap(serviceSnapshotBytes)
	record.ScheduleSnapshot = decodeJSONMap(scheduleSnapshotBytes)
	record.PricingSnapshot = decodeJSONMap(pricingSnapshotBytes)
	record.CancellationPolicySnapshot = decodeJSONMap(cancellationPolicyBytes)
	record.CancellationResolution = decodeJSONMap(cancellationResolution)
	record.RecentActivity = decodeJSONMap(recentActivityBytes)
	record.CustomerFeedback = decodeJSONMap(customerFeedbackBytes)
	return record, nil
}

func scanStatusEvent(row scanner) (AppointmentStatusEvent, error) {
	var (
		event      AppointmentStatusEvent
		fromStatus sql.NullString
	)
	if err := row.Scan(
		&event.ID,
		&event.AppointmentID,
		&fromStatus,
		&event.ToStatus,
		&event.ActorKind,
		&event.ActorID,
		&event.ActorName,
		&event.CustomerSummary,
		&event.InternalNote,
		&event.EvidenceURL,
		&event.CreatedAt,
		&event.CreatedAtLabel,
	); err != nil {
		return AppointmentStatusEvent{}, err
	}
	if fromStatus.Valid {
		event.FromStatus = fromStatus.String
	}
	return event, nil
}

func scanOperationalEvent(row scanner) (AppointmentOperationalEvent, error) {
	var (
		event        AppointmentOperationalEvent
		payloadBytes []byte
	)
	if err := row.Scan(
		&event.ID,
		&event.AppointmentID,
		&event.EventType,
		&event.ActorKind,
		&event.ActorID,
		&payloadBytes,
		&event.CreatedAt,
	); err != nil {
		return AppointmentOperationalEvent{}, err
	}
	event.Payload = decodeJSONMap(payloadBytes)
	return event, nil
}

func scanChangeRequest(row scanner) (AppointmentChangeRequest, error) {
	var (
		changeRequest          AppointmentChangeRequest
		requestedScheduleBytes []byte
		resolvedAt             sql.NullTime
	)
	if err := row.Scan(
		&changeRequest.ID,
		&changeRequest.AppointmentID,
		&changeRequest.RequestedByKind,
		&changeRequest.RequestedByID,
		&changeRequest.ChangeType,
		&changeRequest.Status,
		&changeRequest.RequestedMode,
		&requestedScheduleBytes,
		&changeRequest.Reason,
		&changeRequest.AdminNote,
		&changeRequest.CreatedAt,
		&resolvedAt,
	); err != nil {
		return AppointmentChangeRequest{}, err
	}
	changeRequest.RequestedScheduleSnapshot = decodeJSONMap(requestedScheduleBytes)
	changeRequest.ResolvedAt = nullTimePointer(resolvedAt)
	return changeRequest, nil
}

func scanPaymentRequest(row scanner) (PaymentRequest, error) {
	var (
		paymentRequest PaymentRequest
		expiresAt      sql.NullTime
		paidAt         sql.NullTime
		metadataBytes  []byte
	)
	if err := row.Scan(
		&paymentRequest.ID,
		&paymentRequest.AppointmentID,
		&paymentRequest.Provider,
		&paymentRequest.ExternalID,
		&paymentRequest.Status,
		&paymentRequest.Currency,
		&paymentRequest.Amount,
		&paymentRequest.CheckoutURL,
		&paymentRequest.ProviderReferenceID,
		&paymentRequest.PaymentMethod,
		&expiresAt,
		&paidAt,
		&metadataBytes,
		&paymentRequest.CreatedAt,
		&paymentRequest.UpdatedAt,
	); err != nil {
		return PaymentRequest{}, err
	}
	paymentRequest.ExpiresAt = nullTimePointer(expiresAt)
	paymentRequest.PaidAt = nullTimePointer(paidAt)
	paymentRequest.Metadata = decodeJSONMap(metadataBytes)
	return paymentRequest, nil
}

func scanPaymentEvent(row scanner) (PaymentEvent, error) {
	var (
		event        PaymentEvent
		payloadBytes []byte
	)
	if err := row.Scan(
		&event.ID,
		&event.PaymentRequestID,
		&event.Provider,
		&event.EventType,
		&event.ExternalEventID,
		&event.PaymentStatus,
		&payloadBytes,
		&event.ReceivedAt,
	); err != nil {
		return PaymentEvent{}, err
	}
	event.Payload = decodeJSONMap(payloadBytes)
	return event, nil
}

func scanRefundRequest(row scanner) (RefundRequest, error) {
	var (
		refundRequest RefundRequest
		processedAt   sql.NullTime
	)
	if err := row.Scan(
		&refundRequest.ID,
		&refundRequest.AppointmentID,
		&refundRequest.PaymentRequestID,
		&refundRequest.Amount,
		&refundRequest.Currency,
		&refundRequest.Reason,
		&refundRequest.Status,
		&refundRequest.RequestedByKind,
		&refundRequest.RequestedByID,
		&refundRequest.ApprovedByAdminID,
		&refundRequest.CreatedAt,
		&processedAt,
		&refundRequest.UpdatedAt,
	); err != nil {
		return RefundRequest{}, err
	}
	refundRequest.ProcessedAt = nullTimePointer(processedAt)
	return refundRequest, nil
}

func scanRefundEvent(row scanner) (RefundEvent, error) {
	var (
		event        RefundEvent
		payloadBytes []byte
	)
	if err := row.Scan(
		&event.ID,
		&event.RefundRequestID,
		&event.Provider,
		&event.EventType,
		&event.ExternalEventID,
		&payloadBytes,
		&event.ReceivedAt,
	); err != nil {
		return RefundEvent{}, err
	}
	event.Payload = decodeJSONMap(payloadBytes)
	return event, nil
}

func scanEarningsEntry(row scanner) (EarningsLedgerEntry, error) {
	var (
		entry       EarningsLedgerEntry
		availableAt sql.NullTime
	)
	if err := row.Scan(
		&entry.ID,
		&entry.ProfessionalID,
		&entry.AppointmentID,
		&entry.EntryType,
		&entry.Amount,
		&entry.Currency,
		&entry.Status,
		&availableAt,
		&entry.CreatedAt,
	); err != nil {
		return EarningsLedgerEntry{}, err
	}
	entry.AvailableAt = nullTimePointer(availableAt)
	return entry, nil
}

func scanPayoutBatch(row scanner) (PayoutBatch, error) {
	var (
		payoutBatch PayoutBatch
		paidAt      sql.NullTime
	)
	if err := row.Scan(
		&payoutBatch.ID,
		&payoutBatch.ProfessionalID,
		&payoutBatch.Provider,
		&payoutBatch.Status,
		&payoutBatch.Amount,
		&payoutBatch.Currency,
		&payoutBatch.ExternalID,
		&payoutBatch.CreatedAt,
		&payoutBatch.UpdatedAt,
		&paidAt,
	); err != nil {
		return PayoutBatch{}, err
	}
	payoutBatch.PaidAt = nullTimePointer(paidAt)
	return payoutBatch, nil
}

func marshalOrNullObject(value map[string]any) []byte {
	if len(value) == 0 {
		return []byte(`{}`)
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return []byte(`{}`)
	}
	return raw
}

func marshalOrNullValue(value map[string]any) []byte {
	if len(value) == 0 {
		return []byte(`null`)
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return []byte(`null`)
	}
	return raw
}

func decodeJSONMap(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil || decoded == nil {
		return map[string]any{}
	}
	return decoded
}
