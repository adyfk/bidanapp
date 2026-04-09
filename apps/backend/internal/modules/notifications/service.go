package notifications

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"sort"
	"strings"
	"time"
)

var ErrDatabaseUnavailable = errors.New("notifications requires a database connection")

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) List(ctx context.Context, platformID string, userID string) (NotificationList, error) {
	if s.db == nil {
		return NotificationList{}, ErrDatabaseUnavailable
	}

	items := make([]notificationRecord, 0)

	orderRows, err := s.db.QueryContext(ctx, `
		SELECT oe.id, o.id, o.platform_id, oe.event_type, oe.created_at
		FROM order_events oe
		JOIN orders o ON o.id = oe.order_id
		WHERE ($1 = '' OR o.platform_id = $1)
		  AND (o.customer_user_id = $2 OR o.professional_user_id = $2)
		ORDER BY oe.created_at DESC
		LIMIT 25
	`, platformID, userID)
	if err != nil {
		return NotificationList{}, err
	}
	for orderRows.Next() {
		var id string
		var entityID string
		var itemPlatformID string
		var eventType string
		var createdAt time.Time
		if err := orderRows.Scan(&id, &entityID, &itemPlatformID, &eventType, &createdAt); err != nil {
			orderRows.Close()
			return NotificationList{}, err
		}
		items = append(items, notificationRecord{
			NotificationItem: NotificationItem{
				CreatedAt:  createdAt.UTC().Format(time.RFC3339),
				EntityID:   entityID,
				ID:         id,
				Kind:       "order",
				Message:    orderEventMessage(eventType),
				PlatformID: itemPlatformID,
				Title:      "Update order",
			},
			sortAt: createdAt,
		})
	}
	orderRows.Close()

	outboxRows, err := s.db.QueryContext(ctx, `
		SELECT id, aggregate_id, payload, created_at
		FROM outbox_events
		WHERE aggregate_type = 'professional_application'
		  AND aggregate_id = $1
		ORDER BY created_at DESC
		LIMIT 10
	`, userID)
	if err != nil {
		return NotificationList{}, err
	}
	for outboxRows.Next() {
		var id string
		var entityID string
		var payloadJSON []byte
		var createdAt time.Time
		if err := outboxRows.Scan(&id, &entityID, &payloadJSON, &createdAt); err != nil {
			outboxRows.Close()
			return NotificationList{}, err
		}
		var payload map[string]any
		_ = json.Unmarshal(payloadJSON, &payload)
		message := "Review onboarding profesional telah diperbarui."
		if decision, ok := payload["decision"].(string); ok && decision != "" {
			message = "Status review aplikasi profesional: " + strings.ReplaceAll(decision, "_", " ")
		}
		items = append(items, notificationRecord{
			NotificationItem: NotificationItem{
				CreatedAt:  createdAt.UTC().Format(time.RFC3339),
				EntityID:   entityID,
				ID:         id,
				Kind:       "application_review",
				Message:    message,
				PlatformID: platformID,
				Title:      "Update review profesional",
			},
			sortAt: createdAt,
		})
	}
	outboxRows.Close()

	supportRows, err := s.db.QueryContext(ctx, `
		SELECT ste.id, st.id, st.platform_id, ste.event_type, ste.public_note, ste.created_at
		FROM support_ticket_events ste
		JOIN support_tickets st ON st.id = ste.ticket_id
		WHERE st.reporter_user_id = $2
		  AND ($1 = '' OR st.platform_id = $1)
		ORDER BY ste.created_at DESC
		LIMIT 15
	`, platformID, userID)
	if err != nil {
		return NotificationList{}, err
	}
	for supportRows.Next() {
		var id string
		var entityID string
		var itemPlatformID string
		var eventType string
		var publicNote string
		var createdAt time.Time
		if err := supportRows.Scan(&id, &entityID, &itemPlatformID, &eventType, &publicNote, &createdAt); err != nil {
			supportRows.Close()
			return NotificationList{}, err
		}
		message := strings.TrimSpace(publicNote)
		if message == "" {
			message = supportEventMessage(eventType)
		}
		items = append(items, notificationRecord{
			NotificationItem: NotificationItem{
				CreatedAt:  createdAt.UTC().Format(time.RFC3339),
				EntityID:   entityID,
				ID:         id,
				Kind:       "support",
				Message:    message,
				PlatformID: itemPlatformID,
				Title:      "Update support",
			},
			sortAt: createdAt,
		})
	}
	supportRows.Close()

	sort.Slice(items, func(i int, j int) bool {
		return items[i].sortAt.After(items[j].sortAt)
	})

	result := make([]NotificationItem, 0, len(items))
	for _, item := range items {
		result = append(result, item.NotificationItem)
	}
	return NotificationList{Items: result}, nil
}

type notificationRecord struct {
	NotificationItem
	sortAt time.Time
}

func orderEventMessage(eventType string) string {
	switch eventType {
	case "payment_marked_paid":
		return "Pembayaran order telah dikonfirmasi."
	case "refunded":
		return "Order telah direfund."
	case "cancelled":
		return "Order dibatalkan."
	case "completed":
		return "Order telah selesai."
	default:
		return "Ada perubahan status pada order Anda."
	}
}

func supportEventMessage(eventType string) string {
	switch eventType {
	case "status_changed":
		return "Status ticket support diperbarui."
	case "assigned":
		return "Ticket support sudah diambil admin."
	case "refunded":
		return "Ticket support memicu proses refund."
	default:
		return "Ada update pada ticket support Anda."
	}
}
