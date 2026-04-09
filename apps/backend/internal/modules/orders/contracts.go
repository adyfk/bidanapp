package orders

const SecuritySchemeName = "ViewerSessionAuth"

type CustomerPlatformOrder struct {
	Currency           string         `json:"currency"`
	FulfillmentDetails map[string]any `json:"fulfillmentDetails"`
	ID                 string         `json:"id"`
	OfferingID         string         `json:"offeringId"`
	OfferingTitle      string         `json:"offeringTitle"`
	OrderType          string         `json:"orderType"`
	PaymentStatus      string         `json:"paymentStatus"`
	PlatformID         string         `json:"platformId"`
	ProfessionalUserID string         `json:"professionalUserId,omitempty"`
	Status             string         `json:"status"`
	TotalAmount        int            `json:"totalAmount"`
}

type CustomerPlatformOrderList struct {
	Orders []CustomerPlatformOrder `json:"orders"`
}

type CreatePlatformOrderRequest struct {
	FulfillmentDetails map[string]any `json:"fulfillmentDetails,omitempty"`
	OfferingID         string         `json:"offeringId"`
}

type CreateOrderPaymentSessionRequest struct {
	Provider  string `json:"provider,omitempty"`
	ReturnURL string `json:"returnUrl,omitempty"`
}

type OrderPaymentSession struct {
	Amount            int    `json:"amount"`
	CheckoutURL       string `json:"checkoutUrl"`
	Currency          string `json:"currency"`
	OrderID           string `json:"orderId"`
	PaymentID         string `json:"paymentId"`
	Provider          string `json:"provider"`
	ProviderReference string `json:"providerReference"`
	Status            string `json:"status"`
}

type PaymentWebhookRequest struct {
	OrderID           string `json:"orderId,omitempty"`
	PaymentID         string `json:"paymentId,omitempty"`
	ProviderReference string `json:"providerReference,omitempty"`
	Status            string `json:"status" required:"true"`
}
