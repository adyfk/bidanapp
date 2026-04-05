package readmodel

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"regexp"
	"strings"

	"bidanapp/apps/backend/internal/platform/appointmentstore"
	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/portalstore"
)

var ErrNotFound = errors.New("resource not found")
var ErrInvalidSlug = errors.New("invalid slug")

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type Service struct {
	repository       DocumentRepository
	portalStore      portalstore.Reader
	appointmentStore appointmentstore.Reader
}

func NewService(dataDir string, portalStore portalstore.Reader, appointmentStores ...appointmentstore.Reader) Service {
	return NewServiceWithRepository(NewRepository(dataDir, nil), portalStore, appointmentStores...)
}

func NewServiceWithStore(
	dataDir string,
	repositoryStore contentstore.Store,
	portalStore portalstore.Reader,
	appointmentStores ...appointmentstore.Reader,
) Service {
	return NewServiceWithRepository(NewRepository(dataDir, repositoryStore), portalStore, appointmentStores...)
}

func NewServiceWithRepository(
	repository DocumentRepository,
	portalStore portalstore.Reader,
	appointmentStores ...appointmentstore.Reader,
) Service {
	var appointmentStore appointmentstore.Reader
	if len(appointmentStores) > 0 {
		appointmentStore = appointmentStores[0]
	}

	return Service{
		repository:       repository,
		portalStore:      portalStore,
		appointmentStore: appointmentStore,
	}
}

func (s Service) Catalog(ctx context.Context) (CatalogData, error) {
	bundle, err := readJSONBundle(ctx, s.repository, []string{
		"areas.json",
		"service_categories.json",
		"services.json",
	})
	if err != nil {
		return CatalogData{}, err
	}

	areaRows, err := decodeBundleJSON[[]Area](bundle, "areas.json")
	if err != nil {
		return CatalogData{}, err
	}

	categoryRows, err := decodeBundleJSON[[]Category](bundle, "service_categories.json")
	if err != nil {
		return CatalogData{}, err
	}

	serviceRows, err := decodeBundleJSON[[]seedDataServiceRow](bundle, "services.json")
	if err != nil {
		return CatalogData{}, err
	}

	professionals, err := s.Professionals(ctx)
	if err != nil {
		return CatalogData{}, err
	}

	services := make([]GlobalService, 0, len(serviceRows))
	for _, row := range serviceRows {
		services = append(services, GlobalService{
			Index:            row.Index,
			ID:               row.ID,
			Slug:             row.Slug,
			Name:             row.Name,
			CategoryID:       row.CategoryID,
			Description:      row.Description,
			ShortDescription: row.ShortDescription,
			Type:             toServiceType(row),
			Image:            row.Image,
			CoverImage:       row.CoverImage,
			Badge:            toServiceBadge(row),
			Tags:             row.Tags,
			Highlights:       row.Highlights,
			DefaultMode:      row.DefaultMode,
			ServiceModes:     toServiceMode(row.ServiceModes),
		})
	}

	return CatalogData{
		Areas:         areaRows,
		Categories:    categoryRows,
		Services:      services,
		Professionals: professionals,
	}, nil
}

func (s Service) Appointments(ctx context.Context) (AppointmentData, error) {
	if s.appointmentStore != nil {
		appointments, err := s.appointmentStore.ListAppointments(ctx)
		if err == nil {
			historyByAppointmentID, historyErr := s.appointmentStore.ListAppointmentStatusHistory(ctx)
			if historyErr != nil {
				return AppointmentData{}, historyErr
			}

			payload := make([]AppointmentSeed, 0, len(appointments))
			for _, appointment := range appointments {
				payload = append(payload, AppointmentSeedFromStoreRecord(appointment, historyByAppointmentID[appointment.ID]))
			}
			return AppointmentData{Appointments: payload}, nil
		}
	}

	bundle, err := readJSONBundle(ctx, s.repository, []string{
		"appointments.json",
		"professional_service_offerings.json",
		"services.json",
	})
	if err != nil {
		return AppointmentData{}, err
	}

	appointmentRows, err := decodeBundleJSON[[]seedDataAppointmentRow](bundle, "appointments.json")
	if err != nil {
		return AppointmentData{}, err
	}

	serviceRows, err := decodeOptionalBundleJSON[[]seedDataServiceRow](bundle, "services.json", []seedDataServiceRow{})
	if err != nil {
		return AppointmentData{}, err
	}

	serviceOfferingRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalServiceOfferingRow](
		bundle,
		"professional_service_offerings.json",
		[]seedDataProfessionalServiceOfferingRow{},
	)
	if err != nil {
		return AppointmentData{}, err
	}

	serviceRowsByID := make(map[string]seedDataServiceRow, len(serviceRows))
	for _, row := range serviceRows {
		serviceRowsByID[row.ID] = row
	}

	serviceOfferingRowsByID := make(map[string]seedDataProfessionalServiceOfferingRow, len(serviceOfferingRows))
	for _, row := range serviceOfferingRows {
		serviceOfferingRowsByID[row.ID] = row
	}

	appointments := make([]AppointmentSeed, 0, len(appointmentRows))
	for _, row := range appointmentRows {
		appointments = append(
			appointments,
			toAppointmentFromSeed(row, serviceRowsByID, serviceOfferingRowsByID),
		)
	}

	return AppointmentData{
		Appointments: overlayAppointmentReadModel(ctx, s.portalStore, appointments),
	}, nil
}

