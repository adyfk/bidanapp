package chat

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
)

type Handler struct {
	allowedOrigins []string
	hub            *Hub
	logger         *slog.Logger
}

func NewHandler(hub *Hub, logger *slog.Logger, allowedOrigins []string) Handler {
	return Handler{
		allowedOrigins: allowedOrigins,
		hub:            hub,
		logger:         logger,
	}
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	threadID := normalizeValue(r.URL.Query().Get("thread_id"), "demo-thread")
	clientID := normalizeValue(r.URL.Query().Get("client_id"), "web-client")
	sender := normalizeValue(r.URL.Query().Get("sender"), clientID)

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: h.allowedOrigins,
	})
	if err != nil {
		h.logger.Warn("websocket accept failed", slog.String("error", err.Error()))
		return
	}
	defer conn.CloseNow()

	sub, history := h.hub.Subscribe(threadID, clientID)
	defer h.hub.Unsubscribe(threadID, sub)

	ctx := context.Background()
	if err := wsjson.Write(ctx, conn, ServerEvent{
		Type:      "connected",
		ThreadID:  threadID,
		ClientID:  clientID,
		Messages:  history,
		Timestamp: time.Now().UTC(),
	}); err != nil {
		h.logger.Warn("websocket initial write failed", slog.String("error", err.Error()))
		return
	}

	errCh := make(chan error, 2)

	go func() {
		for event := range sub.send {
			if err := wsjson.Write(ctx, conn, event); err != nil {
				errCh <- err
				return
			}
		}
		errCh <- nil
	}()

	for {
		var message ClientMessage
		if err := wsjson.Read(ctx, conn, &message); err != nil {
			if websocket.CloseStatus(err) == websocket.StatusNormalClosure {
				return
			}

			if errors.Is(err, context.Canceled) {
				return
			}

			h.logger.Warn("websocket read failed", slog.String("error", err.Error()))
			return
		}

		if strings.TrimSpace(message.Text) == "" {
			continue
		}

		h.hub.Publish(threadID, normalizeValue(message.Sender, sender), strings.TrimSpace(message.Text))

		select {
		case err := <-errCh:
			if err != nil {
				h.logger.Warn("websocket write failed", slog.String("error", err.Error()))
			}
			return
		default:
		}
	}
}

func normalizeValue(raw string, fallback string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return fallback
	}

	return value
}
