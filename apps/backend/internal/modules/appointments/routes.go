package appointments

import (
	"context"
	"errors"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/modules/professionalportal"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/appointmentstore"
	"bidanapp/apps/backend/internal/platform/pushstore"
	"bidanapp/apps/backend/internal/platform/web"
	internalwebpush "bidanapp/apps/backend/internal/platform/webpush"
)

const (
	executionStatusClosed           = "closed"
	executionStatusDeparted         = "departed"
	executionStatusPendingDeparture = "pending_departure"
	executionStatusServiceStarted   = "service_started"
	homeVisitRequestedMode          = "home_visit"
	minDisplayedETAMinutes          = 10
	travelBufferMinutes             = 5
	travelSpeedKMH                  = 20.0
)

var (
	ErrAppointmentNotFound      = errors.New("appointment was not found")
	ErrAppointmentScopeMismatch = errors.New("appointment does not match authenticated session")
	ErrHomeVisitUnavailable     = errors.New("home visit departure is only available for confirmed home-visit appointments")
	ErrInvalidCurrentLocation   = errors.New("current location is invalid")
	ErrServiceUnavailable       = errors.New("appointment home-visit service is not configured")
)

type AppointmentReader interface {
	AppointmentByID(ctx context.Context, appointmentID string) (readmodel.AppointmentSeed, error)
	Appointments(ctx context.Context) (readmodel.AppointmentData, error)
	AppointmentsByConsumerID(ctx context.Context, consumerID string) (readmodel.AppointmentData, error)
	AppointmentsByProfessionalID(ctx context.Context, professionalID string) (readmodel.AppointmentData, error)
}

type CatalogReader interface {
	Catalog(ctx context.Context) (readmodel.CatalogData, error)
}

type Service struct {
	appointmentLookup  AppointmentReader
	catalogLookup      CatalogReader
	executionStore     appointmentstore.Store
	portal             *professionalportal.Service
	paymentCurrency    string
	paymentProvider    string
	frontendOrigin     string
	xenditSecretKey    string
	xenditWebhookToken string
	pushSender         internalwebpush.Sender
	pushStore          pushstore.Store
}

type Option func(*Service)

type GeoPointInput struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type AppointmentDepartInputData struct {
	CurrentLocation *GeoPointInput `json:"currentLocation,omitempty"`
}

type AppointmentHomeVisitStatusData struct {
	DepartedAt     string   `json:"departedAt,omitempty"`
	DistanceKMHint *float64 `json:"distanceKmHint,omitempty"`
	Enabled        bool     `json:"enabled"`
	ETAMinutesHint *int     `json:"etaMinutesHint,omitempty"`
	HasDeparted    bool     `json:"hasDeparted"`
	Message        string   `json:"message"`
	ShowETAHint    bool     `json:"showEtaHint"`
	UpdatedAt      string   `json:"updatedAt,omitempty"`
}

type appointmentUpsertPathInput struct {
	AppointmentID string `path:"appointment_id" doc:"Appointment record identifier"`
	Body          AppointmentRecordUpsertData
}

type appointmentDepartPathInput struct {
	AppointmentID string `path:"appointment_id" doc:"Appointment record identifier"`
	Body          AppointmentDepartInputData
}

type appointmentHomeVisitStatusPathInput struct {
	AppointmentID string `path:"appointment_id" doc:"Appointment record identifier"`
}

type AppointmentRecordUpsertData struct {
	AppointmentRecord professionalportal.ProfessionalPortalManagedAppointmentRecord `json:"appointmentRecord"`
	ProfessionalID    string                                                        `json:"professionalId" required:"true"`
}

type appointmentRequestsResponseBody struct {
	Data professionalportal.ProfessionalPortalRequestsData `json:"data"`
}

type appointmentRequestsResponse struct {
	Body appointmentRequestsResponseBody
}

type appointmentHomeVisitStatusResponseBody struct {
	Data AppointmentHomeVisitStatusData `json:"data"`
}

