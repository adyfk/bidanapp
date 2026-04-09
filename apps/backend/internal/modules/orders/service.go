package orders

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

var (
	ErrDatabaseUnavailable = errors.New("orders requires a database connection")
	ErrInvalidPayload      = errors.New("invalid order payload")
	ErrOfferingNotFound    = errors.New("offering not found")
	ErrOrderNotFound       = errors.New("order not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Create(ctx context.Context, platformID string, userID string, input CreatePlatformOrderRequest) (CustomerPlatformOrder, error) {
	if s.db == nil {
		return CustomerPlatformOrder{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.OfferingID) == "" {
		return CustomerPlatformOrder{}, ErrInvalidPayload
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CustomerPlatformOrder{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var order CustomerPlatformOrder
	var professionalProfileID string
	err = tx.QueryRowContext(ctx, `
		SELECT id, title, offering_type, price_amount, currency, professional_user_id, professional_profile_id
		FROM offerings
		WHERE platform_id = $1 AND id = $2 AND status = 'published'
	`, platformID, input.OfferingID).Scan(
		&order.OfferingID,
		&order.OfferingTitle,
		&order.OrderType,
		&order.TotalAmount,
		&order.Currency,
		&order.ProfessionalUserID,
		&professionalProfileID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return CustomerPlatformOrder{}, ErrOfferingNotFound
		}
		return CustomerPlatformOrder{}, err
	}

	fulfillmentJSON, err := json.Marshal(input.FulfillmentDetails)
	if err != nil {
		return CustomerPlatformOrder{}, err
	}

	order.ID, err = newID("ord_")
	if err != nil {
		return CustomerPlatformOrder{}, err
	}
	order.PlatformID = platformID
	order.Status = "pending_payment"
	order.PaymentStatus = "pending"

	_, err = tx.ExecContext(ctx, `
		INSERT INTO orders (
			id,
			platform_id,
			customer_user_id,
			professional_profile_id,
			professional_user_id,
			offering_id,
			order_type,
			status,
			payment_status,
			total_amount,
			currency,
			fulfillment_details,
			created_at,
			updated_at
		) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			'pending_payment',
			'pending',
			$8,
			$9,
			$10,
			now(),
			now()
		)
	`, order.ID, platformID, userID, professionalProfileID, order.ProfessionalUserID, input.OfferingID, order.OrderType, order.TotalAmount, order.Currency, fulfillmentJSON)
	if err != nil {
		return CustomerPlatformOrder{}, err
	}

	eventID, err := newID("ordevt_")
	if err != nil {
		return CustomerPlatformOrder{}, err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO order_events (
			id,
			order_id,
			event_type,
			actor_kind,
			actor_id,
			payload,
			created_at
		) VALUES ($1, $2, 'created', 'customer', $3, $4, now())
	`, eventID, order.ID, userID, fulfillmentJSON); err != nil {
		return CustomerPlatformOrder{}, err
	}

	if err := tx.Commit(); err != nil {
		return CustomerPlatformOrder{}, err
	}

	if len(fulfillmentJSON) > 0 {
		_ = json.Unmarshal(fulfillmentJSON, &order.FulfillmentDetails)
	}
	return order, nil
}

func (s *Service) ListByCustomer(ctx context.Context, platformID string, userID string) (CustomerPlatformOrderList, error) {
	if s.db == nil {
		return CustomerPlatformOrderList{}, ErrDatabaseUnavailable
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT o.id, o.offering_id, off.title, o.order_type, o.status, o.payment_status, o.total_amount, o.currency, o.professional_user_id, o.fulfillment_details
		FROM orders o
		JOIN offerings off ON off.id = o.offering_id
		WHERE o.platform_id = $1 AND o.customer_user_id = $2
		ORDER BY o.created_at DESC
	`, platformID, userID)
	if err != nil {
		return CustomerPlatformOrderList{}, err
	}
	defer rows.Close()

	orders := make([]CustomerPlatformOrder, 0)
	for rows.Next() {
		var order CustomerPlatformOrder
		var fulfillmentJSON []byte
		if err := rows.Scan(
			&order.ID,
			&order.OfferingID,
			&order.OfferingTitle,
			&order.OrderType,
			&order.Status,
			&order.PaymentStatus,
			&order.TotalAmount,
			&order.Currency,
			&order.ProfessionalUserID,
			&fulfillmentJSON,
		); err != nil {
			return CustomerPlatformOrderList{}, err
		}
		order.PlatformID = platformID
		if len(fulfillmentJSON) > 0 {
			_ = json.Unmarshal(fulfillmentJSON, &order.FulfillmentDetails)
		}
		orders = append(orders, order)
	}

	return CustomerPlatformOrderList{Orders: orders}, rows.Err()
}

func (s *Service) GetByCustomer(ctx context.Context, platformID string, userID string, orderID string) (CustomerPlatformOrder, error) {
	if s.db == nil {
		return CustomerPlatformOrder{}, ErrDatabaseUnavailable
	}

	var order CustomerPlatformOrder
	var fulfillmentJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT o.id, o.offering_id, off.title, o.order_type, o.status, o.payment_status, o.total_amount, o.currency, o.professional_user_id, o.fulfillment_details
		FROM orders o
		JOIN offerings off ON off.id = o.offering_id
		WHERE o.platform_id = $1
		  AND o.customer_user_id = $2
		  AND o.id = $3
	`, platformID, userID, orderID).Scan(
		&order.ID,
		&order.OfferingID,
		&order.OfferingTitle,
		&order.OrderType,
		&order.Status,
		&order.PaymentStatus,
		&order.TotalAmount,
		&order.Currency,
		&order.ProfessionalUserID,
		&fulfillmentJSON,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return CustomerPlatformOrder{}, ErrOrderNotFound
		}
		return CustomerPlatformOrder{}, err
	}
	order.PlatformID = platformID
	if len(fulfillmentJSON) > 0 {
		_ = json.Unmarshal(fulfillmentJSON, &order.FulfillmentDetails)
	}
	return order, nil
}

func (s *Service) CreatePaymentSession(
	ctx context.Context,
	orderID string,
	userID string,
	input CreateOrderPaymentSessionRequest,
) (OrderPaymentSession, error) {
	if s.db == nil {
		return OrderPaymentSession{}, ErrDatabaseUnavailable
	}

	provider := strings.TrimSpace(input.Provider)
	if provider == "" {
		provider = "manual_test"
	}

	var amount int
	var currency string
	var status string
	var paymentStatus string
	err := s.db.QueryRowContext(ctx, `
		SELECT total_amount, currency, status, payment_status
		FROM orders
		WHERE id = $1 AND customer_user_id = $2
	`, orderID, userID).Scan(&amount, &currency, &status, &paymentStatus)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OrderPaymentSession{}, ErrOrderNotFound
		}
		return OrderPaymentSession{}, err
	}
	if paymentStatus == "paid" || status == "completed" {
		return OrderPaymentSession{}, ErrInvalidPayload
	}

	paymentID, err := newID("pay_")
	if err != nil {
		return OrderPaymentSession{}, err
	}
	providerReference, err := newID("pref_")
	if err != nil {
		return OrderPaymentSession{}, err
	}

	checkoutURL := strings.TrimSpace(input.ReturnURL)
	if checkoutURL == "" {
		checkoutURL = "https://payments.local/checkout/" + paymentID
	}

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO payments (
			id,
			order_id,
			provider,
			status,
			amount,
			currency,
			provider_reference,
			checkout_url,
			metadata,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, '{}'::jsonb, now(), now())
	`, paymentID, orderID, provider, amount, currency, providerReference, checkoutURL)
	if err != nil {
		return OrderPaymentSession{}, err
	}

	return OrderPaymentSession{
		Amount:            amount,
		CheckoutURL:       checkoutURL,
		Currency:          currency,
		OrderID:           orderID,
		PaymentID:         paymentID,
		Provider:          provider,
		ProviderReference: providerReference,
		Status:            "pending",
	}, nil
}

func (s *Service) HandlePaymentWebhook(ctx context.Context, provider string, input PaymentWebhookRequest) (OrderPaymentSession, error) {
	if s.db == nil {
		return OrderPaymentSession{}, ErrDatabaseUnavailable
	}

	normalizedStatus := strings.TrimSpace(input.Status)
	if normalizedStatus == "" {
		return OrderPaymentSession{}, ErrInvalidPayload
	}

	var payment OrderPaymentSession
	err := s.db.QueryRowContext(ctx, `
		SELECT id, order_id, provider, status, amount, currency, provider_reference, checkout_url
		FROM payments
		WHERE provider = $1
		  AND (
			($2 <> '' AND id = $2) OR
			($3 <> '' AND order_id = $3) OR
			($4 <> '' AND provider_reference = $4)
		  )
		ORDER BY created_at DESC
		LIMIT 1
	`, provider, strings.TrimSpace(input.PaymentID), strings.TrimSpace(input.OrderID), strings.TrimSpace(input.ProviderReference)).Scan(
		&payment.PaymentID,
		&payment.OrderID,
		&payment.Provider,
		&payment.Status,
		&payment.Amount,
		&payment.Currency,
		&payment.ProviderReference,
		&payment.CheckoutURL,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OrderPaymentSession{}, ErrOrderNotFound
		}
		return OrderPaymentSession{}, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return OrderPaymentSession{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	if _, err := tx.ExecContext(ctx, `
		UPDATE payments
		SET status = $2,
		    updated_at = now()
		WHERE id = $1
	`, payment.PaymentID, normalizedStatus); err != nil {
		return OrderPaymentSession{}, err
	}

	orderStatus := "pending_payment"
	orderPaymentStatus := "failed"
	eventType := ""
	switch normalizedStatus {
	case "paid":
		orderPaymentStatus = "paid"
		orderStatus, err = s.resolvePaidOrderStatus(ctx, tx, payment.OrderID)
		if err != nil {
			return OrderPaymentSession{}, err
		}
		eventType = "payment_marked_paid"
	case "cancelled":
		orderStatus = "cancelled"
		eventType = "cancelled"
	default:
		orderStatus = "pending_payment"
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE orders
		SET status = $2,
		    payment_status = $3,
		    updated_at = now()
		WHERE id = $1
	`, payment.OrderID, orderStatus, orderPaymentStatus); err != nil {
		return OrderPaymentSession{}, err
	}

	if eventType != "" {
		eventID, err := newID("ordevt_")
		if err != nil {
			return OrderPaymentSession{}, err
		}
		payloadJSON, err := json.Marshal(map[string]any{
			"paymentId":         payment.PaymentID,
			"provider":          payment.Provider,
			"providerReference": payment.ProviderReference,
			"status":            normalizedStatus,
		})
		if err != nil {
			return OrderPaymentSession{}, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO order_events (
				id,
				order_id,
				event_type,
				actor_kind,
				actor_id,
				payload,
				created_at
			) VALUES ($1, $2, $3, 'system', '', $4, now())
		`, eventID, payment.OrderID, eventType, payloadJSON); err != nil {
			return OrderPaymentSession{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return OrderPaymentSession{}, err
	}

	payment.Status = normalizedStatus
	return payment, nil
}

func (s *Service) resolvePaidOrderStatus(ctx context.Context, tx *sql.Tx, orderID string) (string, error) {
	var orderType string
	err := tx.QueryRowContext(ctx, `
		SELECT order_type
		FROM orders
		WHERE id = $1
	`, orderID).Scan(&orderType)
	if err != nil {
		return "", err
	}
	if orderType == "digital_product" {
		return "completed", nil
	}
	return "pending_fulfillment", nil
}

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}
