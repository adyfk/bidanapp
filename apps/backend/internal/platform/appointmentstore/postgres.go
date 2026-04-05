package appointmentstore

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var ErrNilDB = errors.New("appointmentstore requires a database connection")

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) HomeVisitExecutionByAppointmentID(
	ctx context.Context,
	appointmentID string,
) (HomeVisitExecution, error) {
	if err := ctx.Err(); err != nil {
		return HomeVisitExecution{}, err
	}
	if s.db == nil {
		return HomeVisitExecution{}, ErrNilDB
	}

	row := s.db.QueryRowContext(ctx, `
		SELECT
			appointment_id,
			professional_id,
			consumer_id,
			requested_mode,
			execution_status,
			departure_origin_lat,
			departure_origin_lng,
			destination_lat,
			destination_lng,
			distance_km_hint,
			eta_minutes_hint,
			departed_at,
			service_started_at,
			closed_at,
			last_computed_at,
			departure_notification_sent_at,
			created_at,
			updated_at
		FROM appointment_home_visit_executions
		WHERE appointment_id = $1
	`, appointmentID)

	execution, err := scanExecution(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return HomeVisitExecution{}, ErrNotFound
		}
		return HomeVisitExecution{}, err
	}

	return execution, nil
}

func (s *PostgresStore) UpsertHomeVisitExecution(
	ctx context.Context,
	execution HomeVisitExecution,
) (HomeVisitExecution, error) {
	if err := ctx.Err(); err != nil {
		return HomeVisitExecution{}, err
	}
	if s.db == nil {
		return HomeVisitExecution{}, ErrNilDB
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO appointment_home_visit_executions (
			appointment_id,
			professional_id,
			consumer_id,
			requested_mode,
			execution_status,
			departure_origin_lat,
			departure_origin_lng,
			destination_lat,
			destination_lng,
			distance_km_hint,
			eta_minutes_hint,
			departed_at,
			service_started_at,
			closed_at,
			last_computed_at,
			departure_notification_sent_at,
			created_at,
			updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
			COALESCE($17, now()),
			COALESCE($18, now())
		)
		ON CONFLICT (appointment_id) DO UPDATE
		SET professional_id = EXCLUDED.professional_id,
		    consumer_id = EXCLUDED.consumer_id,
		    requested_mode = EXCLUDED.requested_mode,
		    execution_status = EXCLUDED.execution_status,
		    departure_origin_lat = EXCLUDED.departure_origin_lat,
		    departure_origin_lng = EXCLUDED.departure_origin_lng,
		    destination_lat = EXCLUDED.destination_lat,
		    destination_lng = EXCLUDED.destination_lng,
		    distance_km_hint = EXCLUDED.distance_km_hint,
		    eta_minutes_hint = EXCLUDED.eta_minutes_hint,
		    departed_at = EXCLUDED.departed_at,
		    service_started_at = EXCLUDED.service_started_at,
		    closed_at = EXCLUDED.closed_at,
		    last_computed_at = EXCLUDED.last_computed_at,
		    departure_notification_sent_at = EXCLUDED.departure_notification_sent_at,
		    updated_at = COALESCE(EXCLUDED.updated_at, now())
		RETURNING
			appointment_id,
			professional_id,
			consumer_id,
			requested_mode,
			execution_status,
			departure_origin_lat,
			departure_origin_lng,
			destination_lat,
			destination_lng,
			distance_km_hint,
			eta_minutes_hint,
			departed_at,
			service_started_at,
			closed_at,
			last_computed_at,
			departure_notification_sent_at,
			created_at,
			updated_at
	`,
		execution.AppointmentID,
		execution.ProfessionalID,
		execution.ConsumerID,
		execution.RequestedMode,
		execution.ExecutionStatus,
		nullableFloat(execution.DepartureOriginLat),
		nullableFloat(execution.DepartureOriginLng),
		nullableFloat(execution.DestinationLat),
		nullableFloat(execution.DestinationLng),
		nullableFloat(execution.DistanceKMHint),
		nullableInt(execution.ETAMinutesHint),
		nullableTime(execution.DepartedAt),
		nullableTime(execution.ServiceStartedAt),
		nullableTime(execution.ClosedAt),
		nullableTime(execution.LastComputedAt),
		nullableTime(execution.DepartureNotificationSentAt),
		nullableTimeValue(execution.CreatedAt),
		nullableTimeValue(execution.UpdatedAt),
	)

	return scanExecution(row)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanExecution(row scanner) (HomeVisitExecution, error) {
	var (
		execution                 HomeVisitExecution
		departureOriginLat        sql.NullFloat64
		departureOriginLng        sql.NullFloat64
		destinationLat            sql.NullFloat64
		destinationLng            sql.NullFloat64
		distanceKMHint            sql.NullFloat64
		etaMinutesHint            sql.NullInt64
		departedAt                sql.NullTime
		serviceStartedAt          sql.NullTime
		closedAt                  sql.NullTime
		lastComputedAt            sql.NullTime
		departureNotificationSent sql.NullTime
	)

	if err := row.Scan(
		&execution.AppointmentID,
		&execution.ProfessionalID,
		&execution.ConsumerID,
		&execution.RequestedMode,
		&execution.ExecutionStatus,
		&departureOriginLat,
		&departureOriginLng,
		&destinationLat,
		&destinationLng,
		&distanceKMHint,
		&etaMinutesHint,
		&departedAt,
		&serviceStartedAt,
		&closedAt,
		&lastComputedAt,
		&departureNotificationSent,
		&execution.CreatedAt,
		&execution.UpdatedAt,
	); err != nil {
		return HomeVisitExecution{}, err
	}

	execution.DepartureOriginLat = nullFloatPointer(departureOriginLat)
	execution.DepartureOriginLng = nullFloatPointer(departureOriginLng)
	execution.DestinationLat = nullFloatPointer(destinationLat)
	execution.DestinationLng = nullFloatPointer(destinationLng)
	execution.DistanceKMHint = nullFloatPointer(distanceKMHint)
	execution.ETAMinutesHint = nullIntPointer(etaMinutesHint)
	execution.DepartedAt = nullTimePointer(departedAt)
	execution.ServiceStartedAt = nullTimePointer(serviceStartedAt)
	execution.ClosedAt = nullTimePointer(closedAt)
	execution.LastComputedAt = nullTimePointer(lastComputedAt)
	execution.DepartureNotificationSentAt = nullTimePointer(departureNotificationSent)
	return execution, nil
}

func nullableFloat(value *float64) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullableInt(value *int) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullableTime(value *time.Time) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullTime(value *time.Time) sql.NullTime {
	if value == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{
		Time:  *value,
		Valid: true,
	}
}

func nullableTimeValue(value time.Time) any {
	if value.IsZero() {
		return nil
	}
	return value
}

func nullFloatPointer(value sql.NullFloat64) *float64 {
	if !value.Valid {
		return nil
	}
	next := value.Float64
	return &next
}

func nullIntPointer(value sql.NullInt64) *int {
	if !value.Valid {
		return nil
	}
	next := int(value.Int64)
	return &next
}

func nullTimePointer(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	next := value.Time
	return &next
}
