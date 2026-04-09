package adminops

const SecuritySchemeName = "AdminSessionAuth"

type AdminOverview struct {
	ActiveOrders         int `json:"activeOrders"`
	OpenSupportTickets   int `json:"openSupportTickets"`
	PendingApplications  int `json:"pendingApplications"`
	PendingPayouts       int `json:"pendingPayouts"`
	PendingRefunds       int `json:"pendingRefunds"`
	TotalCustomers       int `json:"totalCustomers"`
	TotalProfessionals   int `json:"totalProfessionals"`
}

type AdminCustomer struct {
	City         string `json:"city"`
	CreatedAt    string `json:"createdAt"`
	DisplayName  string `json:"displayName"`
	PrimaryPhone string `json:"primaryPhone"`
	UserID       string `json:"userId"`
}

type AdminCustomerList struct {
	Customers []AdminCustomer `json:"customers"`
}

type AdminOrder struct {
	CreatedAt          string `json:"createdAt"`
	CustomerUserID     string `json:"customerUserId"`
	Currency           string `json:"currency"`
	ID                 string `json:"id"`
	OfferingTitle      string `json:"offeringTitle"`
	OrderType          string `json:"orderType"`
	PaymentStatus      string `json:"paymentStatus"`
	PlatformID         string `json:"platformId"`
	ProfessionalUserID string `json:"professionalUserId"`
	Status             string `json:"status"`
	TotalAmount        int    `json:"totalAmount"`
}

type AdminOrderList struct {
	Orders []AdminOrder `json:"orders"`
}

type UpdateAdminOrderRequest struct {
	PaymentStatus string `json:"paymentStatus,omitempty"`
	Status        string `json:"status,omitempty"`
}

type RefundRecord struct {
	Amount    int    `json:"amount"`
	Currency  string `json:"currency"`
	ID        string `json:"id"`
	OrderID   string `json:"orderId"`
	PaymentID string `json:"paymentId,omitempty"`
	Reason    string `json:"reason"`
	Status    string `json:"status"`
	UpdatedAt string `json:"updatedAt"`
}

type RefundList struct {
	Refunds []RefundRecord `json:"refunds"`
}

type CreateAdminRefundRequest struct {
	Amount    int    `json:"amount"`
	OrderID   string `json:"orderId" required:"true"`
	PaymentID string `json:"paymentId,omitempty"`
	Reason    string `json:"reason,omitempty"`
}

type UpdateRefundStatusRequest struct {
	Status string `json:"status" required:"true"`
}

type PayoutRecord struct {
	Amount                int    `json:"amount"`
	Currency              string `json:"currency"`
	ID                    string `json:"id"`
	ProfessionalProfileID string `json:"professionalProfileId"`
	Provider              string `json:"provider"`
	ProviderReference     string `json:"providerReference,omitempty"`
	Status                string `json:"status"`
	UpdatedAt             string `json:"updatedAt"`
}

type PayoutList struct {
	Payouts []PayoutRecord `json:"payouts"`
}

type CreateAdminPayoutRequest struct {
	Amount                int    `json:"amount"`
	ProfessionalProfileID string `json:"professionalProfileId" required:"true"`
	Provider              string `json:"provider,omitempty"`
}

type UpdatePayoutStatusRequest struct {
	ProviderReference string `json:"providerReference,omitempty"`
	Status            string `json:"status" required:"true"`
}

type AdminStudioSnapshot struct {
	GrossRevenueAmount  int `json:"grossRevenueAmount"`
	PaidOrders          int `json:"paidOrders"`
	PendingPayoutAmount int `json:"pendingPayoutAmount"`
	PendingRefundAmount int `json:"pendingRefundAmount"`
	SupportTickets      int `json:"supportTickets"`
}
