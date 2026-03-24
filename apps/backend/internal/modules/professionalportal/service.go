package professionalportal

import (
	"context"
	"encoding/json"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"

	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/portalstore"
)

var ErrInvalidProfessionalID = errors.New("professional id is required")
var ErrInvalidSnapshot = errors.New("snapshot is required")
var ErrInvalidAppointmentRecord = errors.New("appointment record is required")

type Service struct {
	mu    sync.Mutex
	store portalstore.Store
}

type sessionStore struct {
	LastActiveProfessionalID string                   `json:"lastActiveProfessionalId,omitempty"`
	Sessions                 map[string]sessionRecord `json:"sessions,omitempty"`
}

type sessionRecord struct {
	ProfessionalID string         `json:"professionalId"`
	SavedAt        string         `json:"savedAt"`
	Snapshot       map[string]any `json:"snapshot"`
}

func NewService(store portalstore.Store) *Service {
	return &Service{store: store}
}

func (s *Service) Session(ctx context.Context, professionalID string) (ProfessionalPortalSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalSessionData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalSessionData{}, err
	}

	return store.toSessionData(professionalID), nil
}

func (s *Service) UpsertSession(ctx context.Context, input UpsertProfessionalPortalSessionRequest) (ProfessionalPortalSessionData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalSessionData{}, err
	}

	if len(input.Snapshot) == 0 {
		return ProfessionalPortalSessionData{}, ErrInvalidSnapshot
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		professionalID = deriveProfessionalID(input.Snapshot)
	}
	if professionalID == "" {
		return ProfessionalPortalSessionData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	savedAt := time.Now().UTC().Format(time.RFC3339)
	record := sessionRecord{
		ProfessionalID: professionalID,
		SavedAt:        savedAt,
		Snapshot:       cloneSnapshot(input.Snapshot),
	}

	store, err := s.writeStore(ctx, record, professionalID)
	if err != nil {
		return ProfessionalPortalSessionData{}, err
	}

	return store.toSessionData(professionalID), nil
}

