package simulation

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var ErrNotFound = errors.New("resource not found")
var ErrInvalidSlug = errors.New("invalid slug")

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type Service struct {
	dataDir string
}

func NewService(dataDir string) Service {
	return Service{dataDir: dataDir}
}

func (s Service) Catalog(ctx context.Context) (CatalogData, error) {
	categoryRows, err := readJSON[[]Category](ctx, s.dataDir, "service_categories.json")
	if err != nil {
		return CatalogData{}, err
	}

	serviceRows, err := readJSON[[]mockDBServiceRow](ctx, s.dataDir, "services.json")
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
		})
	}

	return CatalogData{
		Categories:    categoryRows,
		Services:      services,
		Professionals: professionals,
	}, nil
}

func (s Service) Appointments(ctx context.Context) (AppointmentData, error) {
	appointmentRows, err := readJSON[[]mockDBAppointmentRow](ctx, s.dataDir, "appointments.json")
	if err != nil {
		return AppointmentData{}, err
	}

	appointments := make([]AppointmentSeed, 0, len(appointmentRows))
	for _, row := range appointmentRows {
		appointments = append(appointments, AppointmentSeed{
			Index:          row.Index,
			ID:             row.ID,
			ProfessionalID: row.ProfessionalID,
			ServiceID:      row.ServiceID,
			Time:           row.ScheduledTimeLabel,
			Status:         row.Status,
			TotalPrice:     row.TotalPriceLabel,
		})
	}

	return AppointmentData{Appointments: appointments}, nil
}

