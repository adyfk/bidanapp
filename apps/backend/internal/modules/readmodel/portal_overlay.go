package readmodel

import (
	"context"
	"encoding/json"
	"regexp"
	"sort"
	"strings"

	"bidanapp/apps/backend/internal/platform/portalstore"
)

type portalReviewState struct {
	Status string `json:"status"`
}

type portalSnapshotState struct {
	AcceptingNewClients     bool                                     `json:"acceptingNewClients"`
	ActivityStories         []portalActivityStory                    `json:"activityStories"`
	AvailabilityRulesByMode map[string]ProfessionalAvailabilityRules `json:"availabilityRulesByMode,omitempty"`
	City                    string                                   `json:"city"`
	CoverageAreaIDs         []string                                 `json:"coverageAreaIds"`
	CoverageCenter          GeoPoint                                 `json:"coverageCenter"`
	Credentials             []portalCredential                       `json:"credentials"`
	DisplayName             string                                   `json:"displayName"`
	GalleryItems            []portalGalleryItem                      `json:"galleryItems"`
	HomeVisitRadiusKm       int                                      `json:"homeVisitRadiusKm"`
	PortfolioEntries        []portalPortfolioEntry                   `json:"portfolioEntries"`
	PracticeAddress         string                                   `json:"practiceAddress"`
	PracticeLabel           string                                   `json:"practiceLabel"`
	PublicBio               string                                   `json:"publicBio"`
	ResponseTimeGoal        string                                   `json:"responseTimeGoal"`
	ServiceConfigurations   []portalManagedService                   `json:"serviceConfigurations"`
	YearsExperience         string                                   `json:"yearsExperience"`
}

type portalManagedService struct {
	BookingFlow  string      `json:"bookingFlow"`
	DefaultMode  string      `json:"defaultMode"`
	Duration     string      `json:"duration"`
	Featured     bool        `json:"featured"`
	ID           string      `json:"id"`
	Index        int         `json:"index"`
	IsActive     bool        `json:"isActive"`
	Price        string      `json:"price"`
	ServiceID    string      `json:"serviceId"`
	ServiceModes ServiceMode `json:"serviceModes"`
	Summary      string      `json:"summary"`
}

type portalPortfolioEntry struct {
	ID          string   `json:"id"`
	Index       int      `json:"index"`
	Image       string   `json:"image"`
	Outcomes    []string `json:"outcomes"`
	PeriodLabel string   `json:"periodLabel"`
	ServiceID   string   `json:"serviceId,omitempty"`
	Summary     string   `json:"summary"`
	Title       string   `json:"title"`
	Visibility  string   `json:"visibility"`
}

type portalGalleryItem struct {
	Alt        string `json:"alt"`
	ID         string `json:"id"`
	Image      string `json:"image"`
	Index      int    `json:"index"`
	IsFeatured bool   `json:"isFeatured"`
	Label      string `json:"label"`
}

type portalCredential struct {
	Index  int    `json:"index"`
	Issuer string `json:"issuer"`
	Note   string `json:"note"`
	Title  string `json:"title"`
	Year   string `json:"year"`
}

type portalActivityStory struct {
	CapturedAt string `json:"capturedAt"`
	Image      string `json:"image"`
	Index      int    `json:"index"`
	Location   string `json:"location"`
	Note       string `json:"note"`
	Title      string `json:"title"`
}

var portalSlugSanitizer = regexp.MustCompile(`[^a-z0-9]+`)

func applyPublishedPortalOverlays(
	ctx context.Context,
	store portalstore.Reader,
	professionals []Professional,
	servicesByID map[string]seedDataServiceRow,
) []Professional {
	if store == nil {
		return professionals
	}

	state, err := store.Read(ctx)
	if err != nil || len(state.Sessions) == 0 {
		return professionals
	}

	nextProfessionals := append([]Professional(nil), professionals...)
	existingProfessionalIDs := make(map[string]struct{}, len(nextProfessionals))
	for index, professional := range nextProfessionals {
		existingProfessionalIDs[professional.ID] = struct{}{}
		record, ok := state.Sessions[professional.ID]
		if !ok {
			continue
		}

		state, ok := decodePublishedPortalState(record.Snapshot, professional.ID)
		if !ok {
			continue
		}

		nextProfessionals[index] = mergeProfessionalWithPortalState(professional, state, servicesByID)
	}

	for professionalID, record := range state.Sessions {
		if _, exists := existingProfessionalIDs[professionalID]; exists {
			continue
		}

		portalState, ok := decodePublishedPortalState(record.Snapshot, professionalID)
		if !ok {
			continue
		}

		nextProfessionals = append(nextProfessionals, synthesizeProfessionalFromPortalState(
			professionalID,
			portalState,
			servicesByID,
			len(nextProfessionals)+1,
		))
	}

	return nextProfessionals
}

