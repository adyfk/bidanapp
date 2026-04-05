package appointmentstore

import (
	"context"
	"errors"
	"sort"
	"time"
)

var ErrNotFound = errors.New("appointmentstore record not found")

const (
	StatusRequested       = "requested"
	StatusAwaitingPayment = "awaiting_payment"
	StatusConfirmed       = "confirmed"
	StatusInService       = "in_service"
	StatusCompleted       = "completed"
	StatusCancelled       = "cancelled"
	StatusRejected        = "rejected"
	StatusExpired         = "expired"
)

type HomeVisitExecution struct {
	AppointmentID               string
	ProfessionalID              string
	ConsumerID                  string
	RequestedMode               string
	ExecutionStatus             string
	DepartureOriginLat          *float64
	DepartureOriginLng          *float64
	DestinationLat              *float64
	DestinationLng              *float64
	DistanceKMHint              *float64
	ETAMinutesHint              *int
	DepartedAt                  *time.Time
	ServiceStartedAt            *time.Time
	ClosedAt                    *time.Time
	LastComputedAt              *time.Time
	DepartureNotificationSentAt *time.Time
	CreatedAt                   time.Time
	UpdatedAt                   time.Time
}

type AppointmentRecord struct {
	ID                         string
	ConsumerID                 string
	ProfessionalID             string
	ServiceID                  string
	ServiceOfferingID          string
	AreaID                     string
	BookingFlow                string
	RequestedMode              string
	RequestNote                string
	RequestedAt                time.Time
	Status                     string
	TotalPriceAmount           int
	TotalPriceLabel            string
	Currency                   string
	LatestPaymentRequestID     string
	ServiceSnapshot            map[string]any
	ScheduleSnapshot           map[string]any
	PricingSnapshot            map[string]any
	CancellationPolicySnapshot map[string]any
	CancellationResolution     map[string]any
	RecentActivity             map[string]any
	CustomerFeedback           map[string]any
	CreatedAt                  time.Time
	UpdatedAt                  time.Time
}

type AppointmentStatusEvent struct {
	ID              string
	AppointmentID   string
	FromStatus      string
	ToStatus        string
	ActorKind       string
	ActorID         string
	ActorName       string
	CustomerSummary string
	InternalNote    string
	EvidenceURL     string
	CreatedAt       time.Time
	CreatedAtLabel  string
}

type AppointmentChangeRequest struct {
	ID                        string
	AppointmentID             string
	RequestedByKind           string
	RequestedByID             string
	ChangeType                string
	Status                    string
	RequestedMode             string
	RequestedScheduleSnapshot map[string]any
	Reason                    string
	AdminNote                 string
	CreatedAt                 time.Time
	ResolvedAt                *time.Time
}

type AppointmentParticipant struct {
	AppointmentID   string
	ParticipantKind string
	ParticipantID   string
	DisplayName     string
	CreatedAt       time.Time
}

type AppointmentOperationalEvent struct {
	ID            string
	AppointmentID string
	EventType     string
	ActorKind     string
	ActorID       string
	Payload       map[string]any
	CreatedAt     time.Time
}

