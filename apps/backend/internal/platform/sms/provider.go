package sms

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"bidanapp/apps/backend/internal/config"
)

type Sender interface {
	SendSMS(ctx context.Context, to string, body string) error
}

func NewSender(cfg config.SMSConfig, logger *slog.Logger) Sender {
	switch strings.ToLower(strings.TrimSpace(cfg.Provider)) {
	case "twilio":
		return &TwilioSender{
			accountSID: cfg.Twilio.AccountSID,
			authToken:  cfg.Twilio.AuthToken,
			fromNumber: cfg.Twilio.FromNumber,
			httpClient: &http.Client{},
		}
	default:
		return &ConsoleSender{logger: logger}
	}
}

type ConsoleSender struct {
	logger *slog.Logger
}

func (s *ConsoleSender) SendSMS(ctx context.Context, to string, body string) error {
	if s.logger != nil {
		s.logger.InfoContext(ctx, "sms challenge issued", slog.String("to", to), slog.String("body", body))
	}
	return nil
}

type TwilioSender struct {
	accountSID string
	authToken  string
	fromNumber string
	httpClient *http.Client
}

func (s *TwilioSender) SendSMS(ctx context.Context, to string, body string) error {
	values := url.Values{}
	values.Set("To", to)
	values.Set("From", s.fromNumber)
	values.Set("Body", body)

	endpoint := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", s.accountSID)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(values.Encode()))
	if err != nil {
		return err
	}

	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.Header.Set("Authorization", "Basic "+basicAuth(s.accountSID, s.authToken))

	response, err := s.httpClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode >= 200 && response.StatusCode < 300 {
		return nil
	}

	bodyBytes, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
	return fmt.Errorf("twilio sms request failed with status %d: %s", response.StatusCode, strings.TrimSpace(string(bodyBytes)))
}

func basicAuth(username string, password string) string {
	return base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
}
