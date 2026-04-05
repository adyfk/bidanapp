package pushstore

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var ErrNilDB = errors.New("pushstore requires a database connection")

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) ListCustomerSubscriptions(
	ctx context.Context,
	consumerID string,
) ([]CustomerSubscription, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if s.db == nil {
		return nil, ErrNilDB
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT endpoint, consumer_id, p256dh_key, auth_key, locale, user_agent, created_at, updated_at
		FROM customer_push_subscriptions
		WHERE consumer_id = $1
		ORDER BY updated_at DESC, endpoint ASC
	`, consumerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subscriptions := []CustomerSubscription{}
	for rows.Next() {
		subscription, err := scanSubscription(rows)
		if err != nil {
			return nil, err
		}
		subscriptions = append(subscriptions, subscription)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return subscriptions, nil
}

func (s *PostgresStore) UpsertCustomerSubscription(
	ctx context.Context,
	subscription CustomerSubscription,
) (CustomerSubscription, error) {
	if err := ctx.Err(); err != nil {
		return CustomerSubscription{}, err
	}
	if s.db == nil {
		return CustomerSubscription{}, ErrNilDB
	}

	row := s.db.QueryRowContext(ctx, `
		INSERT INTO customer_push_subscriptions (
			endpoint,
			consumer_id,
			p256dh_key,
			auth_key,
			locale,
			user_agent,
			created_at,
			updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			COALESCE($7, now()),
			COALESCE($8, now())
		)
		ON CONFLICT (endpoint) DO UPDATE
		SET consumer_id = EXCLUDED.consumer_id,
		    p256dh_key = EXCLUDED.p256dh_key,
		    auth_key = EXCLUDED.auth_key,
		    locale = EXCLUDED.locale,
		    user_agent = EXCLUDED.user_agent,
		    updated_at = COALESCE(EXCLUDED.updated_at, now())
		RETURNING endpoint, consumer_id, p256dh_key, auth_key, locale, user_agent, created_at, updated_at
	`,
		subscription.Endpoint,
		subscription.ConsumerID,
		subscription.P256DHKey,
		subscription.AuthKey,
		subscription.Locale,
		subscription.UserAgent,
		nullableTimeValue(subscription.CreatedAt),
		nullableTimeValue(subscription.UpdatedAt),
	)

	return scanSubscription(row)
}

func (s *PostgresStore) DeleteCustomerSubscription(ctx context.Context, consumerID string, endpoint string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if s.db == nil {
		return ErrNilDB
	}

	result, err := s.db.ExecContext(ctx, `
		DELETE FROM customer_push_subscriptions
		WHERE consumer_id = $1 AND endpoint = $2
	`, consumerID, endpoint)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *PostgresStore) DeleteSubscriptionEndpoint(ctx context.Context, endpoint string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if s.db == nil {
		return ErrNilDB
	}

	_, err := s.db.ExecContext(ctx, `
		DELETE FROM customer_push_subscriptions
		WHERE endpoint = $1
	`, endpoint)
	return err
}

type scanner interface {
	Scan(dest ...any) error
}

func scanSubscription(row scanner) (CustomerSubscription, error) {
	var subscription CustomerSubscription
	if err := row.Scan(
		&subscription.Endpoint,
		&subscription.ConsumerID,
		&subscription.P256DHKey,
		&subscription.AuthKey,
		&subscription.Locale,
		&subscription.UserAgent,
		&subscription.CreatedAt,
		&subscription.UpdatedAt,
	); err != nil {
		return CustomerSubscription{}, err
	}
	return subscription, nil
}

func nullableTimeValue(value time.Time) any {
	if value.IsZero() {
		return nil
	}
	return value
}