func (s Service) AppointmentsByConsumerID(ctx context.Context, consumerID string) (AppointmentData, error) {
	if s.appointmentStore != nil {
		appointments, err := s.appointmentStore.AppointmentsByConsumerID(ctx, consumerID)
		if err == nil {
			historyByAppointmentID, historyErr := s.appointmentStore.ListAppointmentStatusHistory(ctx)
			if historyErr != nil {
				return AppointmentData{}, historyErr
			}

			payload := make([]AppointmentSeed, 0, len(appointments))
			for _, appointment := range appointments {
				payload = append(payload, AppointmentSeedFromStoreRecord(appointment, historyByAppointmentID[appointment.ID]))
			}
			return AppointmentData{Appointments: payload}, nil
		}
	}

	payload, err := s.Appointments(ctx)
	if err != nil {
		return AppointmentData{}, err
	}

	filtered := make([]AppointmentSeed, 0, len(payload.Appointments))
	for _, appointment := range payload.Appointments {
		if appointment.ConsumerID == consumerID {
			filtered = append(filtered, appointment)
		}
	}

	return AppointmentData{Appointments: filtered}, nil
}

func (s Service) AppointmentsByProfessionalID(ctx context.Context, professionalID string) (AppointmentData, error) {
	if s.appointmentStore != nil {
		appointments, err := s.appointmentStore.AppointmentsByProfessionalID(ctx, professionalID)
		if err == nil {
			historyByAppointmentID, historyErr := s.appointmentStore.ListAppointmentStatusHistory(ctx)
			if historyErr != nil {
				return AppointmentData{}, historyErr
			}

			payload := make([]AppointmentSeed, 0, len(appointments))
			for _, appointment := range appointments {
				payload = append(payload, AppointmentSeedFromStoreRecord(appointment, historyByAppointmentID[appointment.ID]))
			}
			return AppointmentData{Appointments: payload}, nil
		}
	}

	payload, err := s.Appointments(ctx)
	if err != nil {
		return AppointmentData{}, err
	}

	filtered := make([]AppointmentSeed, 0, len(payload.Appointments))
	for _, appointment := range payload.Appointments {
		if appointment.ProfessionalID == professionalID {
			filtered = append(filtered, appointment)
		}
	}

	return AppointmentData{Appointments: filtered}, nil
}

func (s Service) AppointmentByID(ctx context.Context, appointmentID string) (AppointmentSeed, error) {
	if s.appointmentStore != nil {
		appointment, err := s.appointmentStore.AppointmentByID(ctx, appointmentID)
		if err == nil {
			history, historyErr := s.appointmentStore.AppointmentStatusHistoryByAppointmentID(ctx, appointmentID)
			if historyErr != nil {
				return AppointmentSeed{}, historyErr
			}
			return AppointmentSeedFromStoreRecord(appointment, history), nil
		}
	}

	payload, err := s.Appointments(ctx)
	if err != nil {
		return AppointmentSeed{}, err
	}

	for _, appointment := range payload.Appointments {
		if appointment.ID == appointmentID {
			return appointment, nil
		}
	}

	return AppointmentSeed{}, ErrNotFound
}

