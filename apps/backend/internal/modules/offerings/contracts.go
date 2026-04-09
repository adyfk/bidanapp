package offerings

const SecuritySchemeName = "ViewerSessionAuth"

type PlatformOffering struct {
	Currency              string         `json:"currency"`
	DeliveryMode          string         `json:"deliveryMode"`
	Description           string         `json:"description"`
	FulfillmentTemplate   map[string]any `json:"fulfillmentTemplate,omitempty"`
	ID                    string         `json:"id"`
	OfferingType          string         `json:"offeringType"`
	PlatformID            string         `json:"platformId"`
	PriceAmount           int            `json:"priceAmount"`
	ProfessionalProfileID string         `json:"professionalProfileId"`
	ProfessionalUserID    string         `json:"professionalUserId"`
	Slug                  string         `json:"slug"`
	Status                string         `json:"status"`
	Title                 string         `json:"title"`
}

type PlatformOfferingList struct {
	Offerings []PlatformOffering `json:"offerings"`
}

type CreatePlatformOfferingRequest struct {
	DeliveryMode        string         `json:"deliveryMode"`
	Description         string         `json:"description,omitempty"`
	FulfillmentTemplate map[string]any `json:"fulfillmentTemplate,omitempty"`
	OfferingType        string         `json:"offeringType"`
	PriceAmount         int            `json:"priceAmount"`
	Title               string         `json:"title"`
}