type appointmentHomeVisitStatusResponse struct {
	Body appointmentHomeVisitStatusResponseBody
}

func NewService(
	portal *professionalportal.Service,
	appointmentLookup AppointmentReader,
	catalogLookup CatalogReader,
	executionStore appointmentstore.Store,
	pushStore pushstore.Store,
	pushSender internalwebpush.Sender,
	options ...Option,
) *Service {
	if pushSender == nil {
		pushSender = internalwebpush.NewNoopSender()
	}

	service := &Service{
		appointmentLookup: appointmentLookup,
		catalogLookup:     catalogLookup,
		executionStore:    executionStore,
		paymentCurrency:   "IDR",
		paymentProvider:   "manual_test",
		portal:            portal,
		pushSender:        pushSender,
		pushStore:         pushStore,
	}
	for _, option := range options {
		if option != nil {
			option(service)
		}
	}
	return service
}

func WithPaymentConfig(cfg config.PaymentConfig) Option {
	return func(service *Service) {
		if strings.TrimSpace(cfg.Provider) != "" {
			service.paymentProvider = strings.TrimSpace(cfg.Provider)
		}
		if strings.TrimSpace(cfg.Currency) != "" {
			service.paymentCurrency = strings.TrimSpace(cfg.Currency)
		}
		service.xenditSecretKey = strings.TrimSpace(cfg.Xendit.SecretKey)
		service.xenditWebhookToken = strings.TrimSpace(cfg.Xendit.WebhookToken)
	}
}

func WithFrontendOrigin(origin string) Option {
	return func(service *Service) {
		service.frontendOrigin = strings.TrimRight(strings.TrimSpace(origin), "/")
	}
}

