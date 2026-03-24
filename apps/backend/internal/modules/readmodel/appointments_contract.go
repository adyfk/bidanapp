package readmodel

type AppointmentStatus string

const (
	AppointmentStatusRequested              AppointmentStatus = "requested"
	AppointmentStatusApprovedWaitingPayment AppointmentStatus = "approved_waiting_payment"
	AppointmentStatusPaid                   AppointmentStatus = "paid"
	AppointmentStatusConfirmed              AppointmentStatus = "confirmed"
	AppointmentStatusInService              AppointmentStatus = "in_service"
	AppointmentStatusCompleted              AppointmentStatus = "completed"
	AppointmentStatusCancelled              AppointmentStatus = "cancelled"
	AppointmentStatusRejected               AppointmentStatus = "rejected"
	AppointmentStatusExpired                AppointmentStatus = "expired"
)

type AppointmentRecentActivity struct {
	DateLabel string `json:"dateLabel"`
	Title     string `json:"title"`
	Channel   string `json:"channel"`
	Summary   string `json:"summary"`
}

type AppointmentFeedback struct {
	Author    string  `json:"author"`
	DateLabel string  `json:"dateLabel"`
	Image     string  `json:"image"`
	Quote     string  `json:"quote"`
	Rating    float64 `json:"rating"`
	Role      string  `json:"role"`
}

type AppointmentCancellationPolicySnapshot struct {
	CustomerPaidCancelCutoffHours int    `json:"customerPaidCancelCutoffHours"`
	ProfessionalCancelOutcome     string `json:"professionalCancelOutcome"`
	BeforeCutoffOutcome           string `json:"beforeCutoffOutcome"`
	AfterCutoffOutcome            string `json:"afterCutoffOutcome"`
}

type AppointmentServiceSnapshot struct {
	BookingFlow       string      `json:"bookingFlow"`
	CategoryID        string      `json:"categoryId"`
	CoverImage        string      `json:"coverImage"`
	DefaultMode       string      `json:"defaultMode"`
	Description       string      `json:"description"`
	DurationLabel     string      `json:"durationLabel"`
	Highlights        []string    `json:"highlights"`
	Image             string      `json:"image"`
	Name              string      `json:"name"`
	PriceAmount       int         `json:"priceAmount"`
	PriceLabel        string      `json:"priceLabel"`
	ServiceID         string      `json:"serviceId"`
	ServiceModes      ServiceMode `json:"serviceModes"`
	ServiceOfferingID string      `json:"serviceOfferingId"`
	ShortDescription  string      `json:"shortDescription"`
	Slug              string      `json:"slug"`
	Summary           string      `json:"summary"`
	Tags              []string    `json:"tags"`
}

type AppointmentScheduleSnapshot struct {
	DateISO            string `json:"dateIso,omitempty"`
	RequiresSchedule   bool   `json:"requiresSchedule"`
	ScheduleDayID      string `json:"scheduleDayId,omitempty"`
	ScheduleDayLabel   string `json:"scheduleDayLabel,omitempty"`
	ScheduledTimeLabel string `json:"scheduledTimeLabel"`
	TimeSlotID         string `json:"timeSlotId,omitempty"`
	TimeSlotLabel      string `json:"timeSlotLabel,omitempty"`
}

type AppointmentTimelineEvent struct {
	Actor           string            `json:"actor"`
	CreatedAt       string            `json:"createdAt"`
	CreatedAtLabel  string            `json:"createdAtLabel"`
	CustomerSummary string            `json:"customerSummary,omitempty"`
	EvidenceURL     string            `json:"evidenceUrl,omitempty"`
	FromStatus      AppointmentStatus `json:"fromStatus,omitempty"`
	ID              string            `json:"id"`
	InternalNote    string            `json:"internalNote,omitempty"`
	ToStatus        AppointmentStatus `json:"toStatus"`
}

type AppointmentCancellationResolution struct {
	CancelledAt        string `json:"cancelledAt"`
	CancelledBy        string `json:"cancelledBy"`
	CancellationReason string `json:"cancellationReason"`
	FinancialOutcome   string `json:"financialOutcome"`
}

type AppointmentSeed struct {
	Index                      int                                   `json:"index"`
	ID                         string                                `json:"id"`
	ConsumerID                 string                                `json:"consumerId"`
	ProfessionalID             string                                `json:"professionalId"`
	ServiceID                  string                                `json:"serviceId"`
	AreaID                     string                                `json:"areaId"`
	RequestedMode              string                                `json:"requestedMode"`
	RequestNote                string                                `json:"requestNote"`
	RequestedAt                string                                `json:"requestedAt"`
	Status                     AppointmentStatus                     `json:"status"`
	ScheduledTimeLabel         string                                `json:"scheduledTimeLabel"`
	TotalPriceLabel            string                                `json:"totalPriceLabel"`
	RecentActivity             *AppointmentRecentActivity            `json:"recentActivity,omitempty"`
	CustomerFeedback           *AppointmentFeedback                  `json:"customerFeedback,omitempty"`
	BookingFlow                string                                `json:"bookingFlow"`
	CancellationPolicySnapshot AppointmentCancellationPolicySnapshot `json:"cancellationPolicySnapshot"`
	CancellationResolution     *AppointmentCancellationResolution    `json:"cancellationResolution,omitempty"`
	ScheduleSnapshot           AppointmentScheduleSnapshot           `json:"scheduleSnapshot"`
	ServiceOfferingID          string                                `json:"serviceOfferingId"`
	ServiceSnapshot            AppointmentServiceSnapshot            `json:"serviceSnapshot"`
	Timeline                   []AppointmentTimelineEvent            `json:"timeline"`
}

type AppointmentData struct {
	Appointments []AppointmentSeed `json:"appointments"`
}