func (s Service) Chat(ctx context.Context) (ChatData, error) {
	bundle, err := readJSONBundle(ctx, s.repository, []string{
		"chat_messages.json",
		"chat_threads.json",
		"professionals.json",
	})
	if err != nil {
		return ChatData{}, err
	}

	threadRows, err := decodeBundleJSON[[]seedDataChatThreadRow](bundle, "chat_threads.json")
	if err != nil {
		return ChatData{}, err
	}

	messageRows, err := decodeBundleJSON[[]seedDataChatMessageRow](bundle, "chat_messages.json")
	if err != nil {
		return ChatData{}, err
	}

	professionalRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalRow](bundle, "professionals.json", []seedDataProfessionalRow{})
	if err != nil {
		return ChatData{}, err
	}

	professionalSlugsByID := make(map[string]string, len(professionalRows))
	for _, professional := range professionalRows {
		professionalSlugsByID[professional.ID] = professional.Slug
	}

	messagesByThreadID := make(map[string][]ChatMessage)
	for _, row := range messageRows {
		messagesByThreadID[row.ThreadID] = append(messagesByThreadID[row.ThreadID], ChatMessage{
			ID:     row.SourceMessageID,
			Text:   row.Text,
			Sender: row.Sender,
			Time:   row.TimeLabel,
			IsRead: row.IsRead,
		})
	}

	directThreads := make([]ChatThread, 0)
	appointmentThreads := make([]ChatThread, 0)
	for _, row := range threadRows {
		thread := ChatThread{
			Index:            row.Index,
			ID:               row.ID,
			ProfessionalSlug: professionalSlugsByID[row.ProfessionalID],
			AppointmentID:    row.AppointmentID,
			DayLabel:         row.DayLabel,
			InputPlaceholder: row.InputPlaceholder,
			AutoReplyText:    row.AutoReplyText,
			Messages:         messagesByThreadID[row.ID],
		}

		if row.ThreadType == "appointment" {
			appointmentThreads = append(appointmentThreads, thread)
			continue
		}

		directThreads = append(directThreads, thread)
	}

	return ChatData{
		DirectThreads:      directThreads,
		AppointmentThreads: appointmentThreads,
	}, nil
}

