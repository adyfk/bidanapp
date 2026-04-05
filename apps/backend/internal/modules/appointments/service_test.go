package appointments

import (
	"context"
	"errors"
	"testing"

	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/appointmentstore"
	"bidanapp/apps/backend/internal/platform/pushstore"
	internalwebpush "bidanapp/apps/backend/internal/platform/webpush"
)

type stubAppointmentReader struct {
	appointment readmodel.AppointmentSeed
}

func (s stubAppointmentReader) Appointments(_ context.Context) (readmodel.AppointmentData, error) {
	return readmodel.AppointmentData{
		Appointments: []readmodel.AppointmentSeed{s.appointment},
	}, nil
}

func (s stubAppointmentReader) AppointmentsByConsumerID(
	_ context.Context,
	consumerID string,
) (readmodel.AppointmentData, error) {
	if consumerID != s.appointment.ConsumerID {
		return readmodel.AppointmentData{Appointments: []readmodel.AppointmentSeed{}}, nil
	}

	return readmodel.AppointmentData{
		Appointments: []readmodel.AppointmentSeed{s.appointment},
	}, nil
}

func (s stubAppointmentReader) AppointmentsByProfessionalID(
	_ context.Context,
	professionalID string,
) (readmodel.AppointmentData, error) {
	if professionalID != s.appointment.ProfessionalID {
		return readmodel.AppointmentData{Appointments: []readmodel.AppointmentSeed{}}, nil
	}

	return readmodel.AppointmentData{
		Appointments: []readmodel.AppointmentSeed{s.appointment},
	}, nil
}

func (s stubAppointmentReader) AppointmentByID(_ context.Context, appointmentID string) (readmodel.AppointmentSeed, error) {
	if appointmentID != s.appointment.ID {
		return readmodel.AppointmentSeed{}, readmodel.ErrNotFound
	}

	return s.appointment, nil
}

type sentNotification struct {
	payload      internalwebpush.NotificationPayload
	subscription pushstore.CustomerSubscription
}

type stubWebPushSender struct {
	err   error
	sends []sentNotification
}

func (s *stubWebPushSender) Send(
	_ context.Context,
	subscription pushstore.CustomerSubscription,
	payload internalwebpush.NotificationPayload,
) error {
	s.sends = append(s.sends, sentNotification{
		payload:      payload,
		subscription: subscription,
	})

	return s.err
}

func TestDepartHomeVisitSendsCustomerPushAndMarksExecution(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	executionStore := appointmentstore.NewMemoryStore()
	pushState := pushstore.NewMemoryStore()
	_, err := pushState.UpsertCustomerSubscription(ctx, pushstore.CustomerSubscription{
		AuthKey:    "auth-key",
		ConsumerID: "consumer-1",
		Endpoint:   "https://push.example.test/subscription-1",
		Locale:     "id",
		P256DHKey:  "p256dh-key",
		UserAgent:  "playwright",
	})
	if err != nil {
		t.Fatalf("UpsertCustomerSubscription() error = %v", err)
	}

	sender := &stubWebPushSender{}
	service := NewService(
		nil,
		stubAppointmentReader{
			appointment: readmodel.AppointmentSeed{
				ConsumerID:     "consumer-1",
				ID:             "apt-1",
				ProfessionalID: "professional-1",
				RequestedMode:  homeVisitRequestedMode,
				ServiceSnapshot: readmodel.AppointmentServiceSnapshot{
					Name: "Pendampingan Nifas",
				},
				Status: readmodel.AppointmentStatusConfirmed,
			},
		},
		nil,
		executionStore,
		pushState,
		sender,
	)

	status, err := service.DepartHomeVisit(ctx, "professional-1", "apt-1", AppointmentDepartInputData{})
	if err != nil {
		t.Fatalf("DepartHomeVisit() error = %v", err)
	}

	if !status.Enabled || !status.HasDeparted {
		t.Fatalf("DepartHomeVisit() unexpected status = %#v", status)
	}

	if len(sender.sends) != 1 {
		t.Fatalf("expected exactly one push notification, got %d", len(sender.sends))
	}

	sent := sender.sends[0]
	if sent.payload.Path != "/id/activity/apt-1" {
		t.Fatalf("push payload path = %q, want /id/activity/apt-1", sent.payload.Path)
	}
	if sent.payload.Title != "Profesional Anda sudah berangkat" {
		t.Fatalf("push payload title = %q", sent.payload.Title)
	}

	execution, err := executionStore.HomeVisitExecutionByAppointmentID(ctx, "apt-1")
	if err != nil {
		t.Fatalf("HomeVisitExecutionByAppointmentID() error = %v", err)
	}
	if execution.DepartureNotificationSentAt == nil {
		t.Fatal("expected departure notification timestamp to be stored")
	}
}

func TestDepartHomeVisitDeletesGoneSubscriptions(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	executionStore := appointmentstore.NewMemoryStore()
	pushState := pushstore.NewMemoryStore()
	_, err := pushState.UpsertCustomerSubscription(ctx, pushstore.CustomerSubscription{
		AuthKey:    "auth-key",
		ConsumerID: "consumer-1",
		Endpoint:   "https://push.example.test/gone-subscription",
		Locale:     "en",
		P256DHKey:  "p256dh-key",
		UserAgent:  "playwright",
	})
	if err != nil {
		t.Fatalf("UpsertCustomerSubscription() error = %v", err)
	}

	service := NewService(
		nil,
		stubAppointmentReader{
			appointment: readmodel.AppointmentSeed{
				ConsumerID:     "consumer-1",
				ID:             "apt-2",
				ProfessionalID: "professional-1",
				RequestedMode:  homeVisitRequestedMode,
				ServiceSnapshot: readmodel.AppointmentServiceSnapshot{
					Name: "Home Visit Recovery",
				},
				Status: readmodel.AppointmentStatusConfirmed,
			},
		},
		nil,
		executionStore,
		pushState,
		&stubWebPushSender{err: internalwebpush.ErrSubscriptionGone},
	)

	_, err = service.DepartHomeVisit(ctx, "professional-1", "apt-2", AppointmentDepartInputData{})
	if err != nil {
		t.Fatalf("DepartHomeVisit() error = %v", err)
	}

	subscriptions, err := pushState.ListCustomerSubscriptions(ctx, "consumer-1")
	if err != nil {
		t.Fatalf("ListCustomerSubscriptions() error = %v", err)
	}
	if len(subscriptions) != 0 {
		t.Fatalf("expected gone subscription to be removed, got %#v", subscriptions)
	}
}

func TestDepartHomeVisitRejectsOutOfScopeProfessional(t *testing.T) {
	t.Parallel()

	service := NewService(
		nil,
		stubAppointmentReader{
			appointment: readmodel.AppointmentSeed{
				ConsumerID:     "consumer-1",
				ID:             "apt-3",
				ProfessionalID: "professional-1",
				RequestedMode:  homeVisitRequestedMode,
				Status:         readmodel.AppointmentStatusConfirmed,
			},
		},
		nil,
		appointmentstore.NewMemoryStore(),
		pushstore.NewMemoryStore(),
		&stubWebPushSender{},
	)

	_, err := service.DepartHomeVisit(context.Background(), "professional-2", "apt-3", AppointmentDepartInputData{})
	if !errors.Is(err, ErrAppointmentScopeMismatch) {
		t.Fatalf("DepartHomeVisit() error = %v, want ErrAppointmentScopeMismatch", err)
	}
}
