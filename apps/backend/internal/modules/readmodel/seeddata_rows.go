package readmodel

type seedDataServiceModesRow struct {
	Online    bool `json:"online"`
	HomeVisit bool `json:"homeVisit"`
	Onsite    bool `json:"onsite"`
}

type seedDataServiceRow struct {
	Index            int                     `json:"index"`
	ID               string                  `json:"id"`
	Slug             string                  `json:"slug"`
	Name             string                  `json:"name"`
	CategoryID       string                  `json:"categoryId"`
	Description      string                  `json:"description"`
	ShortDescription string                  `json:"shortDescription"`
	Image            string                  `json:"image"`
	CoverImage       string                  `json:"coverImage"`
	Tags             []string                `json:"tags"`
	Highlights       []string                `json:"highlights"`
	ServiceModes     seedDataServiceModesRow `json:"serviceModes"`
	DefaultMode      string                  `json:"defaultMode"`
}

type seedDataProfessionalRow struct {
	Index             int     `json:"index"`
	ID                string  `json:"id"`
	Slug              string  `json:"slug"`
	Name              string  `json:"name"`
	Title             string  `json:"title"`
	Gender            string  `json:"gender"`
	Location          string  `json:"location"`
	Rating            float64 `json:"rating"`
	Reviews           string  `json:"reviews"`
	Experience        string  `json:"experience"`
	ClientsServed     string  `json:"clientsServed"`
	Image             string  `json:"image"`
	CoverImage        string  `json:"coverImage"`
	BadgeLabel        string  `json:"badgeLabel"`
	AvailabilityLabel string  `json:"availabilityLabel"`
	IsAvailable       bool    `json:"isAvailable"`
	ResponseTime      string  `json:"responseTime"`
	About             string  `json:"about"`
}

type seedDataProfessionalLabelRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
}

