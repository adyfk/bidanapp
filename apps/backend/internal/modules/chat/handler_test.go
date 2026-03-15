package chat

import (
	"context"
	"io"
	"log/slog"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
)

func TestHandlerBroadcastsMessages(t *testing.T) {
	handler := NewHandler(NewHub(), slog.New(slog.NewTextHandler(io.Discard, nil)), nil)
	server := httptest.NewServer(handler)
	defer server.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, _, err := websocket.Dial(ctx, "ws"+server.URL[len("http"):]+"/?thread_id=test-thread&client_id=test-client&sender=Frontend%20Demo", nil)
	if err != nil {
		t.Fatalf("dial websocket: %v", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "done")

	var connectedEvent ServerEvent
	if err := wsjson.Read(ctx, conn, &connectedEvent); err != nil {
		t.Fatalf("read connected event: %v", err)
	}

	if connectedEvent.Type != "connected" {
		t.Fatalf("unexpected connected event: %+v", connectedEvent)
	}

	if err := wsjson.Write(ctx, conn, ClientMessage{
		Type:   "message",
		Sender: "Frontend Demo",
		Text:   "hello from test",
	}); err != nil {
		t.Fatalf("write client message: %v", err)
	}

	var messageEvent ServerEvent
	if err := wsjson.Read(ctx, conn, &messageEvent); err != nil {
		t.Fatalf("read broadcast event: %v", err)
	}

	if messageEvent.Type != "message" || messageEvent.Message == nil || messageEvent.Message.Text != "hello from test" {
		t.Fatalf("unexpected message event: %+v", messageEvent)
	}
}
