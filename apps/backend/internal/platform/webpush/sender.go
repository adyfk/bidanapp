package webpush

import (
	"context"
	"errors"

	"bidanapp/apps/backend/internal/platform/pushstore"
)

var ErrSubscriptionGone = errors.New("web push subscription is no longer valid")

type NotificationPayload struct {
	AppointmentID string `json:"appointmentId,omitempty"`
	Body          string `json:"body"`
	Path          string `json:"path"`
	Tag           string `json:"tag,omitempty"`
	Title         string `json:"title"`
}

type Sender interface {
	Send(ctx context.Context, subscription pushstore.CustomerSubscription, payload NotificationPayload) error
}

type noopSender struct{}

func NewNoopSender() Sender {
	return noopSender{}
}

func (noopSender) Send(context.Context, pushstore.CustomerSubscription, NotificationPayload) error {
	return nil
}