func (s Service) Chat(ctx context.Context) (ChatData, error) {
	threadRows, err := readJSON[[]mockDBChatThreadRow](ctx, s.dataDir, "chat_threads.json")
	if err != nil {
		return ChatData{}, err
	}

	messageRows, err := readJSON[[]mockDBChatMessageRow](ctx, s.dataDir, "chat_messages.json")
	if err != nil {
		return ChatData{}, err
	}

	professionalRows, err := readOptionalJSON[[]mockDBProfessionalRow](ctx, s.dataDir, "professionals.json", []mockDBProfessionalRow{})
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
	professionalRows, err := readJSON[[]mockDBProfessionalRow](ctx, s.dataDir, "professionals.json")
	if err != nil {
		return nil, err
	}

	serviceRows, err := readOptionalJSON[[]mockDBServiceRow](ctx, s.dataDir, "services.json", []mockDBServiceRow{})
	if err != nil {
		return nil, err
	}

	specialtyRows, err := readOptionalJSON[[]mockDBProfessionalLabelRow](ctx, s.dataDir, "professional_specialties.json", []mockDBProfessionalLabelRow{})
	if err != nil {
		return nil, err
	}

	languageRows, err := readOptionalJSON[[]mockDBProfessionalLabelRow](ctx, s.dataDir, "professional_languages.json", []mockDBProfessionalLabelRow{})
	if err != nil {
		return nil, err
	}

	practiceLocationRows, err := readOptionalJSON[[]mockDBProfessionalPracticeLocationRow](ctx, s.dataDir, "professional_practice_locations.json", []mockDBProfessionalPracticeLocationRow{})
	if err != nil {
		return nil, err
	}

	portfolioStatRows, err := readOptionalJSON[[]mockDBProfessionalPortfolioStatRow](ctx, s.dataDir, "professional_portfolio_stats.json", []mockDBProfessionalPortfolioStatRow{})
	if err != nil {
		return nil, err
	}

	credentialRows, err := readOptionalJSON[[]mockDBProfessionalCredentialRow](ctx, s.dataDir, "professional_credentials.json", []mockDBProfessionalCredentialRow{})
	if err != nil {
		return nil, err
	}

	activityStoryRows, err := readOptionalJSON[[]mockDBProfessionalStoryRow](ctx, s.dataDir, "professional_activity_stories.json", []mockDBProfessionalStoryRow{})
	if err != nil {
		return nil, err
	}

	portfolioEntryRows, err := readOptionalJSON[[]mockDBProfessionalPortfolioEntryRow](ctx, s.dataDir, "professional_portfolio_entries.json", []mockDBProfessionalPortfolioEntryRow{})
	if err != nil {
		return nil, err
	}

	galleryRows, err := readOptionalJSON[[]mockDBProfessionalGalleryItemRow](ctx, s.dataDir, "professional_gallery_items.json", []mockDBProfessionalGalleryItemRow{})
	if err != nil {
		return nil, err
	}

	testimonialRows, err := readOptionalJSON[[]mockDBProfessionalTestimonialRow](ctx, s.dataDir, "professional_testimonials.json", []mockDBProfessionalTestimonialRow{})
	if err != nil {
		return nil, err
	}

	feedbackSummaryRows, err := readOptionalJSON[[]mockDBProfessionalFeedbackSummaryRow](ctx, s.dataDir, "professional_feedback_summaries.json", []mockDBProfessionalFeedbackSummaryRow{})
	if err != nil {
		return nil, err
	}

	feedbackMetricRows, err := readOptionalJSON[[]mockDBProfessionalFeedbackMetricRow](ctx, s.dataDir, "professional_feedback_metrics.json", []mockDBProfessionalFeedbackMetricRow{})
	if err != nil {
		return nil, err
	}

	feedbackBreakdownRows, err := readOptionalJSON[[]mockDBProfessionalFeedbackBreakdownRow](ctx, s.dataDir, "professional_feedback_breakdowns.json", []mockDBProfessionalFeedbackBreakdownRow{})
	if err != nil {
		return nil, err
	}

	recentActivityRows, err := readOptionalJSON[[]mockDBProfessionalRecentActivityRow](ctx, s.dataDir, "professional_recent_activities.json", []mockDBProfessionalRecentActivityRow{})
	if err != nil {
		return nil, err
	}

	serviceOfferingRows, err := readOptionalJSON[[]mockDBProfessionalServiceOfferingRow](ctx, s.dataDir, "professional_service_offerings.json", []mockDBProfessionalServiceOfferingRow{})
	if err != nil {
		return nil, err
	}

	servicesByID := make(map[string]mockDBServiceRow, len(serviceRows))
	for _, service := range serviceRows {
		servicesByID[service.ID] = service
	}

	specialtiesByProfessionalID := groupLabelsByProfessionalID(specialtyRows)
	languagesByProfessionalID := groupLabelsByProfessionalID(languageRows)
	practiceLocationsByProfessionalID := groupPracticeLocationsByProfessionalID(practiceLocationRows)
	portfolioStatsByProfessionalID := groupPortfolioStatsByProfessionalID(portfolioStatRows)
	credentialsByProfessionalID := groupCredentialsByProfessionalID(credentialRows)
	activityStoriesByProfessionalID := groupStoriesByProfessionalID(activityStoryRows)
	portfolioEntriesByProfessionalID := groupPortfolioEntriesByProfessionalID(portfolioEntryRows)
	galleryByProfessionalID := groupGalleryItemsByProfessionalID(galleryRows)
	testimonialsByProfessionalID := groupTestimonialsByProfessionalID(testimonialRows)
	feedbackSummaryByProfessionalID := groupFeedbackSummariesByProfessionalID(feedbackSummaryRows)
	feedbackMetricsByProfessionalID := groupFeedbackMetricsByProfessionalID(feedbackMetricRows)
	feedbackBreakdownsByProfessionalID := groupFeedbackBreakdownsByProfessionalID(feedbackBreakdownRows)
	recentActivitiesByProfessionalID := groupRecentActivitiesByProfessionalID(recentActivityRows)
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

		professionals = append(professionals, Professional{
			Index:             row.Index,
			ID:                row.ID,
			Slug:              row.Slug,
			Name:              row.Name,
			Title:             row.Title,
			CategoryID:        categoryID,
			Location:          row.Location,
			Rating:            row.Rating,
			Reviews:           row.Reviews,
			Experience:        row.Experience,
			ClientsServed:     row.ClientsServed,
			Image:             row.Image,
			CoverImage:        row.CoverImage,
			BadgeLabel:        badgeLabel,
			AvailabilityLabel: availabilityLabel,
			ResponseTime:      row.ResponseTime,
			Specialties:       specialtiesByProfessionalID[row.ID],
			Languages:         languagesByProfessionalID[row.ID],
			AddressLines:      toAddressLines(practiceLocationsByProfessionalID[row.ID]),
			About:             row.About,
			PortfolioStats:    portfolioStatsByProfessionalID[row.ID],
			Credentials:       credentialsByProfessionalID[row.ID],
			ActivityStories:   activityStoriesByProfessionalID[row.ID],
			PortfolioEntries:  portfolioEntriesByProfessionalID[row.ID],
			Gallery:           galleryByProfessionalID[row.ID],
			Testimonials:      testimonialsByProfessionalID[row.ID],
			FeedbackSummary:   feedbackSummaryByProfessionalID[row.ID],
			FeedbackMetrics:   feedbackMetricsByProfessionalID[row.ID],
			FeedbackBreakdown: feedbackBreakdownsByProfessionalID[row.ID],
			RecentActivities:  recentActivitiesByProfessionalID[row.ID],
			Services:          toProfessionalServices(offerings),
		})
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

func toServiceType(row mockDBServiceRow) ServiceType {
	if row.DefaultMode == "online" && !row.ServiceModes.HomeVisit && !row.ServiceModes.Onsite {
		return ServiceTypeConsultation
	}

	if row.DefaultMode == "online" {
		return ServiceTypeConsultation
	}

	return ServiceTypeVisit
}

func toServiceBadge(row mockDBServiceRow) string {
	if len(row.Tags) > 0 && strings.TrimSpace(row.Tags[0]) != "" {
		return row.Tags[0]
	}

	return strings.Title(strings.ReplaceAll(row.DefaultMode, "_", " "))
}

func primaryCategoryID(offerings []mockDBProfessionalServiceOfferingRow, servicesByID map[string]mockDBServiceRow) string {
	for _, offering := range offerings {
		service, ok := servicesByID[offering.ServiceID]
		if ok {
			return service.CategoryID
		}
	}

	return ""
}

func deriveBadgeLabel(row mockDBProfessionalRow, offerings []mockDBProfessionalServiceOfferingRow, servicesByID map[string]mockDBServiceRow) string {
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

func toAddressLines(rows []mockDBProfessionalPracticeLocationRow) []string {
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

func toProfessionalServices(rows []mockDBProfessionalServiceOfferingRow) []ProfessionalService {
	services := make([]ProfessionalService, 0, len(rows))
	for _, row := range rows {
		services = append(services, ProfessionalService{
			Index:     row.Index,
			ServiceID: row.ServiceID,
			Duration:  row.Duration,
			Price:     row.Price,
			Summary:   row.Summary,
		})
	}

	return services
}

func groupLabelsByProfessionalID(rows []mockDBProfessionalLabelRow) map[string][]string {
	grouped := make(map[string][]string)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row.Label)
	}
	return grouped
}

func groupPracticeLocationsByProfessionalID(rows []mockDBProfessionalPracticeLocationRow) map[string][]mockDBProfessionalPracticeLocationRow {
	grouped := make(map[string][]mockDBProfessionalPracticeLocationRow)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row)
	}
	return grouped
}