func (s Service) Professionals(ctx context.Context) ([]Professional, error) {
	bundle, err := readJSONBundle(ctx, s.repository, []string{
		"appointments.json",
		"professional_activity_stories.json",
		"professional_availability_date_overrides.json",
		"professional_availability_policies.json",
		"professional_availability_weekly_hours.json",
		"professional_cancellation_policies.json",
		"professional_coverage_areas.json",
		"professional_coverage_policies.json",
		"professional_credentials.json",
		"professional_feedback_breakdowns.json",
		"professional_feedback_metrics.json",
		"professional_feedback_summaries.json",
		"professional_gallery_items.json",
		"professional_languages.json",
		"professional_portfolio_entries.json",
		"professional_practice_locations.json",
		"professional_service_offerings.json",
		"professional_specialties.json",
		"professional_testimonials.json",
		"professionals.json",
		"services.json",
	})
	if err != nil {
		return nil, err
	}

	professionalRows, err := decodeBundleJSON[[]seedDataProfessionalRow](bundle, "professionals.json")
	if err != nil {
		return nil, err
	}

	serviceRows, err := decodeOptionalBundleJSON[[]seedDataServiceRow](bundle, "services.json", []seedDataServiceRow{})
	if err != nil {
		return nil, err
	}

	specialtyRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalLabelRow](bundle, "professional_specialties.json", []seedDataProfessionalLabelRow{})
	if err != nil {
		return nil, err
	}

	languageRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalLabelRow](bundle, "professional_languages.json", []seedDataProfessionalLabelRow{})
	if err != nil {
		return nil, err
	}

	practiceLocationRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalPracticeLocationRow](bundle, "professional_practice_locations.json", []seedDataProfessionalPracticeLocationRow{})
	if err != nil {
		return nil, err
	}

	coveragePolicyRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalCoveragePolicyRow](bundle, "professional_coverage_policies.json", []seedDataProfessionalCoveragePolicyRow{})
	if err != nil {
		return nil, err
	}

	coverageAreaRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalCoverageAreaRow](bundle, "professional_coverage_areas.json", []seedDataProfessionalCoverageAreaRow{})
	if err != nil {
		return nil, err
	}

	credentialRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalCredentialRow](bundle, "professional_credentials.json", []seedDataProfessionalCredentialRow{})
	if err != nil {
		return nil, err
	}

	activityStoryRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalStoryRow](bundle, "professional_activity_stories.json", []seedDataProfessionalStoryRow{})
	if err != nil {
		return nil, err
	}

	portfolioEntryRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalPortfolioEntryRow](bundle, "professional_portfolio_entries.json", []seedDataProfessionalPortfolioEntryRow{})
	if err != nil {
		return nil, err
	}

	availabilityWeeklyHourRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalAvailabilityWeeklyHoursRow](bundle, "professional_availability_weekly_hours.json", []seedDataProfessionalAvailabilityWeeklyHoursRow{})
	if err != nil {
		return nil, err
	}

	availabilityPolicyRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalAvailabilityPolicyRow](bundle, "professional_availability_policies.json", []seedDataProfessionalAvailabilityPolicyRow{})
	if err != nil {
		return nil, err
	}

	cancellationPolicyRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalCancellationPolicyRow](bundle, "professional_cancellation_policies.json", []seedDataProfessionalCancellationPolicyRow{})
	if err != nil {
		return nil, err
	}

	availabilityDateOverrideRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalAvailabilityDateOverrideRow](bundle, "professional_availability_date_overrides.json", []seedDataProfessionalAvailabilityDateOverrideRow{})
	if err != nil {
		return nil, err
	}

	galleryRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalGalleryItemRow](bundle, "professional_gallery_items.json", []seedDataProfessionalGalleryItemRow{})
	if err != nil {
		return nil, err
	}

	testimonialRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalTestimonialRow](bundle, "professional_testimonials.json", []seedDataProfessionalTestimonialRow{})
	if err != nil {
		return nil, err
	}

	feedbackSummaryRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalFeedbackSummaryRow](bundle, "professional_feedback_summaries.json", []seedDataProfessionalFeedbackSummaryRow{})
	if err != nil {
		return nil, err
	}

	feedbackMetricRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalFeedbackMetricRow](bundle, "professional_feedback_metrics.json", []seedDataProfessionalFeedbackMetricRow{})
	if err != nil {
		return nil, err
	}

	feedbackBreakdownRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalFeedbackBreakdownRow](bundle, "professional_feedback_breakdowns.json", []seedDataProfessionalFeedbackBreakdownRow{})
	if err != nil {
		return nil, err
	}

	serviceOfferingRows, err := decodeOptionalBundleJSON[[]seedDataProfessionalServiceOfferingRow](bundle, "professional_service_offerings.json", []seedDataProfessionalServiceOfferingRow{})
	if err != nil {
		return nil, err
	}

	appointmentRows, err := decodeOptionalBundleJSON[[]seedDataAppointmentRow](bundle, "appointments.json", []seedDataAppointmentRow{})
	if err != nil {
		return nil, err
	}

	servicesByID := make(map[string]seedDataServiceRow, len(serviceRows))
	for _, service := range serviceRows {
		servicesByID[service.ID] = service
	}

	specialtiesByProfessionalID := groupLabelsByProfessionalID(specialtyRows)
	languagesByProfessionalID := groupLabelsByProfessionalID(languageRows)
	practiceLocationsByProfessionalID := groupPracticeLocationsByProfessionalID(practiceLocationRows)
	coveragePoliciesByProfessionalID := mapCoveragePolicyByProfessionalID(coveragePolicyRows)
	coverageAreaIDsByProfessionalID := groupCoverageAreaIDsByProfessionalID(coverageAreaRows)
	credentialsByProfessionalID := groupCredentialsByProfessionalID(credentialRows)
	activityStoriesByProfessionalID := groupStoriesByProfessionalID(activityStoryRows)
	portfolioEntriesByProfessionalID := groupPortfolioEntriesByProfessionalID(portfolioEntryRows)
	availabilityRulesByProfessionalID := groupAvailabilityRulesByProfessionalID(
		availabilityWeeklyHourRows,
		availabilityPolicyRows,
		availabilityDateOverrideRows,
	)
	cancellationPoliciesByProfessionalID := groupCancellationPoliciesByProfessionalID(cancellationPolicyRows)
	galleryByProfessionalID := groupGalleryItemsByProfessionalID(galleryRows)
	testimonialsByProfessionalID := groupTestimonialsByProfessionalID(testimonialRows)
	feedbackSummaryByProfessionalID := groupFeedbackSummariesByProfessionalID(feedbackSummaryRows)
	feedbackMetricsByProfessionalID := groupFeedbackMetricsByProfessionalID(feedbackMetricRows)
	feedbackBreakdownsByProfessionalID := groupFeedbackBreakdownsByProfessionalID(feedbackBreakdownRows)
	recentActivitiesByProfessionalID := groupAppointmentRecentActivitiesByProfessionalID(appointmentRows)
	linkedTestimonialsByProfessionalID := groupAppointmentTestimonialsByProfessionalID(appointmentRows)
	serviceOfferingsByProfessionalID := groupServiceOfferingsByProfessionalID(serviceOfferingRows)

	professionals := make([]Professional, 0, len(professionalRows))
	for _, row := range professionalRows {
		offerings := serviceOfferingsByProfessionalID[row.ID]
		categoryID := primaryCategoryID(offerings, servicesByID)
		badgeLabel := strings.TrimSpace(row.BadgeLabel)
		if badgeLabel == "" {
			badgeLabel = deriveBadgeLabel(row, offerings, servicesByID)
		}

		availabilityLabel := strings.TrimSpace(row.AvailabilityLabel)
		if availabilityLabel == "" {
			availabilityLabel = deriveAvailabilityLabel(row.IsAvailable)
		}

		testimonials := append([]ProfessionalTestimonial{}, linkedTestimonialsByProfessionalID[row.ID]...)
		testimonials = append(testimonials, testimonialsByProfessionalID[row.ID]...)

		professionals = append(professionals, Professional{
			Index:                      row.Index,
			ID:                         row.ID,
			Slug:                       row.Slug,
			Name:                       row.Name,
			Title:                      row.Title,
			Gender:                     row.Gender,
			CategoryID:                 categoryID,
			Location:                   row.Location,
			Rating:                     row.Rating,
			Reviews:                    row.Reviews,
			Experience:                 row.Experience,
			ClientsServed:              row.ClientsServed,
			Image:                      row.Image,
			CoverImage:                 row.CoverImage,
			BadgeLabel:                 badgeLabel,
			AvailabilityLabel:          availabilityLabel,
			Availability:               ProfessionalAvailability{IsAvailable: row.IsAvailable},
			ResponseTime:               row.ResponseTime,
			Specialties:                specialtiesByProfessionalID[row.ID],
			Languages:                  languagesByProfessionalID[row.ID],
			AddressLines:               toAddressLines(practiceLocationsByProfessionalID[row.ID]),
			PracticeLocation:           toPracticeLocation(practiceLocationsByProfessionalID[row.ID]),
			Coverage:                   toProfessionalCoverage(coveragePoliciesByProfessionalID[row.ID], coverageAreaIDsByProfessionalID[row.ID]),
			About:                      row.About,
			Credentials:                credentialsByProfessionalID[row.ID],
			ActivityStories:            activityStoriesByProfessionalID[row.ID],
			PortfolioEntries:           portfolioEntriesByProfessionalID[row.ID],
			Gallery:                    galleryByProfessionalID[row.ID],
			Testimonials:               testimonials,
			FeedbackSummary:            feedbackSummaryByProfessionalID[row.ID],
			FeedbackMetrics:            feedbackMetricsByProfessionalID[row.ID],
			FeedbackBreakdown:          feedbackBreakdownsByProfessionalID[row.ID],
			RecentActivities:           recentActivitiesByProfessionalID[row.ID],
			AvailabilityRulesByMode:    availabilityRulesByProfessionalID[row.ID],
			CancellationPoliciesByMode: cancellationPoliciesByProfessionalID[row.ID],
			Services:                   toProfessionalServices(offerings),
		})
	}

	professionals = applyPublishedPortalOverlays(ctx, s.portalStore, professionals, servicesByID)
	if s.appointmentStore != nil {
		if appointments, err := s.appointmentStore.ListAppointments(ctx); err == nil {
			professionals = applyAppointmentFeedbackOverlays(professionals, appointments)
		}
	}

	return professionals, nil
}

