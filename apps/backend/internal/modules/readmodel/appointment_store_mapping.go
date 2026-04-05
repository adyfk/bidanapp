package readmodel

import (
	"encoding/json"

	"bidanapp/apps/backend/internal/platform/appointmentstore"
)

func AppointmentSeedFromStoreRecord(
	record appointmentstore.AppointmentRecord,
	history []appointmentstore.AppointmentStatusEvent,
) AppointmentSeed {
	return AppointmentSeed{
		ID:                 record.ID,
		ConsumerID:         record.ConsumerID,
		ProfessionalID:     record.ProfessionalID,
		ServiceID:          record.ServiceID,
		ServiceOfferingID:  record.ServiceOfferingID,
		AreaID:             record.AreaID,
		BookingFlow:        record.BookingFlow,
		RequestedMode:      record.RequestedMode,
		RequestNote:        record.RequestNote,
		RequestedAt:        record.RequestedAt.UTC().Format(timeRFC3339),
		Status:             AppointmentStatus(record.Status),
		ScheduledTimeLabel: stringValue(record.ScheduleSnapshot["scheduledTimeLabel"]),
		TotalPriceLabel:    record.TotalPriceLabel,
		RecentActivity:     decodeOptionalMap[AppointmentRecentActivity](record.RecentActivity),
		CustomerFeedback:   decodeOptionalMap[AppointmentFeedback](record.CustomerFeedback),
		CancellationPolicySnapshot: decodeMapIntoDefault(
			record.CancellationPolicySnapshot,
			AppointmentCancellationPolicySnapshot{},
		),
		CancellationResolution: decodeOptionalMap[AppointmentCancellationResolution](record.CancellationResolution),
		ScheduleSnapshot:       decodeMapIntoDefault(record.ScheduleSnapshot, AppointmentScheduleSnapshot{}),
		ServiceSnapshot:        decodeMapIntoDefault(record.ServiceSnapshot, AppointmentServiceSnapshot{}),
		Timeline:               statusTimelineFromStore(history),
	}
}

const timeRFC3339 = "2006-01-02T15:04:05Z07:00"

func statusTimelineFromStore(history []appointmentstore.AppointmentStatusEvent) []AppointmentTimelineEvent {
	if len(history) == 0 {
		return []AppointmentTimelineEvent{}
	}

	timeline := make([]AppointmentTimelineEvent, 0, len(history))
	for _, event := range history {
		timeline = append(timeline, AppointmentTimelineEvent{
			Actor:           event.ActorKind,
			CreatedAt:       event.CreatedAt.UTC().Format(timeRFC3339),
			CreatedAtLabel:  event.CreatedAtLabel,
			CustomerSummary: event.CustomerSummary,
			EvidenceURL:     event.EvidenceURL,
			FromStatus:      AppointmentStatus(event.FromStatus),
			ID:              event.ID,
			InternalNote:    event.InternalNote,
			ToStatus:        AppointmentStatus(event.ToStatus),
		})
	}
	return timeline
}

func decodeMapIntoDefault[T any](value map[string]any, fallback T) T {
	if len(value) == 0 {
		return fallback
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return fallback
	}
	decoded := fallback
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return fallback
	}
	return decoded
}

func decodeOptionalMap[T any](value map[string]any) *T {
	if len(value) == 0 {
		return nil
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	var decoded T
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil
	}
	return &decoded
}

func stringValue(value any) string {
	typed, ok := value.(string)
	if !ok {
		return ""
	}
	return typed
}