func RegisterRoutes(api huma.API, service *Service) {
	if service == nil {
		return
	}

	registerTransactionalRoutes(api, service)

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-appointment-record",
		Method:      http.MethodPut,
		Path:        "/appointments/{appointment_id}",
		Summary:     "Create or update a persisted appointment record",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentUpsertPathInput) (*appointmentRequestsResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}
		if strings.TrimSpace(authSession.Session.ProfessionalID) != strings.TrimSpace(input.Body.ProfessionalID) {
			return nil, web.NewAPIError(http.StatusForbidden, "appointment_scope_forbidden", "appointment scope does not match the authenticated session")
		}

		record := input.Body.AppointmentRecord
		record.ID = input.AppointmentID

		payload, err := service.portal.UpsertAppointmentRecord(ctx, input.Body.ProfessionalID, record)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentRequestsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "depart-home-visit-appointment",
		Method:      http.MethodPost,
		Path:        "/appointments/{appointment_id}/depart",
		Summary:     "Mark a confirmed home-visit appointment as on the way",
		Tags:        []string{"Appointments"},
		Errors: []int{
			http.StatusBadRequest,
			http.StatusConflict,
			http.StatusForbidden,
			http.StatusNotFound,
			http.StatusUnauthorized,
			http.StatusInternalServerError,
		},
	}), func(ctx context.Context, input *appointmentDepartPathInput) (*appointmentHomeVisitStatusResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.DepartHomeVisit(ctx, authSession.Session.ProfessionalID, input.AppointmentID, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentHomeVisitStatusResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withCustomerSecurity(huma.Operation{
		OperationID: "get-customer-home-visit-status",
		Method:      http.MethodGet,
		Path:        "/customers/appointments/{appointment_id}/home-visit-status",
		Summary:     "Get customer-facing home-visit departure status",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusForbidden, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentHomeVisitStatusPathInput) (*appointmentHomeVisitStatusResponse, error) {
		authSession, ok := customerauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "customer_session_not_found", "customer session not found")
		}

		payload, err := service.CustomerHomeVisitStatus(ctx, authSession.Session.ConsumerID, input.AppointmentID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentHomeVisitStatusResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-home-visit-status",
		Method:      http.MethodGet,
		Path:        "/professionals/appointments/{appointment_id}/home-visit-status",
		Summary:     "Get professional-facing home-visit departure status",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusForbidden, http.StatusNotFound, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *appointmentHomeVisitStatusPathInput) (*appointmentHomeVisitStatusResponse, error) {
		authSession, ok := professionalauth.ContextSession(ctx)
		if !ok {
			return nil, web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
		}

		payload, err := service.ProfessionalHomeVisitStatus(ctx, authSession.Session.ProfessionalID, input.AppointmentID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentHomeVisitStatusResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func (s *Service) DepartHomeVisit(
	ctx context.Context,
	professionalID string,
	appointmentID string,
	input AppointmentDepartInputData,
) (AppointmentHomeVisitStatusData, error) {
	if err := ctx.Err(); err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	appointment, err := s.lookupAppointment(ctx, appointmentID)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentHomeVisitStatusData{}, ErrAppointmentScopeMismatch
	}
	if appointment.RequestedMode != homeVisitRequestedMode || appointment.Status != readmodel.AppointmentStatusConfirmed {
		execution, _ := s.readExecution(ctx, appointmentID)
		if execution != nil && execution.DepartedAt != nil {
			return buildHomeVisitStatus(appointment, execution), nil
		}
		return AppointmentHomeVisitStatusData{}, ErrHomeVisitUnavailable
	}
	if s.executionStore == nil {
		return AppointmentHomeVisitStatusData{}, ErrServiceUnavailable
	}

	existingExecution, err := s.readExecution(ctx, appointmentID)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	if existingExecution != nil && existingExecution.DepartedAt != nil {
		return buildHomeVisitStatus(appointment, existingExecution), nil
	}

	now := time.Now().UTC()
	execution := appointmentstore.HomeVisitExecution{
		AppointmentID:   appointment.ID,
		ConsumerID:      appointment.ConsumerID,
		ProfessionalID:  appointment.ProfessionalID,
		RequestedMode:   homeVisitRequestedMode,
		ExecutionStatus: executionStatusDeparted,
		DepartedAt:      &now,
		UpdatedAt:       now,
	}
	if existingExecution != nil {
		execution = *existingExecution
		execution.ConsumerID = appointment.ConsumerID
		execution.ExecutionStatus = executionStatusDeparted
		execution.ProfessionalID = appointment.ProfessionalID
		execution.RequestedMode = homeVisitRequestedMode
		execution.DepartedAt = &now
		execution.UpdatedAt = now
	}

	destination := s.resolveDestinationPoint(ctx, appointment.AreaID)
	if destination != nil {
		execution.DestinationLat = floatPointer(destination.Latitude)
		execution.DestinationLng = floatPointer(destination.Longitude)
	}

	currentLocation, err := normalizeCurrentLocation(input.CurrentLocation)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	if currentLocation != nil {
		execution.DepartureOriginLat = floatPointer(currentLocation.Latitude)
		execution.DepartureOriginLng = floatPointer(currentLocation.Longitude)
	}

	applyHomeVisitHints(&execution)
	persisted, err := s.executionStore.UpsertHomeVisitExecution(ctx, execution)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}

	s.sendDeparturePush(ctx, appointment, &persisted)
	return buildHomeVisitStatus(appointment, &persisted), nil
}

func (s *Service) CustomerHomeVisitStatus(
	ctx context.Context,
	consumerID string,
	appointmentID string,
) (AppointmentHomeVisitStatusData, error) {
	appointment, err := s.lookupAppointment(ctx, appointmentID)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	if appointment.ConsumerID != strings.TrimSpace(consumerID) {
		return AppointmentHomeVisitStatusData{}, ErrAppointmentScopeMismatch
	}

	execution, err := s.readExecution(ctx, appointmentID)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	return buildHomeVisitStatus(appointment, execution), nil
}

func (s *Service) ProfessionalHomeVisitStatus(
	ctx context.Context,
	professionalID string,
	appointmentID string,
) (AppointmentHomeVisitStatusData, error) {
	appointment, err := s.lookupAppointment(ctx, appointmentID)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	if appointment.ProfessionalID != strings.TrimSpace(professionalID) {
		return AppointmentHomeVisitStatusData{}, ErrAppointmentScopeMismatch
	}

	execution, err := s.readExecution(ctx, appointmentID)
	if err != nil {
		return AppointmentHomeVisitStatusData{}, err
	}
	return buildHomeVisitStatus(appointment, execution), nil
}

func (s *Service) lookupAppointment(ctx context.Context, appointmentID string) (readmodel.AppointmentSeed, error) {
	if s.appointmentLookup == nil {
		return readmodel.AppointmentSeed{}, ErrServiceUnavailable
	}

	appointment, err := s.appointmentLookup.AppointmentByID(ctx, strings.TrimSpace(appointmentID))
	if err != nil {
		if errors.Is(err, readmodel.ErrNotFound) {
			return readmodel.AppointmentSeed{}, ErrAppointmentNotFound
		}
		return readmodel.AppointmentSeed{}, err
	}

	return appointment, nil
}

func (s *Service) readExecution(
	ctx context.Context,
	appointmentID string,
) (*appointmentstore.HomeVisitExecution, error) {
	if s.executionStore == nil {
		return nil, nil
	}

	execution, err := s.executionStore.HomeVisitExecutionByAppointmentID(ctx, appointmentID)
	if err != nil {
		if errors.Is(err, appointmentstore.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &execution, nil
}

func (s *Service) resolveDestinationPoint(ctx context.Context, areaID string) *GeoPointInput {
	if s.catalogLookup == nil || strings.TrimSpace(areaID) == "" {
		return nil
	}

	catalog, err := s.catalogLookup.Catalog(ctx)
	if err != nil {
		return nil
	}

	for _, area := range catalog.Areas {
		if area.ID != areaID {
			continue
		}

		latitude, err := normalizeCoordinate(area.Latitude, -90, 90)
		if err != nil {
			return nil
		}
		longitude, err := normalizeCoordinate(area.Longitude, -180, 180)
		if err != nil {
			return nil
		}

		return &GeoPointInput{
			Latitude:  latitude,
			Longitude: longitude,
		}
	}

	return nil
}

func normalizeCurrentLocation(location *GeoPointInput) (*GeoPointInput, error) {
	if location == nil {
		return nil, nil
	}

	latitude, err := normalizeCoordinate(location.Latitude, -90, 90)
	if err != nil {
		return nil, ErrInvalidCurrentLocation
	}
	longitude, err := normalizeCoordinate(location.Longitude, -180, 180)
	if err != nil {
		return nil, ErrInvalidCurrentLocation
	}

	return &GeoPointInput{
		Latitude:  latitude,
		Longitude: longitude,
	}, nil
}

func normalizeCoordinate(value float64, min float64, max float64) (float64, error) {
	if math.IsNaN(value) || math.IsInf(value, 0) || value < min || value > max {
		return 0, ErrInvalidCurrentLocation
	}

	return math.Round(value*10000) / 10000, nil
}

func applyHomeVisitHints(execution *appointmentstore.HomeVisitExecution) {
	if execution == nil {
		return
	}
	if execution.DepartureOriginLat == nil || execution.DepartureOriginLng == nil || execution.DestinationLat == nil || execution.DestinationLng == nil {
		execution.DistanceKMHint = nil
		execution.ETAMinutesHint = nil
		execution.LastComputedAt = nil
		return
	}

	now := time.Now().UTC()
	distance := math.Round(haversineKM(
		*execution.DepartureOriginLat,
		*execution.DepartureOriginLng,
		*execution.DestinationLat,
		*execution.DestinationLng,
	)*10) / 10
	etaMinutes := int(math.Ceil((distance/travelSpeedKMH)*60.0)) + travelBufferMinutes
	if etaMinutes < minDisplayedETAMinutes {
		etaMinutes = minDisplayedETAMinutes
	}

	execution.DistanceKMHint = &distance
	execution.ETAMinutesHint = &etaMinutes
	execution.LastComputedAt = &now
}

func buildHomeVisitStatus(
	appointment readmodel.AppointmentSeed,
	execution *appointmentstore.HomeVisitExecution,
) AppointmentHomeVisitStatusData {
	if appointment.RequestedMode != homeVisitRequestedMode {
		return AppointmentHomeVisitStatusData{
			Enabled: false,
			Message: "",
		}
	}

	status := AppointmentHomeVisitStatusData{
		Enabled: true,
		Message: "Professional belum memulai perjalanan.",
	}

	if appointment.Status == readmodel.AppointmentStatusInService {
		status.HasDeparted = true
		status.Message = "Layanan sedang berlangsung."
	}

	if execution == nil {
		return status
	}

	status.DistanceKMHint = execution.DistanceKMHint
	status.ETAMinutesHint = execution.ETAMinutesHint
	status.ShowETAHint = execution.ETAMinutesHint != nil
	if execution.DepartedAt != nil {
		status.DepartedAt = execution.DepartedAt.UTC().Format(time.RFC3339)
		status.HasDeparted = true
		status.Message = "Professional sudah berangkat ke lokasi Anda."
	}
	if execution.UpdatedAt != (time.Time{}) {
		status.UpdatedAt = execution.UpdatedAt.UTC().Format(time.RFC3339)
	} else if execution.LastComputedAt != nil {
		status.UpdatedAt = execution.LastComputedAt.UTC().Format(time.RFC3339)
	}
	if appointment.Status == readmodel.AppointmentStatusInService {
		status.Message = "Layanan sedang berlangsung."
		status.ShowETAHint = false
		status.ETAMinutesHint = nil
	}
	if appointment.Status == readmodel.AppointmentStatusCompleted {
		status.Message = "Layanan home visit sudah selesai."
		status.ShowETAHint = false
		status.ETAMinutesHint = nil
	}
	if appointment.Status == readmodel.AppointmentStatusCancelled ||
		appointment.Status == readmodel.AppointmentStatusRejected ||
		appointment.Status == readmodel.AppointmentStatusExpired {
		status.Message = "Appointment ini tidak lagi aktif."
		status.ShowETAHint = false
		status.ETAMinutesHint = nil
	}

	return status
}

func (s *Service) sendDeparturePush(
	ctx context.Context,
	appointment readmodel.AppointmentSeed,
	execution *appointmentstore.HomeVisitExecution,
) {
	if execution == nil || execution.DepartureNotificationSentAt != nil || s.pushStore == nil || s.pushSender == nil {
		return
	}

	subscriptions, err := s.pushStore.ListCustomerSubscriptions(ctx, appointment.ConsumerID)
	if err != nil {
		return
	}

	for _, subscription := range subscriptions {
		payload := internalwebpush.NotificationPayload{
			AppointmentID: appointment.ID,
			Body:          buildDeparturePushBody(subscription.Locale, appointment, execution),
			Path:          buildAppointmentActivityPath(subscription.Locale, appointment.ID),
			Tag:           "appointment-departure-" + appointment.ID,
			Title:         buildDeparturePushTitle(subscription.Locale),
		}
		err := s.pushSender.Send(ctx, subscription, payload)
		if errors.Is(err, internalwebpush.ErrSubscriptionGone) {
			_ = s.pushStore.DeleteSubscriptionEndpoint(ctx, subscription.Endpoint)
		}
	}

	now := time.Now().UTC()
	execution.DepartureNotificationSentAt = &now
	execution.UpdatedAt = now
	_, _ = s.executionStore.UpsertHomeVisitExecution(ctx, *execution)
}

func buildDeparturePushTitle(locale string) string {
	if strings.EqualFold(locale, "en") {
		return "Your professional is on the way"
	}
	return "Profesional Anda sudah berangkat"
}

func buildDeparturePushBody(
	locale string,
	appointment readmodel.AppointmentSeed,
	execution *appointmentstore.HomeVisitExecution,
) string {
	serviceName := strings.TrimSpace(appointment.ServiceSnapshot.Name)
	if serviceName == "" {
		if strings.EqualFold(locale, "en") {
			serviceName = "home visit service"
		} else {
			serviceName = "layanan home visit"
		}
	}

	if execution != nil && execution.ETAMinutesHint != nil {
		if strings.EqualFold(locale, "en") {
			return serviceName + " is on the way. Estimated arrival around " + intToString(*execution.ETAMinutesHint) + " minutes."
		}
		return serviceName + " sedang menuju lokasi Anda. Estimasi tiba sekitar " + intToString(*execution.ETAMinutesHint) + " menit."
	}

	if strings.EqualFold(locale, "en") {
		return serviceName + " is now on the way to your location."
	}
	return serviceName + " sudah berangkat menuju lokasi Anda."
}

func buildAppointmentActivityPath(locale string, appointmentID string) string {
	normalizedLocale := strings.ToLower(strings.TrimSpace(locale))
	if normalizedLocale != "en" {
		normalizedLocale = "id"
	}
	return "/" + normalizedLocale + "/activity/" + appointmentID
}

func intToString(value int) string {
	return strconv.Itoa(value)
}

func haversineKM(lat1 float64, lng1 float64, lat2 float64, lng2 float64) float64 {
	const earthRadiusKM = 6371.0

	toRadians := func(value float64) float64 {
		return value * math.Pi / 180
	}

	dLat := toRadians(lat2 - lat1)
	dLng := toRadians(lng2 - lng1)
	lat1Rad := toRadians(lat1)
	lat2Rad := toRadians(lat2)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKM * c
}

func floatPointer(value float64) *float64 {
	next := value
	return &next
}

func withCustomerSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{customerauth.SecuritySchemeName: {}},
	}
	return operation
}

func withProfessionalSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{professionalauth.SecuritySchemeName: {}},
	}
	return operation
}