func (s Service) ProfessionalBySlug(ctx context.Context, slug string) (Professional, error) {
	if !slugPattern.MatchString(slug) {
		return Professional{}, ErrInvalidSlug
	}

	professionals, err := s.Professionals(ctx)
	if err != nil {
		return Professional{}, err
	}

	for _, professional := range professionals {
		if professional.Slug == slug {
			return professional, nil
		}
	}

	return Professional{}, ErrNotFound
}

func toServiceType(row seedDataServiceRow) ServiceType {
	if row.DefaultMode == "online" && !row.ServiceModes.HomeVisit && !row.ServiceModes.Onsite {
		return ServiceTypeConsultation
	}

	if row.DefaultMode == "online" {
		return ServiceTypeConsultation
	}

	return ServiceTypeVisit
}

func toServiceBadge(row seedDataServiceRow) string {
	if len(row.Tags) > 0 && strings.TrimSpace(row.Tags[0]) != "" {
		return row.Tags[0]
	}

	return strings.Title(strings.ReplaceAll(row.DefaultMode, "_", " "))
}

func primaryCategoryID(offerings []seedDataProfessionalServiceOfferingRow, servicesByID map[string]seedDataServiceRow) string {
	for _, offering := range offerings {
		service, ok := servicesByID[offering.ServiceID]
		if ok {
			return service.CategoryID
		}
	}

	return ""
}

func deriveBadgeLabel(row seedDataProfessionalRow, offerings []seedDataProfessionalServiceOfferingRow, servicesByID map[string]seedDataServiceRow) string {
	if row.Title != "" {
		return row.Title
	}

	categoryID := primaryCategoryID(offerings, servicesByID)
	if categoryID != "" {
		return categoryID
	}

	return "Professional"
}

func deriveAvailabilityLabel(isAvailable bool) string {
	if isAvailable {
		return "Available now"
	}

	return "Currently unavailable"
}

func toAddressLines(rows []seedDataProfessionalPracticeLocationRow) []string {
	if len(rows) == 0 {
		return nil
	}

	lines := make([]string, 0, len(rows)*2)
	for _, row := range rows {
		if row.Label != "" {
			lines = append(lines, row.Label)
		}
		if row.Address != "" && row.Address != row.Label {
			lines = append(lines, row.Address)
		}
	}

	if len(lines) == 0 {
		return nil
	}

	return lines
}

