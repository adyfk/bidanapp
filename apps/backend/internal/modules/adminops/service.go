package adminops

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"
)

var (
	ErrDatabaseUnavailable = errors.New("admin ops requires a database connection")
	ErrInvalidPayload      = errors.New("invalid admin ops payload")
	ErrOrderNotFound       = errors.New("admin order not found")
	ErrRefundNotFound      = errors.New("refund not found")
	ErrPayoutNotFound      = errors.New("payout not found")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Overview(ctx context.Context, platformID string) (AdminOverview, error) {
	if s.db == nil {
		return AdminOverview{}, ErrDatabaseUnavailable
	}
	return AdminOverview{
		TotalCustomers:      s.count(ctx, `SELECT COUNT(DISTINCT customer_user_id) FROM orders WHERE ($1 = '' OR platform_id = $1)`, platformID),
		TotalProfessionals:  s.count(ctx, `SELECT COUNT(*) FROM professional_platform_profiles WHERE ($1 = '' OR platform_id = $1)`, platformID),
		PendingApplications: s.count(ctx, `SELECT COUNT(*) FROM professional_applications WHERE status = 'submitted' AND ($1 = '' OR platform_id = $1)`, platformID),
		ActiveOrders:        s.count(ctx, `SELECT COUNT(*) FROM orders WHERE status IN ('pending_payment', 'pending_fulfillment') AND ($1 = '' OR platform_id = $1)`, platformID),
		OpenSupportTickets:  s.count(ctx, `SELECT COUNT(*) FROM support_tickets WHERE status IN ('new', 'triaged', 'reviewing') AND ($1 = '' OR platform_id = $1)`, platformID),
		PendingRefunds:      s.count(ctx, `SELECT COUNT(*) FROM refunds r JOIN orders o ON o.id = r.order_id WHERE r.status = 'pending' AND ($1 = '' OR o.platform_id = $1)`, platformID),
		PendingPayouts:      s.count(ctx, `SELECT COUNT(*) FROM payouts p JOIN professional_platform_profiles pp ON pp.id = p.professional_profile_id WHERE p.status IN ('pending', 'processing') AND ($1 = '' OR pp.platform_id = $1)`, platformID),
	}, nil
}

func (s *Service) ListCustomers(ctx context.Context, platformID string) (AdminCustomerList, error) {
	if s.db == nil {
		return AdminCustomerList{}, ErrDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT DISTINCT cp.user_id, cp.display_name, cp.city, cp.primary_phone, cp.created_at
		FROM customer_profiles cp
		LEFT JOIN orders o ON o.customer_user_id = cp.user_id
		WHERE ($1 = '' OR o.platform_id = $1)
		ORDER BY cp.created_at DESC
	`, platformID)
	if err != nil {
		return AdminCustomerList{}, err
	}
	defer rows.Close()

	items := make([]AdminCustomer, 0)
	for rows.Next() {
		var item AdminCustomer
		var createdAt time.Time
		if err := rows.Scan(&item.UserID, &item.DisplayName, &item.City, &item.PrimaryPhone, &createdAt); err != nil {
			return AdminCustomerList{}, err
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	return AdminCustomerList{Customers: items}, rows.Err()
}

func (s *Service) ListOrders(ctx context.Context, platformID string) (AdminOrderList, error) {
	if s.db == nil {
		return AdminOrderList{}, ErrDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT o.id, o.platform_id, o.customer_user_id, o.professional_user_id, off.title, o.order_type, o.status, o.payment_status, o.total_amount, o.currency, o.created_at
		FROM orders o
		JOIN offerings off ON off.id = o.offering_id
		WHERE ($1 = '' OR o.platform_id = $1)
		ORDER BY o.created_at DESC
	`, platformID)
	if err != nil {
		return AdminOrderList{}, err
	}
	defer rows.Close()

	items := make([]AdminOrder, 0)
	for rows.Next() {
		var item AdminOrder
		var createdAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.PlatformID,
			&item.CustomerUserID,
			&item.ProfessionalUserID,
			&item.OfferingTitle,
			&item.OrderType,
			&item.Status,
			&item.PaymentStatus,
			&item.TotalAmount,
			&item.Currency,
			&createdAt,
		); err != nil {
			return AdminOrderList{}, err
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	return AdminOrderList{Orders: items}, rows.Err()
}

func (s *Service) UpdateOrder(ctx context.Context, orderID string, input UpdateAdminOrderRequest) (AdminOrder, error) {
	if s.db == nil {
		return AdminOrder{}, ErrDatabaseUnavailable
	}
	if input.Status == "" && input.PaymentStatus == "" {
		return AdminOrder{}, ErrInvalidPayload
	}
	_, err := s.db.ExecContext(ctx, `
		UPDATE orders
		SET status = COALESCE(NULLIF($2, ''), status),
		    payment_status = COALESCE(NULLIF($3, ''), payment_status),
		    updated_at = now()
		WHERE id = $1
	`, orderID, input.Status, input.PaymentStatus)
	if err != nil {
		return AdminOrder{}, err
	}
	orders, err := s.ListOrders(ctx, "")
	if err != nil {
		return AdminOrder{}, err
	}
	for _, item := range orders.Orders {
		if item.ID == orderID {
			return item, nil
		}
	}
	return AdminOrder{}, ErrOrderNotFound
}

func (s *Service) ListRefunds(ctx context.Context, platformID string) (RefundList, error) {
	if s.db == nil {
		return RefundList{}, ErrDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT r.id, r.order_id, COALESCE(r.payment_id, ''), r.amount, r.currency, r.reason, r.status, r.updated_at
		FROM refunds r
		JOIN orders o ON o.id = r.order_id
		WHERE ($1 = '' OR o.platform_id = $1)
		ORDER BY r.updated_at DESC
	`, platformID)
	if err != nil {
		return RefundList{}, err
	}
	defer rows.Close()

	items := make([]RefundRecord, 0)
	for rows.Next() {
		var item RefundRecord
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.OrderID, &item.PaymentID, &item.Amount, &item.Currency, &item.Reason, &item.Status, &updatedAt); err != nil {
			return RefundList{}, err
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	return RefundList{Refunds: items}, rows.Err()
}

func (s *Service) CreateRefund(ctx context.Context, input CreateAdminRefundRequest) (RefundRecord, error) {
	if s.db == nil {
		return RefundRecord{}, ErrDatabaseUnavailable
	}
	if input.OrderID == "" || input.Amount < 0 {
		return RefundRecord{}, ErrInvalidPayload
	}
	id, err := newID("rfd_")
	if err != nil {
		return RefundRecord{}, err
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO refunds (
			id, order_id, payment_id, status, amount, currency, reason, created_at, updated_at
		) VALUES ($1, $2, NULLIF($3, ''), 'pending', $4, 'IDR', $5, now(), now())
	`, id, input.OrderID, input.PaymentID, input.Amount, input.Reason)
	if err != nil {
		return RefundRecord{}, err
	}
	return s.getRefundByID(ctx, id)
}

func (s *Service) UpdateRefund(ctx context.Context, refundID string, input UpdateRefundStatusRequest) (RefundRecord, error) {
	if s.db == nil {
		return RefundRecord{}, ErrDatabaseUnavailable
	}
	if input.Status == "" {
		return RefundRecord{}, ErrInvalidPayload
	}
	if _, err := s.db.ExecContext(ctx, `
		UPDATE refunds
		SET status = $2, updated_at = now()
		WHERE id = $1
	`, refundID, input.Status); err != nil {
		return RefundRecord{}, err
	}
	return s.getRefundByID(ctx, refundID)
}

func (s *Service) ListPayouts(ctx context.Context, platformID string) (PayoutList, error) {
	if s.db == nil {
		return PayoutList{}, ErrDatabaseUnavailable
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT p.id, p.professional_profile_id, p.amount, p.currency, p.provider, p.provider_reference, p.status, p.updated_at
		FROM payouts p
		JOIN professional_platform_profiles pp ON pp.id = p.professional_profile_id
		WHERE ($1 = '' OR pp.platform_id = $1)
		ORDER BY p.updated_at DESC
	`, platformID)
	if err != nil {
		return PayoutList{}, err
	}
	defer rows.Close()

	items := make([]PayoutRecord, 0)
	for rows.Next() {
		var item PayoutRecord
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.ProfessionalProfileID, &item.Amount, &item.Currency, &item.Provider, &item.ProviderReference, &item.Status, &updatedAt); err != nil {
			return PayoutList{}, err
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	return PayoutList{Payouts: items}, rows.Err()
}

func (s *Service) CreatePayout(ctx context.Context, input CreateAdminPayoutRequest) (PayoutRecord, error) {
	if s.db == nil {
		return PayoutRecord{}, ErrDatabaseUnavailable
	}
	if input.ProfessionalProfileID == "" || input.Amount < 0 {
		return PayoutRecord{}, ErrInvalidPayload
	}
	id, err := newID("pyo_")
	if err != nil {
		return PayoutRecord{}, err
	}
	provider := input.Provider
	if provider == "" {
		provider = "manual_test"
	}
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO payouts (
			id, professional_profile_id, status, amount, currency, provider, provider_reference, metadata, created_at, updated_at
		) VALUES ($1, $2, 'pending', $3, 'IDR', $4, '', '{}'::jsonb, now(), now())
	`, id, input.ProfessionalProfileID, input.Amount, provider); err != nil {
		return PayoutRecord{}, err
	}
	return s.getPayoutByID(ctx, id)
}

func (s *Service) UpdatePayout(ctx context.Context, payoutID string, input UpdatePayoutStatusRequest) (PayoutRecord, error) {
	if s.db == nil {
		return PayoutRecord{}, ErrDatabaseUnavailable
	}
	if input.Status == "" {
		return PayoutRecord{}, ErrInvalidPayload
	}
	if _, err := s.db.ExecContext(ctx, `
		UPDATE payouts
		SET status = $2,
		    provider_reference = COALESCE(NULLIF($3, ''), provider_reference),
		    updated_at = now()
		WHERE id = $1
	`, payoutID, input.Status, input.ProviderReference); err != nil {
		return PayoutRecord{}, err
	}
	return s.getPayoutByID(ctx, payoutID)
}

func (s *Service) Studio(ctx context.Context, platformID string) (AdminStudioSnapshot, error) {
	if s.db == nil {
		return AdminStudioSnapshot{}, ErrDatabaseUnavailable
	}
	return AdminStudioSnapshot{
		GrossRevenueAmount:  s.sum(ctx, `SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND ($1 = '' OR platform_id = $1)`, platformID),
		PaidOrders:          s.count(ctx, `SELECT COUNT(*) FROM orders WHERE payment_status = 'paid' AND ($1 = '' OR platform_id = $1)`, platformID),
		PendingRefundAmount: s.sum(ctx, `SELECT COALESCE(SUM(r.amount), 0) FROM refunds r JOIN orders o ON o.id = r.order_id WHERE r.status = 'pending' AND ($1 = '' OR o.platform_id = $1)`, platformID),
		PendingPayoutAmount: s.sum(ctx, `SELECT COALESCE(SUM(p.amount), 0) FROM payouts p JOIN professional_platform_profiles pp ON pp.id = p.professional_profile_id WHERE p.status IN ('pending', 'processing') AND ($1 = '' OR pp.platform_id = $1)`, platformID),
		SupportTickets:      s.count(ctx, `SELECT COUNT(*) FROM support_tickets WHERE ($1 = '' OR platform_id = $1)`, platformID),
	}, nil
}

func (s *Service) count(ctx context.Context, query string, platformID string) int {
	var count int
	_ = s.db.QueryRowContext(ctx, query, platformID).Scan(&count)
	return count
}

func (s *Service) sum(ctx context.Context, query string, platformID string) int {
	var value int
	_ = s.db.QueryRowContext(ctx, query, platformID).Scan(&value)
	return value
}

func (s *Service) getRefundByID(ctx context.Context, refundID string) (RefundRecord, error) {
	var item RefundRecord
	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, `
		SELECT id, order_id, COALESCE(payment_id, ''), amount, currency, reason, status, updated_at
		FROM refunds
		WHERE id = $1
	`, refundID).Scan(&item.ID, &item.OrderID, &item.PaymentID, &item.Amount, &item.Currency, &item.Reason, &item.Status, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return RefundRecord{}, ErrRefundNotFound
		}
		return RefundRecord{}, err
	}
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *Service) getPayoutByID(ctx context.Context, payoutID string) (PayoutRecord, error) {
	var item PayoutRecord
	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, `
		SELECT id, professional_profile_id, amount, currency, provider, provider_reference, status, updated_at
		FROM payouts
		WHERE id = $1
	`, payoutID).Scan(&item.ID, &item.ProfessionalProfileID, &item.Amount, &item.Currency, &item.Provider, &item.ProviderReference, &item.Status, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PayoutRecord{}, ErrPayoutNotFound
		}
		return PayoutRecord{}, err
	}
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}
