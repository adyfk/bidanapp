package pushstore

import (
	"context"
	"errors"
	"time"
)

var ErrNotFound = errors.New("pushstore record not found")

type CustomerSubscription struct {
	Endpoint  string
	ConsumerID string
	P256DHKey string
	AuthKey   string
	Locale    string
	UserAgent string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Store interface {
	ListCustomerSubscriptions(ctx context.Context, consumerID string) ([]CustomerSubscription, error)
	UpsertCustomerSubscription(ctx context.Context, subscription CustomerSubscription) (CustomerSubscription, error)
	DeleteCustomerSubscription(ctx context.Context, consumerID string, endpoint string) error
	DeleteSubscriptionEndpoint(ctx context.Context, endpoint string) error
}