func toServiceMode(row seedDataServiceModesRow) ServiceMode {
	return ServiceMode{
		Online:    row.Online,
		HomeVisit: row.HomeVisit,
		Onsite:    row.Onsite,
	}
}

func toProfessionalServices(rows []seedDataProfessionalServiceOfferingRow) []ProfessionalService {
	services := make([]ProfessionalService, 0, len(rows))
	for _, row := range rows {
		services = append(services, ProfessionalService{
			Index:        row.Index,
			ID:           row.ID,
			ServiceID:    row.ServiceID,
			Duration:     row.Duration,
			Price:        row.Price,
			Summary:      row.Summary,
			ServiceModes: ServiceMode{Online: row.SupportsOnline, HomeVisit: row.SupportsHomeVisit, Onsite: row.SupportsOnsite},
			DefaultMode:  row.DefaultMode,
			BookingFlow:  row.BookingFlow,
		})
	}

	return services
}

func groupLabelsByProfessionalID(rows []seedDataProfessionalLabelRow) map[string][]string {
	grouped := make(map[string][]string)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row.Label)
	}
	return grouped
}

func groupPracticeLocationsByProfessionalID(rows []seedDataProfessionalPracticeLocationRow) map[string][]seedDataProfessionalPracticeLocationRow {
	grouped := make(map[string][]seedDataProfessionalPracticeLocationRow)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row)
	}
	return grouped
}

func mapCoveragePolicyByProfessionalID(rows []seedDataProfessionalCoveragePolicyRow) map[string]seedDataProfessionalCoveragePolicyRow {
	grouped := make(map[string]seedDataProfessionalCoveragePolicyRow)
	for _, row := range rows {
		grouped[row.ProfessionalID] = row
	}
	return grouped
}

func groupCoverageAreaIDsByProfessionalID(rows []seedDataProfessionalCoverageAreaRow) map[string][]string {
	grouped := make(map[string][]string)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row.AreaID)
	}
	return grouped
}

func groupCredentialsByProfessionalID(rows []seedDataProfessionalCredentialRow) map[string][]ProfessionalCredential {
	grouped := make(map[string][]ProfessionalCredential)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalCredential{
			Index:  row.Index,
			Title:  row.Title,
			Issuer: row.Issuer,
			Year:   row.Year,
			Note:   row.Note,
		})
	}
	return grouped
}

func groupStoriesByProfessionalID(rows []seedDataProfessionalStoryRow) map[string][]ProfessionalStory {
	grouped := make(map[string][]ProfessionalStory)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalStory{
			Index:      row.Index,
			Title:      row.Title,
			Image:      row.Image,
			CapturedAt: row.CapturedAt,
			Location:   row.Location,
			Note:       row.Note,
		})
	}
	return grouped
}

func groupPortfolioEntriesByProfessionalID(rows []seedDataProfessionalPortfolioEntryRow) map[string][]ProfessionalPortfolioEntry {
	grouped := make(map[string][]ProfessionalPortfolioEntry)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalPortfolioEntry{
			ID:          row.ID,
			Index:       row.Index,
			Title:       row.Title,
			ServiceID:   row.ServiceID,
			PeriodLabel: row.PeriodLabel,
			Summary:     row.Summary,
			Outcomes:    row.Outcomes,
			Image:       row.Image,
		})
	}
	return grouped
}

func groupGalleryItemsByProfessionalID(rows []seedDataProfessionalGalleryItemRow) map[string][]ProfessionalGalleryItem {
	grouped := make(map[string][]ProfessionalGalleryItem)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalGalleryItem{
			ID:    row.ID,
			Index: row.Index,
			Image: row.Image,
			Alt:   row.Alt,
			Label: row.Label,
		})
	}
	return grouped
}

func groupTestimonialsByProfessionalID(rows []seedDataProfessionalTestimonialRow) map[string][]ProfessionalTestimonial {
	grouped := make(map[string][]ProfessionalTestimonial)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalTestimonial{
			Index:     row.Index,
			Author:    row.Author,
			Role:      row.Role,
			Rating:    row.Rating,
			DateLabel: row.DateLabel,
			Quote:     row.Quote,
			ServiceID: row.ServiceID,
			Image:     row.Image,
		})
	}
	return grouped
}

func groupFeedbackSummariesByProfessionalID(rows []seedDataProfessionalFeedbackSummaryRow) map[string]ProfessionalFeedbackSummary {
	grouped := make(map[string]ProfessionalFeedbackSummary)
	for _, row := range rows {
		grouped[row.ProfessionalID] = ProfessionalFeedbackSummary{
			RecommendationRate: row.RecommendationRate,
			RepeatClientRate:   row.RepeatClientRate,
		}
	}
	return grouped
}

