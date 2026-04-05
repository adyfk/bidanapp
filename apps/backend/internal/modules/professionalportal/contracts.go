package professionalportal

import "bidanapp/apps/backend/internal/modules/readmodel"

type ProfessionalPortalReviewState struct {
	AdminNote    string `json:"adminNote,omitempty"`
	PublishedAt  string `json:"publishedAt,omitempty"`
	ReviewedAt   string `json:"reviewedAt,omitempty"`
	ReviewerName string `json:"reviewerName,omitempty"`
	Status       string `json:"status"`
	SubmittedAt  string `json:"submittedAt,omitempty"`
}

type ProfessionalPortalSessionData struct {
	AvailableProfessionalIDs []string       `json:"availableProfessionalIds,omitempty"`
	HasSnapshot              bool           `json:"hasSnapshot"`
	LastActiveProfessionalID string         `json:"lastActiveProfessionalId,omitempty"`
	ProfessionalID           string         `json:"professionalId,omitempty"`
	SavedAt                  string         `json:"savedAt,omitempty"`
	Snapshot                 map[string]any `json:"snapshot,omitempty"`
}

type UpsertProfessionalPortalSessionRequest struct {
	ProfessionalID string         `json:"professionalId,omitempty"`
	Snapshot       map[string]any `json:"snapshot"`
}

type ProfessionalPortalProfileData struct {
	AcceptingNewClients        bool                          `json:"acceptingNewClients"`
	AutoApproveInstantBookings bool                          `json:"autoApproveInstantBookings"`
	City                       string                        `json:"city"`
	CredentialNumber           string                        `json:"credentialNumber"`
	DisplayName                string                        `json:"displayName"`
	Phone                      string                        `json:"phone"`
	ProfessionalID             string                        `json:"professionalId"`
	PublicBio                  string                        `json:"publicBio"`
	ResponseTimeGoal           string                        `json:"responseTimeGoal"`
	ReviewState                ProfessionalPortalReviewState `json:"reviewState"`
	YearsExperience            string                        `json:"yearsExperience"`
}

type ProfessionalPortalAdminReviewStateData struct {
	AcceptingNewClients *bool                         `json:"acceptingNewClients,omitempty"`
	ProfessionalID      string                        `json:"professionalId"`
	ReviewState         ProfessionalPortalReviewState `json:"reviewState"`
}

type ProfessionalPortalAdminReviewStatesData struct {
	ProfilesByProfessionalID     map[string]ProfessionalPortalProfileData `json:"profilesByProfessionalId,omitempty"`
	ReviewStatesByProfessionalID map[string]ProfessionalPortalReviewState `json:"reviewStatesByProfessionalId"`
}

type ProfessionalPortalCoverageData struct {
	AcceptingNewClients        bool                                               `json:"acceptingNewClients"`
	AutoApproveInstantBookings bool                                               `json:"autoApproveInstantBookings"`
	AvailabilityRulesByMode    map[string]readmodel.ProfessionalAvailabilityRules `json:"availabilityRulesByMode,omitempty"`
	City                       string                                             `json:"city"`
	CoverageAreaIDs            []string                                           `json:"coverageAreaIds"`
	CoverageCenter             readmodel.GeoPoint                                 `json:"coverageCenter"`
	HomeVisitRadiusKm          int                                                `json:"homeVisitRadiusKm"`
	PracticeAddress            string                                             `json:"practiceAddress"`
	PracticeLabel              string                                             `json:"practiceLabel"`
	ProfessionalID             string                                             `json:"professionalId"`
	PublicBio                  string                                             `json:"publicBio"`
	ResponseTimeGoal           string                                             `json:"responseTimeGoal"`
}

type ProfessionalPortalManagedService struct {
	BookingFlow  string                `json:"bookingFlow"`
	DefaultMode  string                `json:"defaultMode"`
	Duration     string                `json:"duration"`
	Featured     bool                  `json:"featured"`
	ID           string                `json:"id"`
	Index        int                   `json:"index"`
	IsActive     bool                  `json:"isActive"`
	Price        string                `json:"price"`
	ServiceID    string                `json:"serviceId"`
	ServiceModes readmodel.ServiceMode `json:"serviceModes"`
	Source       string                `json:"source"`
	Summary      string                `json:"summary"`
}

type ProfessionalPortalServicesData struct {
	ProfessionalID        string                             `json:"professionalId"`
	ServiceConfigurations []ProfessionalPortalManagedService `json:"serviceConfigurations"`
}

type ProfessionalPortalPortfolioEntry struct {
	ID          string   `json:"id"`
	Index       int      `json:"index"`
	Image       string   `json:"image"`
	Outcomes    []string `json:"outcomes"`
	PeriodLabel string   `json:"periodLabel"`
	ServiceID   string   `json:"serviceId,omitempty"`
	Summary     string   `json:"summary"`
	Title       string   `json:"title"`
	Visibility  string   `json:"visibility"`
}

type ProfessionalPortalPortfolioData struct {
	PortfolioEntries []ProfessionalPortalPortfolioEntry `json:"portfolioEntries"`
	ProfessionalID   string                             `json:"professionalId"`
}

type ProfessionalPortalGalleryItem struct {
	Alt        string `json:"alt"`
	ID         string `json:"id"`
	Image      string `json:"image"`
	Index      int    `json:"index"`
	IsFeatured bool   `json:"isFeatured"`
	Label      string `json:"label"`
}

