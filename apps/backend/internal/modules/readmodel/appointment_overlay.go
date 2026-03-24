package readmodel

import (
	"context"
	"sort"
	"strconv"
	"strings"
	"unicode"

	"bidanapp/apps/backend/internal/platform/portalstore"
)

type portalAppointmentServiceSnapshot struct {
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

type portalAppointmentScheduleSnapshot struct {
	DateISO            string `json:"dateIso,omitempty"`
	RequiresSchedule   bool   `json:"requiresSchedule"`
	ScheduleDayID      string `json:"scheduleDayId,omitempty"`
	ScheduleDayLabel   string `json:"scheduleDayLabel,omitempty"`
	ScheduledTimeLabel string `json:"scheduledTimeLabel"`
	TimeSlotID         string `json:"timeSlotId,omitempty"`
	TimeSlotLabel      string `json:"timeSlotLabel,omitempty"`
}

type portalAppointmentTimelineEvent struct {
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

type portalAppointmentCancellationResolution struct {
	CancelledAt        string `json:"cancelledAt"`
	CancelledBy        string `json:"cancelledBy"`
	CancellationReason string `json:"cancellationReason"`
	FinancialOutcome   string `json:"financialOutcome"`
}

type portalManagedAppointmentRecord struct {
	AreaID                     string                                   `json:"areaId"`
	BookingFlow                string                                   `json:"bookingFlow"`
	CancellationPolicySnapshot AppointmentCancellationPolicySnapshot    `json:"cancellationPolicySnapshot"`
	CancellationResolution     *portalAppointmentCancellationResolution `json:"cancellationResolution,omitempty"`
	ConsumerID                 string                                   `json:"consumerId"`
	ID                         string                                   `json:"id"`
	Index                      int                                      `json:"index"`
	ProfessionalID             string                                   `json:"professionalId"`
	RequestNote                string                                   `json:"requestNote"`
	RequestedAt                string                                   `json:"requestedAt"`
	RequestedMode              string                                   `json:"requestedMode"`
	ScheduleSnapshot           portalAppointmentScheduleSnapshot        `json:"scheduleSnapshot"`
	ServiceID                  string                                   `json:"serviceId"`
	ServiceOfferingID          string                                   `json:"serviceOfferingId"`
	ServiceSnapshot            portalAppointmentServiceSnapshot         `json:"serviceSnapshot"`
	Status                     AppointmentStatus                        `json:"status"`
	Timeline                   []portalAppointmentTimelineEvent         `json:"timeline"`
}

func overlayAppointmentReadModel(
	ctx context.Context,
	store portalstore.Reader,
	seedAppointments []AppointmentSeed,
) []AppointmentSeed {
	if store == nil {
		return seedAppointments
	}

	state, err := store.Read(ctx)
	if err != nil || len(state.Sessions) == 0 {
		return seedAppointments
	}

	appointmentsByID := make(map[string]AppointmentSeed, len(seedAppointments))
	maxIndex := 0
	for _, appointment := range seedAppointments {
		appointmentsByID[appointment.ID] = appointment
		if appointment.Index > maxIndex {
			maxIndex = appointment.Index
		}
	}

	for _, session := range state.Sessions {
		appointmentRecordsByProfessionalID, ok := decodePortalSnapshotSection[map[string][]portalManagedAppointmentRecord](
			session.Snapshot,
			"appointmentRecordsByProfessionalId",
		)
		if !ok {
			continue
		}

		for _, appointmentRecords := range appointmentRecordsByProfessionalID {
			for _, record := range appointmentRecords {
				nextAppointment := toAppointmentFromPortal(record)
				if nextAppointment.Index <= 0 {
					maxIndex += 1
					nextAppointment.Index = maxIndex
				} else if nextAppointment.Index > maxIndex {
					maxIndex = nextAppointment.Index
				}

				appointmentsByID[nextAppointment.ID] = nextAppointment
			}
		}
	}

	nextAppointments := make([]AppointmentSeed, 0, len(appointmentsByID))
	for _, appointment := range appointmentsByID {
		nextAppointments = append(nextAppointments, appointment)
	}

	sort.SliceStable(nextAppointments, func(leftIndex int, rightIndex int) bool {
		leftAppointment := nextAppointments[leftIndex]
		rightAppointment := nextAppointments[rightIndex]

		if leftAppointment.Index != rightAppointment.Index {
			return leftAppointment.Index < rightAppointment.Index
		}
		if leftAppointment.RequestedAt != rightAppointment.RequestedAt {
			return leftAppointment.RequestedAt < rightAppointment.RequestedAt
		}

		return leftAppointment.ID < rightAppointment.ID
	})

	return nextAppointments
}

func toAppointmentFromSeed(
	row seedDataAppointmentRow,
	serviceRowsByID map[string]seedDataServiceRow,
	serviceOfferingsByID map[string]seedDataProfessionalServiceOfferingRow,
) AppointmentSeed {
	serviceSnapshot := buildAppointmentServiceSnapshot(
		row.ServiceID,
		row.ServiceOfferingID,
		row.BookingFlow,
		row.TotalPriceLabel,
		serviceRowsByID[row.ServiceID],
		serviceOfferingsByID[row.ServiceOfferingID],
	)

	return AppointmentSeed{
		Index:              row.Index,
		ID:                 row.ID,
		ConsumerID:         row.ConsumerID,
		ProfessionalID:     row.ProfessionalID,
		ServiceID:          row.ServiceID,
		AreaID:             row.AreaID,
		RequestedMode:      row.RequestedMode,
		RequestNote:        row.RequestNote,
		RequestedAt:        row.RequestedAt,
		Status:             row.Status,
		ScheduledTimeLabel: row.ScheduledTimeLabel,
		TotalPriceLabel:    row.TotalPriceLabel,
		RecentActivity:     toAppointmentRecentActivity(row.RecentActivity),
		CustomerFeedback:   toAppointmentFeedback(row.CustomerFeedback),
		BookingFlow:        row.BookingFlow,
		CancellationPolicySnapshot: AppointmentCancellationPolicySnapshot{
			CustomerPaidCancelCutoffHours: row.CancellationPolicySnapshot.CustomerPaidCancelCutoffHours,
			ProfessionalCancelOutcome:     row.CancellationPolicySnapshot.ProfessionalCancelOutcome,
			BeforeCutoffOutcome:           row.CancellationPolicySnapshot.BeforeCutoffOutcome,
			AfterCutoffOutcome:            row.CancellationPolicySnapshot.AfterCutoffOutcome,
		},
		ScheduleSnapshot: AppointmentScheduleSnapshot{
			DateISO:            row.ScheduleSnapshot.DateISO,
			RequiresSchedule:   row.ScheduleSnapshot.RequiresSchedule,
			ScheduleDayID:      row.ScheduleSnapshot.ScheduleDayID,
			ScheduleDayLabel:   row.ScheduleSnapshot.ScheduleDayLabel,
			ScheduledTimeLabel: row.ScheduleSnapshot.ScheduledTimeLabel,
			TimeSlotID:         row.ScheduleSnapshot.TimeSlotID,
			TimeSlotLabel:      row.ScheduleSnapshot.TimeSlotLabel,
		},
		ServiceOfferingID: row.ServiceOfferingID,
		ServiceSnapshot:   serviceSnapshot,
		Timeline:          toAppointmentTimelineFromSeed(row.Timeline),
	}
}

func toAppointmentFromPortal(record portalManagedAppointmentRecord) AppointmentSeed {
	return AppointmentSeed{
		Index:                      record.Index,
		ID:                         record.ID,
		ConsumerID:                 record.ConsumerID,
		ProfessionalID:             record.ProfessionalID,
		ServiceID:                  record.ServiceID,
		AreaID:                     record.AreaID,
		RequestedMode:              record.RequestedMode,
		RequestNote:                record.RequestNote,
		RequestedAt:                record.RequestedAt,
		Status:                     record.Status,
		ScheduledTimeLabel:         record.ScheduleSnapshot.ScheduledTimeLabel,
		TotalPriceLabel:            record.ServiceSnapshot.PriceLabel,
		BookingFlow:                record.BookingFlow,
		CancellationPolicySnapshot: record.CancellationPolicySnapshot,
		CancellationResolution:     toAppointmentCancellationResolution(record.CancellationResolution),
		ScheduleSnapshot: AppointmentScheduleSnapshot{
			DateISO:            record.ScheduleSnapshot.DateISO,
			RequiresSchedule:   record.ScheduleSnapshot.RequiresSchedule,
			ScheduleDayID:      record.ScheduleSnapshot.ScheduleDayID,
			ScheduleDayLabel:   record.ScheduleSnapshot.ScheduleDayLabel,
			ScheduledTimeLabel: record.ScheduleSnapshot.ScheduledTimeLabel,
			TimeSlotID:         record.ScheduleSnapshot.TimeSlotID,
			TimeSlotLabel:      record.ScheduleSnapshot.TimeSlotLabel,
		},
		ServiceOfferingID: record.ServiceOfferingID,
		ServiceSnapshot: AppointmentServiceSnapshot{
			BookingFlow:       record.ServiceSnapshot.BookingFlow,
			CategoryID:        record.ServiceSnapshot.CategoryID,
			CoverImage:        record.ServiceSnapshot.CoverImage,
			DefaultMode:       record.ServiceSnapshot.DefaultMode,
			Description:       record.ServiceSnapshot.Description,
			DurationLabel:     record.ServiceSnapshot.DurationLabel,
			Highlights:        append([]string(nil), record.ServiceSnapshot.Highlights...),
			Image:             record.ServiceSnapshot.Image,
			Name:              record.ServiceSnapshot.Name,
			PriceAmount:       record.ServiceSnapshot.PriceAmount,
			PriceLabel:        record.ServiceSnapshot.PriceLabel,
			ServiceID:         record.ServiceSnapshot.ServiceID,
			ServiceModes:      record.ServiceSnapshot.ServiceModes,
			ServiceOfferingID: record.ServiceSnapshot.ServiceOfferingID,
			ShortDescription:  record.ServiceSnapshot.ShortDescription,
			Slug:              record.ServiceSnapshot.Slug,
			Summary:           record.ServiceSnapshot.Summary,
			Tags:              append([]string(nil), record.ServiceSnapshot.Tags...),
		},
		Timeline: toAppointmentTimelineFromPortal(record.Timeline),
	}
}

func buildAppointmentServiceSnapshot(
	serviceID string,
	serviceOfferingID string,
	bookingFlow string,
	totalPriceLabel string,
	serviceRow seedDataServiceRow,
	serviceOfferingRow seedDataProfessionalServiceOfferingRow,
) AppointmentServiceSnapshot {
	priceLabel := strings.TrimSpace(serviceOfferingRow.Price)
	if priceLabel == "" {
		priceLabel = strings.TrimSpace(totalPriceLabel)
	}

	return AppointmentServiceSnapshot{
		BookingFlow:       fallbackString(serviceOfferingRow.BookingFlow, bookingFlow),
		CategoryID:        serviceRow.CategoryID,
		CoverImage:        serviceRow.CoverImage,
		DefaultMode:       fallbackString(serviceOfferingRow.DefaultMode, serviceRow.DefaultMode),
		Description:       serviceRow.Description,
		DurationLabel:     serviceOfferingRow.Duration,
		Highlights:        append([]string(nil), serviceRow.Highlights...),
		Image:             serviceRow.Image,
		Name:              serviceRow.Name,
		PriceAmount:       parsePriceAmount(priceLabel),
		PriceLabel:        priceLabel,
		ServiceID:         fallbackString(serviceRow.ID, serviceID),
		ServiceModes:      toAppointmentServiceModes(serviceRow.ServiceModes, serviceOfferingRow),
		ServiceOfferingID: fallbackString(serviceOfferingRow.ID, serviceOfferingID),
		ShortDescription:  serviceRow.ShortDescription,
		Slug:              serviceRow.Slug,
		Summary:           fallbackString(serviceOfferingRow.Summary, serviceRow.ShortDescription),
		Tags:              append([]string(nil), serviceRow.Tags...),
	}
}

func toAppointmentServiceModes(
	serviceModes seedDataServiceModesRow,
	serviceOfferingRow seedDataProfessionalServiceOfferingRow,
) ServiceMode {
	if serviceOfferingRow.ID != "" {
		return ServiceMode{
			Online:    serviceOfferingRow.SupportsOnline,
			HomeVisit: serviceOfferingRow.SupportsHomeVisit,
			Onsite:    serviceOfferingRow.SupportsOnsite,
		}
	}

	return ServiceMode{
		Online:    serviceModes.Online,
		HomeVisit: serviceModes.HomeVisit,
		Onsite:    serviceModes.Onsite,
	}
}

func toAppointmentRecentActivity(row *seedDataAppointmentRecentActivityRow) *AppointmentRecentActivity {
	if row == nil {
		return nil
	}

	return &AppointmentRecentActivity{
		DateLabel: row.DateLabel,
		Title:     row.Title,
		Channel:   row.Channel,
		Summary:   row.Summary,
	}
}

func toAppointmentFeedback(row *seedDataAppointmentFeedbackRow) *AppointmentFeedback {
	if row == nil {
		return nil
	}

	return &AppointmentFeedback{
		Author:    row.Author,
		DateLabel: row.DateLabel,
		Image:     row.Image,
		Quote:     row.Quote,
		Rating:    row.Rating,
		Role:      row.Role,
	}
}

func toAppointmentTimelineFromSeed(events []seedDataAppointmentTimelineEventRow) []AppointmentTimelineEvent {
	if len(events) == 0 {
		return []AppointmentTimelineEvent{}
	}

	timeline := make([]AppointmentTimelineEvent, 0, len(events))
	for _, event := range events {
		timeline = append(timeline, AppointmentTimelineEvent{
			Actor:           event.Actor,
			CreatedAt:       event.CreatedAt,
			CreatedAtLabel:  event.CreatedAtLabel,
			CustomerSummary: event.CustomerSummary,
			EvidenceURL:     event.EvidenceURL,
			FromStatus:      event.FromStatus,
			ID:              event.ID,
			InternalNote:    event.InternalNote,
			ToStatus:        event.ToStatus,
		})
	}

	return timeline
}

func toAppointmentTimelineFromPortal(events []portalAppointmentTimelineEvent) []AppointmentTimelineEvent {
	if len(events) == 0 {
		return []AppointmentTimelineEvent{}
	}

	timeline := make([]AppointmentTimelineEvent, 0, len(events))
	for _, event := range events {
		timeline = append(timeline, AppointmentTimelineEvent{
			Actor:           event.Actor,
			CreatedAt:       event.CreatedAt,
			CreatedAtLabel:  event.CreatedAtLabel,
			CustomerSummary: event.CustomerSummary,
			EvidenceURL:     event.EvidenceURL,
			FromStatus:      event.FromStatus,
			ID:              event.ID,
			InternalNote:    event.InternalNote,
			ToStatus:        event.ToStatus,
		})
	}

	return timeline
}

func toAppointmentCancellationResolution(
	resolution *portalAppointmentCancellationResolution,
) *AppointmentCancellationResolution {
	if resolution == nil {
		return nil
	}

	return &AppointmentCancellationResolution{
		CancelledAt:        resolution.CancelledAt,
		CancelledBy:        resolution.CancelledBy,
		CancellationReason: resolution.CancellationReason,
		FinancialOutcome:   resolution.FinancialOutcome,
	}
}

func parsePriceAmount(value string) int {
	digitsOnly := strings.Map(func(r rune) rune {
		if unicode.IsDigit(r) {
			return r
		}

		return -1
	}, value)

	if digitsOnly == "" {
		return 0
	}

	amount, err := strconv.Atoi(digitsOnly)
	if err != nil {
		return 0
	}

	return amount
}