func decodePublishedPortalState(snapshot map[string]any, professionalID string) (portalSnapshotState, bool) {
	reviewStatesByProfessionalID, ok := decodePortalSnapshotSection[map[string]portalReviewState](
		snapshot,
		"reviewStatesByProfessionalId",
	)
	if !ok {
		return portalSnapshotState{}, false
	}

	reviewState, ok := reviewStatesByProfessionalID[professionalID]
	if !ok || reviewState.Status != "published" {
		return portalSnapshotState{}, false
	}

	state, ok := decodePortalSnapshotSection[portalSnapshotState](snapshot, "state")
	if !ok {
		return portalSnapshotState{}, false
	}

	return state, true
}

func mergeProfessionalWithPortalState(
	professional Professional,
	state portalSnapshotState,
	servicesByID map[string]seedDataServiceRow,
) Professional {
	nextProfessional := professional

	nextProfessional.About = fallbackString(state.PublicBio, professional.About)
	nextProfessional.Availability = ProfessionalAvailability{
		IsAvailable: state.AcceptingNewClients,
	}
	nextProfessional.AvailabilityLabel = deriveAvailabilityLabel(state.AcceptingNewClients)
	nextProfessional.Experience = fallbackString(state.YearsExperience, professional.Experience)
	nextProfessional.Name = fallbackString(state.DisplayName, professional.Name)
	nextProfessional.ResponseTime = fallbackString(state.ResponseTimeGoal, professional.ResponseTime)

	if state.CoverageAreaIDs != nil || state.HomeVisitRadiusKm > 0 || state.CoverageCenter.Latitude != 0 || state.CoverageCenter.Longitude != 0 {
		nextProfessional.Coverage = ProfessionalCoverage{
			AreaIDs:           append([]string(nil), state.CoverageAreaIDs...),
			Center:            state.CoverageCenter,
			HomeVisitRadiusKm: state.HomeVisitRadiusKm,
		}
	}

	if state.Credentials != nil {
		nextProfessional.Credentials = toPortalCredentials(state.Credentials)
	}

	if state.ActivityStories != nil {
		nextProfessional.ActivityStories = toPortalActivityStories(state.ActivityStories)
	}

	if state.GalleryItems != nil {
		nextProfessional.Gallery = toPortalGalleryItems(state.GalleryItems)
	}

	if state.PortfolioEntries != nil {
		nextProfessional.PortfolioEntries = toPortalPortfolioEntries(state.PortfolioEntries)
	}

	if state.AvailabilityRulesByMode != nil {
		nextProfessional.AvailabilityRulesByMode = state.AvailabilityRulesByMode
	}

	if hasPortalPracticeLocation(state) {
		nextProfessional.Location = fallbackString(state.PracticeLabel, professional.Location)
		nextProfessional.PracticeLocation = &ProfessionalPracticeLocation{
			Address: fallbackString(state.PracticeAddress, fallbackPracticeAddress(professional)),
			AreaID:  fallbackString(firstString(state.CoverageAreaIDs), fallbackPracticeAreaID(professional)),
			Coordinates: GeoPoint{
				Latitude:  state.CoverageCenter.Latitude,
				Longitude: state.CoverageCenter.Longitude,
			},
			Label: fallbackString(state.PracticeLabel, fallbackPracticeLabel(professional)),
		}
		nextProfessional.AddressLines = toPortalAddressLines(state)
	}

	if state.ServiceConfigurations != nil {
		nextProfessional.Services = toPortalProfessionalServices(state.ServiceConfigurations, professional.ID)
		nextProfessional.CategoryID = primaryPortalCategoryID(nextProfessional.Services, servicesByID, professional.CategoryID)
	}

	return nextProfessional
}