func (s *Service) Profile(ctx context.Context, professionalID string) (ProfessionalPortalProfileData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return profileFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertProfile(ctx context.Context, input ProfessionalPortalProfileData) (ProfessionalPortalProfileData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalProfileData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyProfileToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	return profileFromRecord(professionalID, record), nil
}

func (s *Service) Coverage(ctx context.Context, professionalID string) (ProfessionalPortalCoverageData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return coverageFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertCoverage(ctx context.Context, input ProfessionalPortalCoverageData) (ProfessionalPortalCoverageData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalCoverageData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyCoverageToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

	return coverageFromRecord(professionalID, record), nil
}

func (s *Service) Services(ctx context.Context, professionalID string) (ProfessionalPortalServicesData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalServicesData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalServicesData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return servicesFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertServices(ctx context.Context, input ProfessionalPortalServicesData) (ProfessionalPortalServicesData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalServicesData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalServicesData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalServicesData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyServicesToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalServicesData{}, err
	}

	return servicesFromRecord(professionalID, record), nil
}

func (s *Service) Requests(ctx context.Context, professionalID string) (ProfessionalPortalRequestsData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return requestsFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertRequests(ctx context.Context, input ProfessionalPortalRequestsData) (ProfessionalPortalRequestsData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalRequestsData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyRequestsToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	return requestsFromRecord(professionalID, record), nil
}

func (s *Service) UpsertAppointmentRecord(
	ctx context.Context,
	professionalID string,
	record ProfessionalPortalManagedAppointmentRecord,
) (ProfessionalPortalRequestsData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	professionalID = strings.TrimSpace(professionalID)
	if professionalID == "" {
		return ProfessionalPortalRequestsData{}, ErrInvalidProfessionalID
	}
	if strings.TrimSpace(record.ID) == "" || strings.TrimSpace(record.ProfessionalID) != professionalID {
		return ProfessionalPortalRequestsData{}, ErrInvalidAppointmentRecord
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	session := store.Sessions[professionalID]
	requests := requestsFromRecord(professionalID, session)
	nextRecords := make([]ProfessionalPortalManagedAppointmentRecord, 0, len(requests.AppointmentRecords)+1)
	replaced := false
	for _, currentRecord := range requests.AppointmentRecords {
		if currentRecord.ID == record.ID {
			nextRecords = append(nextRecords, record)
			replaced = true
			continue
		}
		nextRecords = append(nextRecords, currentRecord)
	}
	if !replaced {
		nextRecords = append([]ProfessionalPortalManagedAppointmentRecord{record}, nextRecords...)
	}

	session = applyRecordMutation(session, professionalID, func(snapshot map[string]any) {
		applyRequestsToSnapshot(snapshot, ProfessionalPortalRequestsData{
			AppointmentRecords: nextRecords,
			ProfessionalID:     professionalID,
		})
	})
	if _, err := s.writeStore(ctx, session, professionalID); err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

	return requestsFromRecord(professionalID, session), nil
}

func (s *Service) Portfolio(ctx context.Context, professionalID string) (ProfessionalPortalPortfolioData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return portfolioFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertPortfolio(ctx context.Context, input ProfessionalPortalPortfolioData) (ProfessionalPortalPortfolioData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalPortfolioData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyPortfolioToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}

	return portfolioFromRecord(professionalID, record), nil
}

func (s *Service) Gallery(ctx context.Context, professionalID string) (ProfessionalPortalGalleryData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalGalleryData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalGalleryData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return galleryFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertGallery(ctx context.Context, input ProfessionalPortalGalleryData) (ProfessionalPortalGalleryData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalGalleryData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalGalleryData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalGalleryData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyGalleryToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalGalleryData{}, err
	}

	return galleryFromRecord(professionalID, record), nil
}

func (s *Service) Trust(ctx context.Context, professionalID string) (ProfessionalPortalTrustData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalTrustData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalTrustData{}, err
	}

	selectedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
	record := store.Sessions[selectedProfessionalID]

	return trustFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertTrust(ctx context.Context, input ProfessionalPortalTrustData) (ProfessionalPortalTrustData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalTrustData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalTrustData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalTrustData{}, err
	}

	record := store.Sessions[professionalID]
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyTrustToSnapshot(snapshot, input)
	})
	if _, err := s.writeStore(ctx, record, professionalID); err != nil {
		return ProfessionalPortalTrustData{}, err
	}

	return trustFromRecord(professionalID, record), nil
}

func (s *Service) readStore(ctx context.Context) (sessionStore, error) {
	if s.store == nil {
		return sessionStore{Sessions: make(map[string]sessionRecord)}, nil
	}

	state, err := s.store.Read(ctx)
	if err != nil {
		return sessionStore{}, err
	}

	store := sessionStore{
		LastActiveProfessionalID: state.LastActiveProfessionalID,
		Sessions:                 make(map[string]sessionRecord, len(state.Sessions)),
	}
	for professionalID, record := range state.Sessions {
		store.Sessions[professionalID] = sessionRecord{
			ProfessionalID: record.ProfessionalID,
			SavedAt:        record.SavedAt,
			Snapshot:       cloneSnapshot(record.Snapshot),
		}
	}

	if store.Sessions == nil {
		store.Sessions = make(map[string]sessionRecord)
	}

	return store, nil
}

func (s *Service) writeStore(ctx context.Context, record sessionRecord, lastActiveProfessionalID string) (sessionStore, error) {
	if s.store == nil {
		return sessionStore{}, errors.New("professional portal store is not configured")
	}

	state, err := s.store.Upsert(ctx, portalstore.Record{
		ProfessionalID: record.ProfessionalID,
		SavedAt:        record.SavedAt,
		Snapshot:       cloneSnapshot(record.Snapshot),
	}, lastActiveProfessionalID)
	if err != nil {
		return sessionStore{}, err
	}

	store := sessionStore{
		LastActiveProfessionalID: state.LastActiveProfessionalID,
		Sessions:                 make(map[string]sessionRecord, len(state.Sessions)),
	}
	for professionalID, nextRecord := range state.Sessions {
		store.Sessions[professionalID] = sessionRecord{
			ProfessionalID: nextRecord.ProfessionalID,
			SavedAt:        nextRecord.SavedAt,
			Snapshot:       cloneSnapshot(nextRecord.Snapshot),
		}
	}

	if store.Sessions == nil {
		store.Sessions = make(map[string]sessionRecord)
	}

	return store, nil
}

func (s sessionStore) toSessionData(requestedProfessionalID string) ProfessionalPortalSessionData {
	selectedProfessionalID := strings.TrimSpace(requestedProfessionalID)
	if selectedProfessionalID == "" {
		selectedProfessionalID = s.LastActiveProfessionalID
	}

	availableProfessionalIDs := make([]string, 0, len(s.Sessions))
	for professionalID := range s.Sessions {
		availableProfessionalIDs = append(availableProfessionalIDs, professionalID)
	}
	sort.Strings(availableProfessionalIDs)

	data := ProfessionalPortalSessionData{
		AvailableProfessionalIDs: availableProfessionalIDs,
		LastActiveProfessionalID: s.LastActiveProfessionalID,
		ProfessionalID:           selectedProfessionalID,
	}

	record, ok := s.Sessions[selectedProfessionalID]
	if !ok {
		return data
	}

	data.HasSnapshot = true
	data.ProfessionalID = record.ProfessionalID
	data.SavedAt = record.SavedAt
	data.Snapshot = cloneSnapshot(record.Snapshot)
	return data
}

func resolveProfessionalID(candidate string, fallback string) string {
	selectedProfessionalID := strings.TrimSpace(candidate)
	if selectedProfessionalID != "" {
		return selectedProfessionalID
	}

	return strings.TrimSpace(fallback)
}

func applyRecordMutation(record sessionRecord, professionalID string, mutate func(snapshot map[string]any)) sessionRecord {
	snapshot := ensureSnapshot(record.Snapshot)
	mutate(snapshot)

	record.ProfessionalID = professionalID
	record.SavedAt = time.Now().UTC().Format(time.RFC3339)
	record.Snapshot = snapshot

	return record
}

func profileFromRecord(professionalID string, record sessionRecord) ProfessionalPortalProfileData {
	data := ProfessionalPortalProfileData{
		ProfessionalID: professionalID,
		ReviewState:    defaultReviewState(),
	}

	if state, ok := decodeSnapshotSection[ProfessionalPortalProfileData](record.Snapshot, "state"); ok {
		data.AcceptingNewClients = state.AcceptingNewClients
		data.AutoApproveInstantBookings = state.AutoApproveInstantBookings
		data.City = state.City
		data.CredentialNumber = state.CredentialNumber
		data.DisplayName = state.DisplayName
		data.Phone = state.Phone
		data.PublicBio = state.PublicBio
		data.ResponseTimeGoal = state.ResponseTimeGoal
		data.YearsExperience = state.YearsExperience
	}

	if reviewStates, ok := decodeSnapshotSection[map[string]ProfessionalPortalReviewState](record.Snapshot, "reviewStatesByProfessionalId"); ok {
		if reviewState, exists := reviewStates[professionalID]; exists {
			data.ReviewState = reviewState
		}
	}

	return data
}

func coverageFromRecord(professionalID string, record sessionRecord) ProfessionalPortalCoverageData {
	data := ProfessionalPortalCoverageData{
		AvailabilityRulesByMode: map[string]readmodel.ProfessionalAvailabilityRules{},
		CoverageAreaIDs:         []string{},
		ProfessionalID:          professionalID,
	}

	if state, ok := decodeSnapshotSection[ProfessionalPortalCoverageData](record.Snapshot, "state"); ok {
		data.AcceptingNewClients = state.AcceptingNewClients
		data.AutoApproveInstantBookings = state.AutoApproveInstantBookings
		data.AvailabilityRulesByMode = state.AvailabilityRulesByMode
		data.City = state.City
		data.CoverageAreaIDs = state.CoverageAreaIDs
		data.CoverageCenter = state.CoverageCenter
		data.HomeVisitRadiusKm = state.HomeVisitRadiusKm
		data.PracticeAddress = state.PracticeAddress
		data.PracticeLabel = state.PracticeLabel
		data.PublicBio = state.PublicBio
		data.ResponseTimeGoal = state.ResponseTimeGoal
	}

	if data.AvailabilityRulesByMode == nil {
		data.AvailabilityRulesByMode = map[string]readmodel.ProfessionalAvailabilityRules{}
	}
	if data.CoverageAreaIDs == nil {
		data.CoverageAreaIDs = []string{}
	}

	return data
}

func servicesFromRecord(professionalID string, record sessionRecord) ProfessionalPortalServicesData {
	data := ProfessionalPortalServicesData{
		ProfessionalID:        professionalID,
		ServiceConfigurations: []ProfessionalPortalManagedService{},
	}

	if serviceConfigurations, ok := decodeSnapshotSection[[]ProfessionalPortalManagedService](record.Snapshot, "state", "serviceConfigurations"); ok {
		data.ServiceConfigurations = serviceConfigurations
	}
	if data.ServiceConfigurations == nil {
		data.ServiceConfigurations = []ProfessionalPortalManagedService{}
	}

	return data
}

func requestsFromRecord(professionalID string, record sessionRecord) ProfessionalPortalRequestsData {
	data := ProfessionalPortalRequestsData{
		AppointmentRecords: []ProfessionalPortalManagedAppointmentRecord{},
		ProfessionalID:     professionalID,
	}

	if appointmentRecordsByProfessionalID, ok := decodeSnapshotSection[map[string][]ProfessionalPortalManagedAppointmentRecord](record.Snapshot, "appointmentRecordsByProfessionalId"); ok {
		data.AppointmentRecords = appointmentRecordsByProfessionalID[professionalID]
	}
	if data.AppointmentRecords == nil {
		data.AppointmentRecords = []ProfessionalPortalManagedAppointmentRecord{}
	}

	return data
}

func portfolioFromRecord(professionalID string, record sessionRecord) ProfessionalPortalPortfolioData {
	data := ProfessionalPortalPortfolioData{
		PortfolioEntries: []ProfessionalPortalPortfolioEntry{},
		ProfessionalID:   professionalID,
	}

	if portfolioEntries, ok := decodeSnapshotSection[[]ProfessionalPortalPortfolioEntry](record.Snapshot, "state", "portfolioEntries"); ok {
		data.PortfolioEntries = portfolioEntries
	}
	if data.PortfolioEntries == nil {
		data.PortfolioEntries = []ProfessionalPortalPortfolioEntry{}
	}

	return data
}

func galleryFromRecord(professionalID string, record sessionRecord) ProfessionalPortalGalleryData {
	data := ProfessionalPortalGalleryData{
		GalleryItems:   []ProfessionalPortalGalleryItem{},
		ProfessionalID: professionalID,
	}

	if galleryItems, ok := decodeSnapshotSection[[]ProfessionalPortalGalleryItem](record.Snapshot, "state", "galleryItems"); ok {
		data.GalleryItems = galleryItems
	}
	if data.GalleryItems == nil {
		data.GalleryItems = []ProfessionalPortalGalleryItem{}
	}

	return data
}

func trustFromRecord(professionalID string, record sessionRecord) ProfessionalPortalTrustData {
	data := ProfessionalPortalTrustData{
		ActivityStories: []ProfessionalPortalActivityStory{},
		Credentials:     []ProfessionalPortalCredential{},
		ProfessionalID:  professionalID,
	}

	if credentials, ok := decodeSnapshotSection[[]ProfessionalPortalCredential](record.Snapshot, "state", "credentials"); ok {
		data.Credentials = credentials
	}
	if data.Credentials == nil {
		data.Credentials = []ProfessionalPortalCredential{}
	}

	if activityStories, ok := decodeSnapshotSection[[]ProfessionalPortalActivityStory](record.Snapshot, "state", "activityStories"); ok {
		data.ActivityStories = activityStories
	}
	if data.ActivityStories == nil {
		data.ActivityStories = []ProfessionalPortalActivityStory{}
	}

	return data
}

func applyProfileToSnapshot(snapshot map[string]any, input ProfessionalPortalProfileData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	state["acceptingNewClients"] = input.AcceptingNewClients
	state["autoApproveInstantBookings"] = input.AutoApproveInstantBookings
	state["city"] = input.City
	state["credentialNumber"] = input.CredentialNumber
	state["displayName"] = input.DisplayName
	state["phone"] = input.Phone
	state["publicBio"] = input.PublicBio
	state["responseTimeGoal"] = input.ResponseTimeGoal
	state["yearsExperience"] = input.YearsExperience

	reviewStatesByProfessionalID := ensureMap(snapshot, "reviewStatesByProfessionalId")
	reviewStatesByProfessionalID[input.ProfessionalID] = input.ReviewState
}

func applyCoverageToSnapshot(snapshot map[string]any, input ProfessionalPortalCoverageData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	state["acceptingNewClients"] = input.AcceptingNewClients
	state["autoApproveInstantBookings"] = input.AutoApproveInstantBookings
	state["availabilityRulesByMode"] = input.AvailabilityRulesByMode
	state["city"] = input.City
	state["coverageAreaIds"] = input.CoverageAreaIDs
	state["coverageCenter"] = input.CoverageCenter
	state["homeVisitRadiusKm"] = input.HomeVisitRadiusKm
	state["practiceAddress"] = input.PracticeAddress
	state["practiceLabel"] = input.PracticeLabel
	state["publicBio"] = input.PublicBio
	state["responseTimeGoal"] = input.ResponseTimeGoal
}

func applyServicesToSnapshot(snapshot map[string]any, input ProfessionalPortalServicesData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	state["serviceConfigurations"] = input.ServiceConfigurations
}

func applyRequestsToSnapshot(snapshot map[string]any, input ProfessionalPortalRequestsData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID

	appointmentRecordsByProfessionalID := ensureMap(snapshot, "appointmentRecordsByProfessionalId")
	appointmentRecordsByProfessionalID[input.ProfessionalID] = input.AppointmentRecords
}

func applyPortfolioToSnapshot(snapshot map[string]any, input ProfessionalPortalPortfolioData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	state["portfolioEntries"] = input.PortfolioEntries
}

func applyGalleryToSnapshot(snapshot map[string]any, input ProfessionalPortalGalleryData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	state["galleryItems"] = input.GalleryItems
}

func applyTrustToSnapshot(snapshot map[string]any, input ProfessionalPortalTrustData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	state["credentials"] = input.Credentials
	state["activityStories"] = input.ActivityStories
}

func ensureSnapshot(snapshot map[string]any) map[string]any {
	if snapshot == nil {
		return map[string]any{}
	}

	return snapshot
}

func ensureMap(container map[string]any, key string) map[string]any {
	existing, ok := container[key].(map[string]any)
	if ok {
		return existing
	}

	next := map[string]any{}
	container[key] = next
	return next
}

func decodeSnapshotSection[T any](snapshot map[string]any, path ...string) (T, bool) {
	var zero T
	if len(snapshot) == 0 {
		return zero, false
	}

	var current any = snapshot
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

func defaultReviewState() ProfessionalPortalReviewState {
	return ProfessionalPortalReviewState{Status: "published"}
}

func deriveProfessionalID(snapshot map[string]any) string {
	stateValue, ok := snapshot["state"].(map[string]any)
	if !ok {
		return ""
	}

	activeProfessionalID, _ := stateValue["activeProfessionalId"].(string)
	return strings.TrimSpace(activeProfessionalID)
}

func cloneSnapshot(snapshot map[string]any) map[string]any {
	if len(snapshot) == 0 {
		return map[string]any{}
	}

	bytes, err := json.Marshal(snapshot)
	if err != nil {
		return snapshot
	}

	var cloned map[string]any
	if err := json.Unmarshal(bytes, &cloned); err != nil {
		return snapshot
	}

	return cloned
}
