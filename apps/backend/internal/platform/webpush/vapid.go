package webpush

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	sherclockwebpush "github.com/SherClockHolmes/webpush-go"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/pushstore"
)

type vapidSender struct {
	privateKey string
	publicKey  string
	subject    string
}

func NewVAPIDSender(cfg config.WebPushConfig) Sender {
	if !cfg.Enabled() {
		return NewNoopSender()
	}

	return &vapidSender{
		privateKey: cfg.PrivateKey,
		publicKey:  cfg.PublicKey,
		subject:    cfg.Subject,
	}
}

func (s *vapidSender) Send(
	ctx context.Context,
	subscription pushstore.CustomerSubscription,
	payload NotificationPayload,
) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if subscription.Endpoint == "" || subscription.P256DHKey == "" || subscription.AuthKey == "" {
		return errors.New("web push subscription is incomplete")
	}

	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	response, err := sherclockwebpush.SendNotification(bytes, &sherclockwebpush.Subscription{
		Endpoint: subscription.Endpoint,
		Keys: sherclockwebpush.Keys{
			Auth:   subscription.AuthKey,
			P256dh: subscription.P256DHKey,
		},
	}, &sherclockwebpush.Options{
		HTTPClient:      &http.Client{},
		Subscriber:      s.subject,
		TTL:             60,
		VAPIDPrivateKey: s.privateKey,
		VAPIDPublicKey:  s.publicKey,
	})
	if err != nil {
		return err
	}
	defer func() {
		_, _ = io.Copy(io.Discard, response.Body)
		_ = response.Body.Close()
	}()

	if response.StatusCode == http.StatusGone || response.StatusCode == http.StatusNotFound {
		return ErrSubscriptionGone
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return errors.New("web push request was rejected")
	}

	return nil
}
