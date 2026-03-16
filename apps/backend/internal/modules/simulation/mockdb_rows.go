package simulation

type mockDBServiceModesRow struct {
	Online    bool `json:"online"`
	HomeVisit bool `json:"homeVisit"`
	Onsite    bool `json:"onsite"`
}

type mockDBServiceRow struct {
	Index            int                   `json:"index"`
	ID               string                `json:"id"`
	Slug             string                `json:"slug"`
	Name             string                `json:"name"`
	CategoryID       string                `json:"categoryId"`
	Description      string                `json:"description"`
	ShortDescription string                `json:"shortDescription"`
	Image            string                `json:"image"`
	CoverImage       string                `json:"coverImage"`
	Tags             []string              `json:"tags"`
	Highlights       []string              `json:"highlights"`
	ServiceModes     mockDBServiceModesRow `json:"serviceModes"`
	DefaultMode      string                `json:"defaultMode"`
}

type mockDBProfessionalRow struct {
	Index             int     `json:"index"`
	ID                string  `json:"id"`
	Slug              string  `json:"slug"`
	Name              string  `json:"name"`
	Title             string  `json:"title"`
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

type mockDBProfessionalLabelRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
}

type mockDBProfessionalPracticeLocationRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
	Address        string `json:"address"`
}

type mockDBProfessionalPortfolioStatRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
	Value          string `json:"value"`
	Detail         string `json:"detail"`
}

type mockDBProfessionalCredentialRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Title          string `json:"title"`
	Issuer         string `json:"issuer"`
	Year           string `json:"year"`
	Note           string `json:"note"`
}

type mockDBProfessionalStoryRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Title          string `json:"title"`
	Image          string `json:"image"`
	CapturedAt     string `json:"capturedAt"`
	Location       string `json:"location"`
	Note           string `json:"note"`
}

type mockDBProfessionalPortfolioEntryRow struct {
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

type mockDBProfessionalGalleryItemRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Image          string `json:"image"`
	Alt            string `json:"alt"`
	Label          string `json:"label"`
}

type mockDBProfessionalTestimonialRow struct {
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

type mockDBProfessionalFeedbackSummaryRow struct {
	Index              int    `json:"index"`
	ID                 string `json:"id"`
	ProfessionalID     string `json:"professionalId"`
	RecommendationRate string `json:"recommendationRate"`
	RepeatClientRate   string `json:"repeatClientRate"`
}

type mockDBProfessionalFeedbackMetricRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	Label          string `json:"label"`
	Value          string `json:"value"`
	Detail         string `json:"detail"`
}

type mockDBProfessionalFeedbackBreakdownRow struct {
	Index          int     `json:"index"`
	ID             string  `json:"id"`
	ProfessionalID string  `json:"professionalId"`
	Label          string  `json:"label"`
	Total          string  `json:"total"`
	Percentage     float64 `json:"percentage"`
}

type mockDBProfessionalRecentActivityRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	DateLabel      string `json:"dateLabel"`
	Title          string `json:"title"`
	Channel        string `json:"channel"`
	Summary        string `json:"summary"`
}

type mockDBProfessionalServiceOfferingRow struct {
	Index          int    `json:"index"`
	ID             string `json:"id"`
	ProfessionalID string `json:"professionalId"`
	ServiceID      string `json:"serviceId"`
	Duration       string `json:"duration"`
	Price          string `json:"price"`
	Summary        string `json:"summary"`
}

type mockDBAppointmentRow struct {
	Index              int               `json:"index"`
	ID                 string            `json:"id"`
	ConsumerID         string            `json:"consumerId"`
	ProfessionalID     string            `json:"professionalId"`
	ServiceID          string            `json:"serviceId"`
	Status             AppointmentStatus `json:"status"`
	ScheduledTimeLabel string            `json:"scheduledTimeLabel"`
	TotalPriceLabel    string            `json:"totalPriceLabel"`
}

type mockDBChatThreadRow struct {
	Index            int    `json:"index"`
	ID               string `json:"id"`
	ThreadType       string `json:"threadType"`
	ProfessionalID   string `json:"professionalId"`
	AppointmentID    string `json:"appointmentId"`
	DayLabel         string `json:"dayLabel"`
	InputPlaceholder string `json:"inputPlaceholder"`
	AutoReplyText    string `json:"autoReplyText"`
}

type mockDBChatMessageRow struct {
	Index           int        `json:"index"`
	ID              string     `json:"id"`
	ThreadID        string     `json:"threadId"`
	SourceMessageID int        `json:"sourceMessageId"`
	Sender          ChatSender `json:"sender"`
	Text            string     `json:"text"`
	TimeLabel       string     `json:"timeLabel"`
	IsRead          bool       `json:"isRead"`
}
