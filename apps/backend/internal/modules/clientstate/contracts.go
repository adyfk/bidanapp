package clientstate

type ViewerSessionData struct {
	Mode string `json:"mode" doc:"Viewer mode: visitor, customer, or professional"`
}

type CustomerNotificationStateData struct {
	ReadIDs []string `json:"readIds"`
}

type CustomerPushSubscriptionKeysData struct {
	Auth   string `json:"auth"`
	P256DH string `json:"p256dh"`
}

type CustomerPushSubscriptionData struct {
	Endpoint  string                            `json:"endpoint"`
	Keys      CustomerPushSubscriptionKeysData  `json:"keys"`
	Locale    string                            `json:"locale,omitempty"`
	UserAgent string                            `json:"userAgent,omitempty"`
}

type ProfessionalNotificationStateData struct {
	ReadIDsByProfessional map[string][]string `json:"readIdsByProfessional"`
}

type GeoPointData struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type ResolvedLocationData struct {
	AreaID           string       `json:"areaId"`
	AreaLabel        string       `json:"areaLabel"`
	City             string       `json:"city"`
	Country          string       `json:"country"`
	District         string       `json:"district"`
	FormattedAddress string       `json:"formattedAddress"`
	Point            GeoPointData `json:"point"`
	PostalCode       string       `json:"postalCode"`
	Precision        string       `json:"precision"`
	Province         string       `json:"province"`
	Source           string       `json:"source"`
}

type ConsumerPreferencesData struct {
	ConsumerID              string               `json:"consumerId,omitempty"`
	FavoriteProfessionalIDs []string             `json:"favoriteProfessionalIds"`
	ResolvedLocation        ResolvedLocationData `json:"resolvedLocation"`
	SelectedAreaID          string               `json:"selectedAreaId,omitempty"`
	UserLocation            GeoPointData         `json:"userLocation"`
}

type AdminSessionData struct {
	AdminID          string `json:"adminId"`
	Email            string `json:"email"`
	FocusArea        string `json:"focusArea"`
	IsAuthenticated  bool   `json:"isAuthenticated"`
	LastLoginAt      string `json:"lastLoginAt,omitempty"`
	LastVisitedRoute string `json:"lastVisitedRoute,omitempty"`
}

type SupportTicketData struct {
	AssignedAdminID       string `json:"assignedAdminId,omitempty"`
	CategoryID            string `json:"categoryId"`
	ContactValue          string `json:"contactValue"`
	CreatedAt             string `json:"createdAt"`
	Details               string `json:"details"`
	EtaKey                string `json:"etaKey"`
	ID                    string `json:"id"`
	PreferredChannel      string `json:"preferredChannel"`
	ReferenceCode         string `json:"referenceCode,omitempty"`
	RelatedAppointmentID  string `json:"relatedAppointmentId,omitempty"`
	RelatedProfessionalID string `json:"relatedProfessionalId,omitempty"`
	ReporterName          string `json:"reporterName"`
	ReporterPhone         string `json:"reporterPhone"`
	ReporterRole          string `json:"reporterRole"`
	SourceSurface         string `json:"sourceSurface"`
	Status                string `json:"status"`
	Summary               string `json:"summary"`
	UpdatedAt             string `json:"updatedAt"`
	Urgency               string `json:"urgency"`
}

type AdminCommandCenterStateData struct {
	ActiveAdminID             string `json:"activeAdminId"`
	CommandNote               string `json:"commandNote"`
	FocusArea                 string `json:"focusArea"`
	HighlightedProfessionalID string `json:"highlightedProfessionalId"`
	IncidentMode              string `json:"incidentMode"`
	RuntimeNarrative          string `json:"runtimeNarrative"`
	WatchAreaID               string `json:"watchAreaId"`
}

type SupportDeskData struct {
	CommandCenter AdminCommandCenterStateData `json:"commandCenter"`
	SavedAt       string                      `json:"savedAt,omitempty"`
	SchemaVersion int                         `json:"schemaVersion"`
	Tickets       []SupportTicketData         `json:"tickets"`
}

type AdminConsoleData struct {
	SavedAt       string                      `json:"savedAt,omitempty"`
	SchemaVersion int                         `json:"schemaVersion"`
	Tables        map[string][]map[string]any `json:"tables"`
}

type AdminConsoleTableUpsertData struct {
	SavedAt       string           `json:"savedAt,omitempty"`
	SchemaVersion int              `json:"schemaVersion"`
	Rows          []map[string]any `json:"rows"`
}

type AdminConsoleTableData struct {
	TableName     string           `json:"tableName"`
	SavedAt       string           `json:"savedAt,omitempty"`
	SchemaVersion int              `json:"schemaVersion"`
	Rows          []map[string]any `json:"rows"`
}