type seedDataProfessionalPracticeLocationRow struct {
	Index          int     `json:"index"`
	ID             string  `json:"id"`
	ProfessionalID string  `json:"professionalId"`
	Label          string  `json:"label"`
	Address        string  `json:"address"`
	AreaID         string  `json:"areaId"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
}

type seedDataProfessionalPortfolioStatRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
	Value          string `json:"value"`
	Detail         string `json:"detail"`
}

type seedDataProfessionalCredentialRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Title          string `json:"title"`
	Issuer         string `json:"issuer"`
	Year           string `json:"year"`
	Note           string `json:"note"`
}

type seedDataProfessionalStoryRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Title          string `json:"title"`
	Image          string `json:"image"`
	CapturedAt     string `json:"capturedAt"`
	Location       string `json:"location"`
	Note           string `json:"note"`
}

type seedDataProfessionalPortfolioEntryRow struct {
	Index          int      `json:"index"`
	ID             string   `json:"id"`
	ProfessionalID string   `json:"professionalId"`
	Title          string   `json:"title"`
	ServiceID      string   `json:"serviceId"`
	PeriodLabel    string   `json:"periodLabel"`
	Summary        string   `json:"summary"`
	Outcomes       []string `json:"outcomes"`
	Image          string   `json:"image"`
}

type seedDataProfessionalGalleryItemRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Image          string `json:"image"`
	Alt            string `json:"alt"`
	Label          string `json:"label"`
}

type seedDataProfessionalTestimonialRow struct {
	Index          int     `json:"index"`
	ID             string  `json:"id"`
	ProfessionalID string  `json:"professionalId"`
	Author         string  `json:"author"`
	Role           string  `json:"role"`
	Rating         float64 `json:"rating"`
	DateLabel      string  `json:"dateLabel"`
	Quote          string  `json:"quote"`
	ServiceID      string  `json:"serviceId"`
	Image          string  `json:"image"`
}

type seedDataProfessionalFeedbackSummaryRow struct {
	Index              int    `json:"index"`
	ID                 string `json:"id"`
	ProfessionalID     string `json:"professionalId"`
	RecommendationRate string `json:"recommendationRate"`
	RepeatClientRate   string `json:"repeatClientRate"`
}

type seedDataProfessionalFeedbackMetricRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
	Value          string `json:"value"`
	Detail         string `json:"detail"`
}

type seedDataProfessionalFeedbackBreakdownRow struct {
	Index          int     `json:"index"`
	ID             string  `json:"id"`
	ProfessionalID string  `json:"professionalId"`
	Label          string  `json:"label"`
	Total          string  `json:"total"`
	Percentage     float64 `json:"percentage"`
}

type seedDataProfessionalRecentActivityRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	DateLabel      string `json:"dateLabel"`
	Title          string `json:"title"`
	Channel        string `json:"channel"`
	Summary        string `json:"summary"`
}

type seedDataProfessionalServiceOfferingRow struct {
	Index             int    `json:"index"`
	ID                string `json:"id"`
	ProfessionalID    string `json:"professionalId"`
	ServiceID         string `json:"serviceId"`
	Duration          string `json:"duration"`
	Price             string `json:"price"`
	DefaultMode       string `json:"defaultMode"`
	BookingFlow       string `json:"bookingFlow"`
	Summary           string `json:"summary"`
	SupportsOnline    bool   `json:"supportsOnline"`
	SupportsHomeVisit bool   `json:"supportsHomeVisit"`
	SupportsOnsite    bool   `json:"supportsOnsite"`
}

type seedDataAppointmentRecentActivityRow struct {
	DateLabel string `json:"dateLabel"`
	Title     string `json:"title"`
	Channel   string `json:"channel"`
	Summary   string `json:"summary"`
}

type seedDataAppointmentFeedbackRow struct {
	Author    string  `json:"author"`
	DateLabel string  `json:"dateLabel"`
	Image     string  `json:"image"`
	Quote     string  `json:"quote"`
	Rating    float64 `json:"rating"`
	Role      string  `json:"role"`
}

type seedDataAppointmentCancellationPolicySnapshotRow struct {
	CustomerPaidCancelCutoffHours int    `json:"customerPaidCancelCutoffHours"`
	ProfessionalCancelOutcome     string `json:"professionalCancelOutcome"`
	BeforeCutoffOutcome           string `json:"beforeCutoffOutcome"`
	AfterCutoffOutcome            string `json:"afterCutoffOutcome"`
}

type seedDataAppointmentScheduleSnapshotRow struct {
	DateISO            string `json:"dateIso"`
	RequiresSchedule   bool   `json:"requiresSchedule"`
	ScheduleDayID      string `json:"scheduleDayId"`
	ScheduleDayLabel   string `json:"scheduleDayLabel"`
	ScheduledTimeLabel string `json:"scheduledTimeLabel"`
	TimeSlotID         string `json:"timeSlotId"`
	TimeSlotLabel      string `json:"timeSlotLabel"`
}

type seedDataAppointmentTimelineEventRow struct {
	Actor           string            `json:"actor"`
	CreatedAt       string            `json:"createdAt"`
	CreatedAtLabel  string            `json:"createdAtLabel"`
	CustomerSummary string            `json:"customerSummary"`
	EvidenceURL     string            `json:"evidenceUrl"`
	FromStatus      AppointmentStatus `json:"fromStatus"`
	ID              string            `json:"id"`
	InternalNote    string            `json:"internalNote"`
	ToStatus        AppointmentStatus `json:"toStatus"`
}

type seedDataAppointmentRow struct {
	Index                      int                                              `json:"index"`
	ID                         string                                           `json:"id"`
	ConsumerID                 string                                           `json:"consumerId"`
	ProfessionalID             string                                           `json:"professionalId"`
	ServiceID                  string                                           `json:"serviceId"`
	AreaID                     string                                           `json:"areaId"`
	RequestedMode              string                                           `json:"requestedMode"`
	RequestNote                string                                           `json:"requestNote"`
	RequestedAt                string                                           `json:"requestedAt"`
	Status                     AppointmentStatus                                `json:"status"`
	ScheduledTimeLabel         string                                           `json:"scheduledTimeLabel"`
	TotalPriceLabel            string                                           `json:"totalPriceLabel"`
	RecentActivity             *seedDataAppointmentRecentActivityRow            `json:"recentActivity"`
	CustomerFeedback           *seedDataAppointmentFeedbackRow                  `json:"customerFeedback"`
	BookingFlow                string                                           `json:"bookingFlow"`
	CancellationPolicySnapshot seedDataAppointmentCancellationPolicySnapshotRow `json:"cancellationPolicySnapshot"`
	ScheduleSnapshot           seedDataAppointmentScheduleSnapshotRow           `json:"scheduleSnapshot"`
	ServiceOfferingID          string                                           `json:"serviceOfferingId"`
	Timeline                   []seedDataAppointmentTimelineEventRow            `json:"timeline"`
}

type seedDataChatThreadRow struct {
	Index            int    `json:"index"`
	ID               string `json:"id"`
	ThreadType       string `json:"threadType"`
	ProfessionalID   string `json:"professionalId"`
	AppointmentID    string `json:"appointmentId"`
	DayLabel         string `json:"dayLabel"`
	InputPlaceholder string `json:"inputPlaceholder"`
	AutoReplyText    string `json:"autoReplyText"`
}

type seedDataChatMessageRow struct {
	Index           int        `json:"index"`
	ID              string     `json:"id"`
	ThreadID        string     `json:"threadId"`
	SourceMessageID int        `json:"sourceMessageId"`
	Sender          ChatSender `json:"sender"`
	Text            string     `json:"text"`
	TimeLabel       string     `json:"timeLabel"`
	IsRead          bool       `json:"isRead"`
}

type seedDataProfessionalCoveragePolicyRow struct {
	Index             int     `json:"index"`
	ID                string  `json:"id"`
	ProfessionalID    string  `json:"professionalId"`
	HomeVisitRadiusKm int     `json:"homeVisitRadiusKm"`
	CenterLatitude    float64 `json:"centerLatitude"`
	CenterLongitude   float64 `json:"centerLongitude"`
}

type seedDataProfessionalCoverageAreaRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	AreaID         string `json:"areaId"`
}

type seedDataProfessionalAvailabilityWeeklyHoursRow struct {
	Index               int    `json:"index"`
	ID                  string `json:"id"`
	ProfessionalID      string `json:"professionalId"`
	Mode                string `json:"mode"`
	Weekday             string `json:"weekday"`
	StartTime           string `json:"startTime"`
	EndTime             string `json:"endTime"`
	SlotIntervalMinutes int    `json:"slotIntervalMinutes"`
}

type seedDataProfessionalAvailabilityPolicyRow struct {
	Index              int    `json:"index"`
	ID                 string `json:"id"`
	ProfessionalID     string `json:"professionalId"`
	Mode               string `json:"mode"`
	MinimumNoticeHours int    `json:"minimumNoticeHours"`
}

type seedDataProfessionalCancellationPolicyRow struct {
	Index                         int    `json:"index"`
	ID                            string `json:"id"`
	ProfessionalID                string `json:"professionalId"`
	Mode                          string `json:"mode"`
	CustomerPaidCancelCutoffHours int    `json:"customerPaidCancelCutoffHours"`
	ProfessionalCancelOutcome     string `json:"professionalCancelOutcome"`
	BeforeCutoffOutcome           string `json:"beforeCutoffOutcome"`
	AfterCutoffOutcome            string `json:"afterCutoffOutcome"`
}

type seedDataProfessionalAvailabilityDateOverrideRow struct {
	Index               int    `json:"index"`
	ID                  string `json:"id"`
	ProfessionalID      string `json:"professionalId"`
	Mode                string `json:"mode"`
	DateISO             string `json:"dateIso"`
	StartTime           string `json:"startTime"`
	EndTime             string `json:"endTime"`
	IsClosed            bool   `json:"isClosed"`
	Note                string `json:"note"`
	SlotIntervalMinutes int    `json:"slotIntervalMinutes"`
}

type seedDataConsumerRow struct {
	Index  int    `json:"index"`
	ID     string `json:"id"`
	Name   string `json:"name"`
	Phone  string `json:"phone"`
	Avatar string `json:"avatar"`
}

type seedDataAreaRow struct {
	Index     int     `json:"index"`
	ID        string  `json:"id"`
	City      string  `json:"city"`
	District  string  `json:"district"`
	Province  string  `json:"province"`
	Label     string  `json:"label"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type seedDataUserContextRow struct {
	Index             int     `json:"index"`
	ID                string  `json:"id"`
	SelectedAreaID    string  `json:"selectedAreaId"`
	UserLatitude      float64 `json:"userLatitude"`
	UserLongitude     float64 `json:"userLongitude"`
	OnlineStatusLabel string  `json:"onlineStatusLabel"`
}

type seedDataRuntimeSelectionRow struct {
	Index                int    `json:"index"`
	ID                   string `json:"id"`
	CurrentConsumerID    string `json:"currentConsumerId"`
	CurrentUserContextID string `json:"currentUserContextId"`
	ActiveHomeFeedID     string `json:"activeHomeFeedId"`
	ActiveMediaPresetID  string `json:"activeMediaPresetId"`
	CurrentDateTimeISO   string `json:"currentDateTimeIso"`
}

type seedDataHomeFeedRow struct {
	Index         int    `json:"index"`
	ID            string `json:"id"`
	Title         string `json:"title"`
	ConsumerID    string `json:"consumerId"`
	UserContextID string `json:"userContextId"`
}

type seedDataHomeFeedFeaturedAppointmentRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	HomeFeedID     string `json:"homeFeedId"`
	AppointmentID  string `json:"appointmentId"`
	DateLabel      string `json:"dateLabel"`
	TimeLabel      string `json:"timeLabel"`
	ProfessionalID string `json:"professionalId"`
}

type seedDataHomeFeedPopularServiceRow struct {
	Index      int    `json:"index"`
	ID         string `json:"id"`
	HomeFeedID string `json:"homeFeedId"`
	ServiceID  string `json:"serviceId"`
}

type seedDataHomeFeedNearbyProfessionalRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	HomeFeedID     string `json:"homeFeedId"`
	ProfessionalID string `json:"professionalId"`
}

type seedDataAppSectionConfigRow struct {
	Index      int    `json:"index"`
	ID         string `json:"id"`
	Section    string `json:"section"`
	ConfigKey  string `json:"configKey"`
	EntityType string `json:"entityType"`
	EntityID   string `json:"entityId"`
}