func synthesizeProfessionalFromPortalState(
	professionalID string,
	state portalSnapshotState,
	servicesByID map[string]seedDataServiceRow,
	index int,
) Professional {
	services := toPortalProfessionalServices(state.ServiceConfigurations, professionalID)
	categoryID := primaryPortalCategoryID(services, servicesByID, "")
	displayName := fallbackString(state.DisplayName, professionalID)
	location := fallbackString(state.PracticeLabel, state.City)
	if strings.TrimSpace(location) == "" {
		location = "Remote"
	}

	title := "Professional"
	if categoryID != "" {
		title = categoryID
	} else if len(services) > 0 {
		if serviceRow, ok := servicesByID[services[0].ServiceID]; ok && strings.TrimSpace(serviceRow.Name) != "" {
			title = serviceRow.Name
		}
	}

	professional := Professional{
		About:             strings.TrimSpace(state.PublicBio),
		ActivityStories:   toPortalActivityStories(state.ActivityStories),
		Availability:      ProfessionalAvailability{IsAvailable: state.AcceptingNewClients},
		AvailabilityLabel: deriveAvailabilityLabel(state.AcceptingNewClients),
		BadgeLabel:        title,
		CategoryID:        categoryID,
		ClientsServed:     "0",
		CoverImage:        "",
		Coverage: ProfessionalCoverage{
			AreaIDs:           append([]string(nil), state.CoverageAreaIDs...),
			Center:            state.CoverageCenter,
			HomeVisitRadiusKm: state.HomeVisitRadiusKm,
		},
		Credentials:             toPortalCredentials(state.Credentials),
		Experience:              strings.TrimSpace(state.YearsExperience),
		FeedbackBreakdown:       []ProfessionalFeedbackBreakdown{},
		FeedbackMetrics:         []ProfessionalFeedbackMetric{},
		FeedbackSummary:         ProfessionalFeedbackSummary{},
		Gallery:                 toPortalGalleryItems(state.GalleryItems),
		Gender:                  "",
		ID:                      professionalID,
		Image:                   "",
		Index:                   index,
		Languages:               []string{},
		Location:                location,
		Name:                    displayName,
		PortfolioEntries:        toPortalPortfolioEntries(state.PortfolioEntries),
		Rating:                  0,
		RecentActivities:        []ProfessionalRecentActivity{},
		ResponseTime:            strings.TrimSpace(state.ResponseTimeGoal),
		Reviews:                 "0",
		Services:                services,
		Slug:                    buildPortalProfessionalSlug(displayName, professionalID),
		Specialties:             []string{},
		Testimonials:            []ProfessionalTestimonial{},
		Title:                   title,
		AvailabilityRulesByMode: state.AvailabilityRulesByMode,
	}

	if hasPortalPracticeLocation(state) {
		professional.AddressLines = toPortalAddressLines(state)
		professional.PracticeLocation = &ProfessionalPracticeLocation{
			Address: fallbackString(state.PracticeAddress, state.PublicBio),
			AreaID:  firstString(state.CoverageAreaIDs),
			Coordinates: GeoPoint{
				Latitude:  state.CoverageCenter.Latitude,
				Longitude: state.CoverageCenter.Longitude,
			},
			Label: fallbackString(state.PracticeLabel, location),
		}
	}

	return professional
}

func toPortalCredentials(credentials []portalCredential) []ProfessionalCredential {
	nextCredentials := make([]ProfessionalCredential, 0, len(credentials))
	for index, credential := range credentials {
		nextCredentials = append(nextCredentials, ProfessionalCredential{
			Index:  normalizeIndex(credential.Index, index),
			Issuer: credential.Issuer,
			Note:   credential.Note,
			Title:  credential.Title,
			Year:   credential.Year,
		})
	}

	return nextCredentials
}

func toPortalActivityStories(activityStories []portalActivityStory) []ProfessionalStory {
	nextStories := make([]ProfessionalStory, 0, len(activityStories))
	for index, story := range activityStories {
		nextStories = append(nextStories, ProfessionalStory{
			CapturedAt: story.CapturedAt,
			Image:      story.Image,
			Index:      normalizeIndex(story.Index, index),
			Location:   story.Location,
			Note:       story.Note,
			Title:      story.Title,
		})
	}

	return nextStories
}

func toPortalPortfolioEntries(entries []portalPortfolioEntry) []ProfessionalPortfolioEntry {
	nextEntries := make([]ProfessionalPortfolioEntry, 0, len(entries))
	publicIndex := 1
	for _, entry := range entries {
		if entry.Visibility != "public" {
			continue
		}

		nextEntries = append(nextEntries, ProfessionalPortfolioEntry{
			ID:          entry.ID,
			Image:       entry.Image,
			Index:       publicIndex,
			Outcomes:    append([]string(nil), entry.Outcomes...),
			PeriodLabel: entry.PeriodLabel,
			ServiceID:   entry.ServiceID,
			Summary:     entry.Summary,
			Title:       entry.Title,
		})
		publicIndex += 1
	}

	return nextEntries
}

func toPortalGalleryItems(items []portalGalleryItem) []ProfessionalGalleryItem {
	sortedItems := append([]portalGalleryItem(nil), items...)
	sortPortalGalleryItems(sortedItems)

	nextItems := make([]ProfessionalGalleryItem, 0, len(sortedItems))
	for index, item := range sortedItems {
		nextItems = append(nextItems, ProfessionalGalleryItem{
			Alt:   item.Alt,
			ID:    item.ID,
			Image: item.Image,
			Index: index + 1,
			Label: item.Label,
		})
	}

	return nextItems
}