func groupFeedbackMetricsByProfessionalID(rows []seedDataProfessionalFeedbackMetricRow) map[string][]ProfessionalFeedbackMetric {
	grouped := make(map[string][]ProfessionalFeedbackMetric)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalFeedbackMetric{
			Index:  row.Index,
			Label:  row.Label,
			Value:  row.Value,
			Detail: row.Detail,
		})
	}
	return grouped
}

func groupFeedbackBreakdownsByProfessionalID(rows []seedDataProfessionalFeedbackBreakdownRow) map[string][]ProfessionalFeedbackBreakdown {
	grouped := make(map[string][]ProfessionalFeedbackBreakdown)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalFeedbackBreakdown{
			Index:      row.Index,
			Label:      row.Label,
			Total:      row.Total,
			Percentage: row.Percentage,
		})
	}
	return grouped
}

func groupAppointmentRecentActivitiesByProfessionalID(rows []seedDataAppointmentRow) map[string][]ProfessionalRecentActivity {
	grouped := make(map[string][]ProfessionalRecentActivity)
	for _, row := range rows {
		if row.RecentActivity == nil {
			continue
		}

		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalRecentActivity{
			Index:     row.Index,
			DateLabel: row.RecentActivity.DateLabel,
			Title:     row.RecentActivity.Title,
			Channel:   row.RecentActivity.Channel,
			Summary:   row.RecentActivity.Summary,
		})
	}
	return grouped
}

func groupAppointmentTestimonialsByProfessionalID(rows []seedDataAppointmentRow) map[string][]ProfessionalTestimonial {
	grouped := make(map[string][]ProfessionalTestimonial)
	for _, row := range rows {
		if row.CustomerFeedback == nil {
			continue
		}

		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalTestimonial{
			Index:     row.Index,
			Author:    row.CustomerFeedback.Author,
			Role:      row.CustomerFeedback.Role,
			Rating:    row.CustomerFeedback.Rating,
			DateLabel: row.CustomerFeedback.DateLabel,
			Quote:     row.CustomerFeedback.Quote,
			ServiceID: row.ServiceID,
			Image:     row.CustomerFeedback.Image,
		})
	}
	return grouped
}

func groupServiceOfferingsByProfessionalID(rows []seedDataProfessionalServiceOfferingRow) map[string][]seedDataProfessionalServiceOfferingRow {
	grouped := make(map[string][]seedDataProfessionalServiceOfferingRow)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row)
	}
	return grouped
}

func groupAvailabilityRulesByProfessionalID(
	weeklyHourRows []seedDataProfessionalAvailabilityWeeklyHoursRow,
	policyRows []seedDataProfessionalAvailabilityPolicyRow,
	dateOverrideRows []seedDataProfessionalAvailabilityDateOverrideRow,
) map[string]map[string]ProfessionalAvailabilityRules {
	policiesByProfessionalMode := make(map[string]seedDataProfessionalAvailabilityPolicyRow)
	for _, row := range policyRows {
		policiesByProfessionalMode[row.ProfessionalID+":"+row.Mode] = row
	}

	weeklyHoursByProfessionalMode := make(map[string][]ProfessionalWeeklyAvailabilityWindow)
	for _, row := range weeklyHourRows {
		key := row.ProfessionalID + ":" + row.Mode
		weeklyHoursByProfessionalMode[key] = append(weeklyHoursByProfessionalMode[key], ProfessionalWeeklyAvailabilityWindow{
			EndTime:             row.EndTime,
			ID:                  row.ID,
			Index:               row.Index,
			IsEnabled:           true,
			SlotIntervalMinutes: row.SlotIntervalMinutes,
			StartTime:           row.StartTime,
			Weekday:             row.Weekday,
		})
	}

	dateOverridesByProfessionalMode := make(map[string][]ProfessionalAvailabilityDateOverride)
	for _, row := range dateOverrideRows {
		key := row.ProfessionalID + ":" + row.Mode
		var slotIntervalMinutes *int
		if row.SlotIntervalMinutes > 0 {
			slotIntervalMinutes = &row.SlotIntervalMinutes
		}

		dateOverridesByProfessionalMode[key] = append(dateOverridesByProfessionalMode[key], ProfessionalAvailabilityDateOverride{
			DateISO:             row.DateISO,
			EndTime:             row.EndTime,
			ID:                  row.ID,
			Index:               row.Index,
			IsClosed:            row.IsClosed,
			Note:                row.Note,
			SlotIntervalMinutes: slotIntervalMinutes,
			StartTime:           row.StartTime,
		})
	}

	grouped := make(map[string]map[string]ProfessionalAvailabilityRules)
	for key, policy := range policiesByProfessionalMode {
		parts := strings.SplitN(key, ":", 2)
		if len(parts) != 2 {
			continue
		}

		professionalID := parts[0]
		mode := parts[1]
		if grouped[professionalID] == nil {
			grouped[professionalID] = make(map[string]ProfessionalAvailabilityRules)
		}

		grouped[professionalID][mode] = ProfessionalAvailabilityRules{
			DateOverrides:      dateOverridesByProfessionalMode[key],
			MinimumNoticeHours: policy.MinimumNoticeHours,
			WeeklyHours:        weeklyHoursByProfessionalMode[key],
		}
	}

	for key, weeklyHours := range weeklyHoursByProfessionalMode {
		parts := strings.SplitN(key, ":", 2)
		if len(parts) != 2 {
			continue
		}

		professionalID := parts[0]
		mode := parts[1]
		if grouped[professionalID] == nil {
			grouped[professionalID] = make(map[string]ProfessionalAvailabilityRules)
		}

		if _, exists := grouped[professionalID][mode]; exists {
			continue
		}

		grouped[professionalID][mode] = ProfessionalAvailabilityRules{
			DateOverrides:      dateOverridesByProfessionalMode[key],
			MinimumNoticeHours: 0,
			WeeklyHours:        weeklyHours,
		}
	}

	return grouped
}