type PaymentRequest struct {
	ID                  string
	AppointmentID       string
	Provider            string
	ExternalID          string
	Status              string
	Currency            string
	Amount              int
	CheckoutURL         string
	ProviderReferenceID string
	PaymentMethod       string
	ExpiresAt           *time.Time
	PaidAt              *time.Time
	Metadata            map[string]any
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type PaymentEvent struct {
	ID               string
	PaymentRequestID string
	Provider         string
	EventType        string
	ExternalEventID  string
	PaymentStatus    string
	Payload          map[string]any
	ReceivedAt       time.Time
}

type RefundRequest struct {
	ID                string
	AppointmentID     string
	PaymentRequestID  string
	Amount            int
	Currency          string
	Reason            string
	Status            string
	RequestedByKind   string
	RequestedByID     string
	ApprovedByAdminID string
	CreatedAt         time.Time
	ProcessedAt       *time.Time
	UpdatedAt         time.Time
}

type RefundEvent struct {
	ID              string
	RefundRequestID string
	Provider        string
	EventType       string
	ExternalEventID string
	Payload         map[string]any
	ReceivedAt      time.Time
}

type EarningsLedgerEntry struct {
	ID             string
	ProfessionalID string
	AppointmentID  string
	EntryType      string
	Amount         int
	Currency       string
	Status         string
	AvailableAt    *time.Time
	CreatedAt      time.Time
}

type PayoutBatch struct {
	ID             string
	ProfessionalID string
	Provider       string
	Status         string
	Amount         int
	Currency       string
	ExternalID     string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	PaidAt         *time.Time
}

type Reader interface {
	ListAppointments(ctx context.Context) ([]AppointmentRecord, error)
	AppointmentsByConsumerID(ctx context.Context, consumerID string) ([]AppointmentRecord, error)
	AppointmentsByProfessionalID(ctx context.Context, professionalID string) ([]AppointmentRecord, error)
	AppointmentByID(ctx context.Context, appointmentID string) (AppointmentRecord, error)
	ListAppointmentStatusHistory(ctx context.Context) (map[string][]AppointmentStatusEvent, error)
	AppointmentStatusHistoryByAppointmentID(ctx context.Context, appointmentID string) ([]AppointmentStatusEvent, error)
	PaymentRequestByID(ctx context.Context, paymentRequestID string) (PaymentRequest, error)
	LatestPaymentRequestByAppointmentID(ctx context.Context, appointmentID string) (PaymentRequest, error)
	HomeVisitExecutionByAppointmentID(ctx context.Context, appointmentID string) (HomeVisitExecution, error)
}

type Store interface {
	Reader
	UpsertAppointment(ctx context.Context, appointment AppointmentRecord) (AppointmentRecord, error)
	AppendAppointmentStatusEvent(ctx context.Context, event AppointmentStatusEvent) (AppointmentStatusEvent, error)
	ReplaceAppointmentParticipants(ctx context.Context, appointmentID string, participants []AppointmentParticipant) error
	AppendAppointmentOperationalEvent(ctx context.Context, event AppointmentOperationalEvent) (AppointmentOperationalEvent, error)
	CreateAppointmentChangeRequest(ctx context.Context, changeRequest AppointmentChangeRequest) (AppointmentChangeRequest, error)
	UpsertPaymentRequest(ctx context.Context, paymentRequest PaymentRequest) (PaymentRequest, error)
	AppendPaymentEvent(ctx context.Context, event PaymentEvent) (PaymentEvent, error)
	UpsertRefundRequest(ctx context.Context, refundRequest RefundRequest) (RefundRequest, error)
	AppendRefundEvent(ctx context.Context, event RefundEvent) (RefundEvent, error)
	AppendEarningsLedgerEntry(ctx context.Context, entry EarningsLedgerEntry) (EarningsLedgerEntry, error)
	UpsertPayoutBatch(ctx context.Context, payoutBatch PayoutBatch) (PayoutBatch, error)
	UpsertHomeVisitExecution(ctx context.Context, execution HomeVisitExecution) (HomeVisitExecution, error)
}

func CloneMap(value map[string]any) map[string]any {
	if len(value) == 0 {
		return map[string]any{}
	}

	cloned := make(map[string]any, len(value))
	for key, item := range value {
		switch typed := item.(type) {
		case map[string]any:
			cloned[key] = CloneMap(typed)
		case []map[string]any:
			rows := make([]map[string]any, 0, len(typed))
			for _, row := range typed {
				rows = append(rows, CloneMap(row))
			}
			cloned[key] = rows
		case []any:
			cloned[key] = cloneSlice(typed)
		default:
			cloned[key] = typed
		}
	}
	return cloned
}

func cloneSlice(values []any) []any {
	if len(values) == 0 {
		return []any{}
	}

	cloned := make([]any, 0, len(values))
	for _, item := range values {
		switch typed := item.(type) {
		case map[string]any:
			cloned = append(cloned, CloneMap(typed))
		case []any:
			cloned = append(cloned, cloneSlice(typed))
		default:
			cloned = append(cloned, typed)
		}
	}
	return cloned
}

func SortAppointments(appointments []AppointmentRecord) {
	sort.SliceStable(appointments, func(i int, j int) bool {
		if !appointments[i].RequestedAt.Equal(appointments[j].RequestedAt) {
			return appointments[i].RequestedAt.After(appointments[j].RequestedAt)
		}
		return appointments[i].ID < appointments[j].ID
	})
}