type ProfessionalPortalGalleryData struct {
	GalleryItems   []ProfessionalPortalGalleryItem `json:"galleryItems"`
	ProfessionalID string                          `json:"professionalId"`
}

type ProfessionalPortalCredential struct {
	ID     string `json:"id"`
	Index  int    `json:"index"`
	Issuer string `json:"issuer"`
	Note   string `json:"note"`
	Title  string `json:"title"`
	Year   string `json:"year"`
}

type ProfessionalPortalActivityStory struct {
	CapturedAt string `json:"capturedAt"`
	ID         string `json:"id"`
	Image      string `json:"image"`
	Index      int    `json:"index"`
	Location   string `json:"location"`
	Note       string `json:"note"`
	Title      string `json:"title"`
}

type ProfessionalPortalTrustData struct {
	ActivityStories []ProfessionalPortalActivityStory `json:"activityStories"`
	Credentials     []ProfessionalPortalCredential    `json:"credentials"`
	ProfessionalID  string                            `json:"professionalId"`
}

type ProfessionalPortalAppointmentServiceSnapshot struct {
	BookingFlow       string                `json:"bookingFlow"`
	CategoryID        string                `json:"categoryId"`
	CoverImage        string                `json:"coverImage"`
	DefaultMode       string                `json:"defaultMode"`
	Description       string                `json:"description"`
	DurationLabel     string                `json:"durationLabel"`
	Highlights        []string              `json:"highlights"`
	Image             string                `json:"image"`
	Name              string                `json:"name"`
	PriceAmount       int                   `json:"priceAmount"`
	PriceLabel        string                `json:"priceLabel"`
	ServiceID         string                `json:"serviceId"`
	ServiceModes      readmodel.ServiceMode `json:"serviceModes"`
	ServiceOfferingID string                `json:"serviceOfferingId"`
	ShortDescription  string                `json:"shortDescription"`
	Slug              string                `json:"slug"`
	Summary           string                `json:"summary"`
	Tags              []string              `json:"tags"`
}

type ProfessionalPortalAppointmentScheduleSnapshot struct {
	DateISO            string `json:"dateIso,omitempty"`
	RequiresSchedule   bool   `json:"requiresSchedule"`
	ScheduleDayID      string `json:"scheduleDayId,omitempty"`
	ScheduleDayLabel   string `json:"scheduleDayLabel,omitempty"`
	ScheduledTimeLabel string `json:"scheduledTimeLabel"`
	TimeSlotID         string `json:"timeSlotId,omitempty"`
	TimeSlotLabel      string `json:"timeSlotLabel,omitempty"`
}

type ProfessionalPortalAppointmentCancellationResolution struct {
	CancelledAt        string `json:"cancelledAt"`
	CancelledBy        string `json:"cancelledBy"`
	CancellationReason string `json:"cancellationReason"`
	FinancialOutcome   string `json:"financialOutcome"`
}

type ProfessionalPortalAppointmentTimelineEvent struct {
	Actor           string                      `json:"actor"`
	CreatedAt       string                      `json:"createdAt"`
	CreatedAtLabel  string                      `json:"createdAtLabel"`
	CustomerSummary string                      `json:"customerSummary,omitempty"`
	EvidenceURL     string                      `json:"evidenceUrl,omitempty"`
	FromStatus      readmodel.AppointmentStatus `json:"fromStatus,omitempty"`
	ID              string                      `json:"id"`
	InternalNote    string                      `json:"internalNote,omitempty"`
	ToStatus        readmodel.AppointmentStatus `json:"toStatus"`
}

type ProfessionalPortalManagedAppointmentRecord struct {
	AreaID                     string                                               `json:"areaId"`
	BookingFlow                string                                               `json:"bookingFlow"`
	CancellationPolicySnapshot readmodel.ProfessionalCancellationPolicy             `json:"cancellationPolicySnapshot"`
	CancellationResolution     *ProfessionalPortalAppointmentCancellationResolution `json:"cancellationResolution,omitempty"`
	ConsumerID                 string                                               `json:"consumerId"`
	ID                         string                                               `json:"id"`
	Index                      int                                                  `json:"index"`
	ProfessionalID             string                                               `json:"professionalId"`
	RequestNote                string                                               `json:"requestNote"`
	RequestedAt                string                                               `json:"requestedAt"`
	RequestedMode              string                                               `json:"requestedMode"`
	ScheduleSnapshot           ProfessionalPortalAppointmentScheduleSnapshot        `json:"scheduleSnapshot"`
	ServiceID                  string                                               `json:"serviceId"`
	ServiceOfferingID          string                                               `json:"serviceOfferingId"`
	ServiceSnapshot            ProfessionalPortalAppointmentServiceSnapshot         `json:"serviceSnapshot"`
	Status                     readmodel.AppointmentStatus                          `json:"status"`
	Timeline                   []ProfessionalPortalAppointmentTimelineEvent         `json:"timeline"`
}

type ProfessionalPortalRequestsData struct {
	AppointmentRecords []ProfessionalPortalManagedAppointmentRecord `json:"appointmentRecords"`
	ProfessionalID     string                                       `json:"professionalId"`
}