func groupPortfolioStatsByProfessionalID(rows []mockDBProfessionalPortfolioStatRow) map[string][]ProfessionalPortfolioStat {
	grouped := make(map[string][]ProfessionalPortfolioStat)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalPortfolioStat{
			Index:  row.Index,
			Label:  row.Label,
			Value:  row.Value,
			Detail: row.Detail,
		})
	}
	return grouped
}

func groupCredentialsByProfessionalID(rows []mockDBProfessionalCredentialRow) map[string][]ProfessionalCredential {
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

func groupStoriesByProfessionalID(rows []mockDBProfessionalStoryRow) map[string][]ProfessionalStory {
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

func groupPortfolioEntriesByProfessionalID(rows []mockDBProfessionalPortfolioEntryRow) map[string][]ProfessionalPortfolioEntry {
	grouped := make(map[string][]ProfessionalPortfolioEntry)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalPortfolioEntry{
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

func groupGalleryItemsByProfessionalID(rows []mockDBProfessionalGalleryItemRow) map[string][]ProfessionalGalleryItem {
	grouped := make(map[string][]ProfessionalGalleryItem)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalGalleryItem{
			Index: row.Index,
			Image: row.Image,
			Alt:   row.Alt,
			Label: row.Label,
		})
	}
	return grouped
}

func groupTestimonialsByProfessionalID(rows []mockDBProfessionalTestimonialRow) map[string][]ProfessionalTestimonial {
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

func groupFeedbackSummariesByProfessionalID(rows []mockDBProfessionalFeedbackSummaryRow) map[string]ProfessionalFeedbackSummary {
	grouped := make(map[string]ProfessionalFeedbackSummary)
	for _, row := range rows {
		grouped[row.ProfessionalID] = ProfessionalFeedbackSummary{
			RecommendationRate: row.RecommendationRate,
			RepeatClientRate:   row.RepeatClientRate,
		}
	}
	return grouped
}

func groupFeedbackMetricsByProfessionalID(rows []mockDBProfessionalFeedbackMetricRow) map[string][]ProfessionalFeedbackMetric {
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

func groupFeedbackBreakdownsByProfessionalID(rows []mockDBProfessionalFeedbackBreakdownRow) map[string][]ProfessionalFeedbackBreakdown {
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

func groupRecentActivitiesByProfessionalID(rows []mockDBProfessionalRecentActivityRow) map[string][]ProfessionalRecentActivity {
	grouped := make(map[string][]ProfessionalRecentActivity)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], ProfessionalRecentActivity{
			Index:     row.Index,
			DateLabel: row.DateLabel,
			Title:     row.Title,
			Channel:   row.Channel,
			Summary:   row.Summary,
		})
	}
	return grouped
}

func groupServiceOfferingsByProfessionalID(rows []mockDBProfessionalServiceOfferingRow) map[string][]mockDBProfessionalServiceOfferingRow {
	grouped := make(map[string][]mockDBProfessionalServiceOfferingRow)
	for _, row := range rows {
		grouped[row.ProfessionalID] = append(grouped[row.ProfessionalID], row)
	}
	return grouped
}

func readJSON[T any](ctx context.Context, dataDir string, filename string) (T, error) {
	var zero T

	select {
	case <-ctx.Done():
		return zero, ctx.Err()
	default:
	}

	path := filepath.Clean(filepath.Join(dataDir, filename))
	bytes, err := os.ReadFile(path)
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

func readOptionalJSON[T any](ctx context.Context, dataDir string, filename string, fallback T) (T, error) {
	payload, err := readJSON[T](ctx, dataDir, filename)
	if err == nil {
		return payload, nil
	}

	if errors.Is(err, os.ErrNotExist) {
		return fallback, nil
	}

	return fallback, err
}