func groupCancellationPoliciesByProfessionalID(rows []seedDataProfessionalCancellationPolicyRow) map[string]map[string]ProfessionalCancellationPolicy {
	grouped := make(map[string]map[string]ProfessionalCancellationPolicy)
	for _, row := range rows {
		if grouped[row.ProfessionalID] == nil {
			grouped[row.ProfessionalID] = make(map[string]ProfessionalCancellationPolicy)
		}

		grouped[row.ProfessionalID][row.Mode] = ProfessionalCancellationPolicy{
			CustomerPaidCancelCutoffHours: row.CustomerPaidCancelCutoffHours,
			ProfessionalCancelOutcome:     row.ProfessionalCancelOutcome,
			BeforeCutoffOutcome:           row.BeforeCutoffOutcome,
			AfterCutoffOutcome:            row.AfterCutoffOutcome,
		}
	}
	return grouped
}

func toPracticeLocation(rows []seedDataProfessionalPracticeLocationRow) *ProfessionalPracticeLocation {
	if len(rows) == 0 {
		return nil
	}

	row := rows[0]
	return &ProfessionalPracticeLocation{
		Label:   row.Label,
		Address: row.Address,
		AreaID:  row.AreaID,
		Coordinates: GeoPoint{
			Latitude:  row.Latitude,
			Longitude: row.Longitude,
		},
	}
}

func toProfessionalCoverage(policy seedDataProfessionalCoveragePolicyRow, areaIDs []string) ProfessionalCoverage {
	return ProfessionalCoverage{
		AreaIDs:           areaIDs,
		HomeVisitRadiusKm: policy.HomeVisitRadiusKm,
		Center: GeoPoint{
			Latitude:  policy.CenterLatitude,
			Longitude: policy.CenterLongitude,
		},
	}
}

func readJSON[T any](ctx context.Context, repository DocumentRepository, filename string) (T, error) {
	var zero T

	select {
	case <-ctx.Done():
		return zero, ctx.Err()
	default:
	}

	bytes, err := repository.Read(ctx, filename)
	if err != nil {
		return zero, err
	}

	if !json.Valid(bytes) {
		return zero, errors.New("invalid json payload")
	}

	var payload T
	if err := json.Unmarshal(bytes, &payload); err != nil {
		return zero, err
	}

	return payload, nil
}

func readJSONBundle(ctx context.Context, repository DocumentRepository, filenames []string) (map[string][]byte, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	return repository.ReadMany(ctx, filenames)
}

func decodeBundleJSON[T any](bundle map[string][]byte, filename string) (T, error) {
	var zero T

	bytes, ok := bundle[filename]
	if !ok {
		return zero, os.ErrNotExist
	}
	if !json.Valid(bytes) {
		return zero, errors.New("invalid json payload")
	}

	var payload T
	if err := json.Unmarshal(bytes, &payload); err != nil {
		return zero, err
	}

	return payload, nil
}

func decodeOptionalBundleJSON[T any](bundle map[string][]byte, filename string, fallback T) (T, error) {
	payload, err := decodeBundleJSON[T](bundle, filename)
	if err == nil {
		return payload, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		return fallback, nil
	}

	return fallback, err
}

func readOptionalJSON[T any](ctx context.Context, repository DocumentRepository, filename string, fallback T) (T, error) {
	payload, err := readJSON[T](ctx, repository, filename)
	if err == nil {
		return payload, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		return fallback, nil
	}

	return fallback, err
}