func toPortalProfessionalServices(services []portalManagedService, professionalID string) []ProfessionalService {
	sortedServices := append([]portalManagedService(nil), services...)
	sortPortalManagedServices(sortedServices)

	nextServices := make([]ProfessionalService, 0, len(sortedServices))
	serviceIndex := 1
	for _, service := range sortedServices {
		if !service.IsActive {
			continue
		}

		serviceID := strings.TrimSpace(service.ID)
		if serviceID == "" {
			serviceID = "professional-service-" + professionalID + "-" + service.ServiceID
		}

		nextServices = append(nextServices, ProfessionalService{
			BookingFlow:  service.BookingFlow,
			DefaultMode:  service.DefaultMode,
			Duration:     service.Duration,
			ID:           serviceID,
			Index:        serviceIndex,
			Price:        service.Price,
			ServiceID:    service.ServiceID,
			ServiceModes: service.ServiceModes,
			Summary:      service.Summary,
		})
		serviceIndex += 1
	}

	return nextServices
}

func primaryPortalCategoryID(
	services []ProfessionalService,
	servicesByID map[string]seedDataServiceRow,
	fallback string,
) string {
	for _, service := range services {
		serviceRow, ok := servicesByID[service.ServiceID]
		if ok {
			return serviceRow.CategoryID
		}
	}

	return fallback
}

func hasPortalPracticeLocation(state portalSnapshotState) bool {
	return strings.TrimSpace(state.PracticeAddress) != "" ||
		strings.TrimSpace(state.PracticeLabel) != "" ||
		len(state.CoverageAreaIDs) > 0 ||
		state.CoverageCenter.Latitude != 0 ||
		state.CoverageCenter.Longitude != 0
}

func toPortalAddressLines(state portalSnapshotState) []string {
	lines := make([]string, 0, 2)
	if label := strings.TrimSpace(state.PracticeLabel); label != "" {
		lines = append(lines, label)
	}

	if address := strings.TrimSpace(state.PracticeAddress); address != "" && address != firstString(lines) {
		lines = append(lines, address)
	}

	return lines
}

func fallbackPracticeAddress(professional Professional) string {
	if professional.PracticeLocation != nil {
		return professional.PracticeLocation.Address
	}

	return firstString(professional.AddressLines)
}

func fallbackPracticeAreaID(professional Professional) string {
	if professional.PracticeLocation != nil {
		return professional.PracticeLocation.AreaID
	}

	return firstString(professional.Coverage.AreaIDs)
}

func fallbackPracticeLabel(professional Professional) string {
	if professional.PracticeLocation != nil {
		return professional.PracticeLocation.Label
	}

	return professional.Location
}

func fallbackString(candidate string, fallback string) string {
	if strings.TrimSpace(candidate) != "" {
		return candidate
	}

	return fallback
}

func firstString(values []string) string {
	if len(values) == 0 {
		return ""
	}

	return values[0]
}

func buildPortalProfessionalSlug(displayName string, professionalID string) string {
	base := strings.ToLower(strings.TrimSpace(displayName))
	base = portalSlugSanitizer.ReplaceAllString(base, "-")
	base = strings.Trim(base, "-")
	if base == "" {
		base = strings.ToLower(strings.TrimSpace(professionalID))
		base = portalSlugSanitizer.ReplaceAllString(base, "-")
		base = strings.Trim(base, "-")
	}
	if base == "" {
		return "professional"
	}
	return base
}

func normalizeIndex(candidate int, fallbackIndex int) int {
	if candidate > 0 {
		return candidate
	}

	return fallbackIndex + 1
}

func sortPortalManagedServices(services []portalManagedService) {
	sort.SliceStable(services, func(leftIndex int, rightIndex int) bool {
		leftService := services[leftIndex]
		rightService := services[rightIndex]

		if leftService.Featured != rightService.Featured {
			return leftService.Featured
		}

		return normalizeIndex(leftService.Index, leftIndex) < normalizeIndex(rightService.Index, rightIndex)
	})
}

func sortPortalGalleryItems(items []portalGalleryItem) {
	sort.SliceStable(items, func(leftIndex int, rightIndex int) bool {
		leftItem := items[leftIndex]
		rightItem := items[rightIndex]

		if leftItem.IsFeatured != rightItem.IsFeatured {
			return leftItem.IsFeatured
		}

		return normalizeIndex(leftItem.Index, leftIndex) < normalizeIndex(rightItem.Index, rightIndex)
	})
}

func decodePortalSnapshotSection[T any](snapshot map[string]any, path ...string) (T, bool) {
	var zero T
	if len(snapshot) == 0 {
		return zero, false
	}

	current := any(snapshot)
	for _, segment := range path {
		nextContainer, ok := current.(map[string]any)
		if !ok {
			return zero, false
		}

		nextValue, exists := nextContainer[segment]
		if !exists {
			return zero, false
		}

		current = nextValue
	}

	bytes, err := json.Marshal(current)
	if err != nil {
		return zero, false
	}

	var decoded T
	if err := json.Unmarshal(bytes, &decoded); err != nil {
		return zero, false
	}

	return decoded, true
}