func toAPIError(err error) error {
	var apiErr *web.APIError
	if errors.As(err, &apiErr) {
		return apiErr
	}

	switch {
	case errors.Is(err, professionalportal.ErrInvalidProfessionalID), errors.Is(err, professionalportal.ErrInvalidAppointmentRecord):
		return web.NewAPIError(http.StatusBadRequest, "invalid_appointment_record", err.Error())
	case errors.Is(err, ErrInvalidAppointmentInput):
		return web.NewAPIError(http.StatusBadRequest, "invalid_appointment_input", "appointment input is invalid")
	case errors.Is(err, ErrInvalidAppointmentFeedback):
		return web.NewAPIError(http.StatusBadRequest, "invalid_appointment_feedback", "appointment feedback is invalid")
	case errors.Is(err, ErrInvalidCurrentLocation):
		return web.NewAPIError(http.StatusBadRequest, "invalid_current_location", "current location must contain a valid latitude and longitude")
	case errors.Is(err, ErrAppointmentScopeMismatch):
		return web.NewAPIError(http.StatusForbidden, "appointment_scope_forbidden", "appointment scope does not match the authenticated session")
	case errors.Is(err, ErrAppointmentNotFound):
		return web.NewAPIError(http.StatusNotFound, "appointment_not_found", "appointment was not found")
	case errors.Is(err, ErrAppointmentConflict):
		return web.NewAPIError(http.StatusConflict, "appointment_conflict", "appointment state transition is not allowed")
	case errors.Is(err, ErrAppointmentFeedbackConflict):
		return web.NewAPIError(http.StatusConflict, "appointment_feedback_conflict", err.Error())
	case errors.Is(err, ErrHomeVisitUnavailable):
		return web.NewAPIError(http.StatusConflict, "home_visit_departure_unavailable", err.Error())
	case errors.Is(err, ErrPaymentProviderMisconfigured):
		return web.NewAPIError(http.StatusServiceUnavailable, "payment_provider_unavailable", "payment provider is not configured")
	case errors.Is(err, ErrServiceUnavailable):
		return web.NewAPIError(http.StatusServiceUnavailable, "appointment_service_unavailable", "appointment home-visit service is not configured")
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
