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
var ErrInvalidReviewTransition = errors.New("review state transition is not allowed")
var ErrProfileNotReadyForReview = errors.New("professional profile is not ready for review")

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

type reviewSubmissionState struct {
	AvailabilityRulesByMode map[string]readmodel.ProfessionalAvailabilityRules `json:"availabilityRulesByMode,omitempty"`
	City                    string                                             `json:"city"`
	CoverageAreaIDs         []string                                           `json:"coverageAreaIds"`
	CredentialNumber        string                                             `json:"credentialNumber"`
	DisplayName             string                                             `json:"displayName"`
	HomeVisitRadiusKm       int                                                `json:"homeVisitRadiusKm"`
	Phone                   string                                             `json:"phone"`
	PortfolioEntries        []ProfessionalPortalPortfolioEntry                 `json:"portfolioEntries"`
	PracticeAddress         string                                             `json:"practiceAddress"`
	PracticeLabel           string                                             `json:"practiceLabel"`
	PublicBio               string                                             `json:"publicBio"`
	ResponseTimeGoal        string                                             `json:"responseTimeGoal"`
	ServiceConfigurations   []ProfessionalPortalManagedService                 `json:"serviceConfigurations"`
	YearsExperience         string                                             `json:"yearsExperience"`
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

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	return profileFromRecord(selectedProfessionalID, record), nil
}

func (s *Service) UpsertProfile(ctx context.Context, input UpsertProfessionalPortalProfileData) (ProfessionalPortalProfileData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalProfileData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalProfileData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyProfileToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	return profileFromRecord(professionalID, record), nil
}

func (s *Service) SubmitProfileForReview(ctx context.Context, professionalID string) (ProfessionalPortalProfileData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	professionalID = strings.TrimSpace(professionalID)
	if professionalID == "" {
		return ProfessionalPortalProfileData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	currentProfile := profileFromRecord(professionalID, record)
	if !canProfessionalSubmitForReview(currentProfile.ReviewState.Status) {
		return ProfessionalPortalProfileData{}, ErrInvalidReviewTransition
	}
	if !isProfileReadyForReview(record.Snapshot) {
		return ProfessionalPortalProfileData{}, ErrProfileNotReadyForReview
	}

	submittedAt := time.Now().UTC().Format(time.RFC3339)
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyProfessionalReviewSubmissionToSnapshot(snapshot, professionalID, ProfessionalPortalReviewState{
			Status:      "submitted",
			SubmittedAt: submittedAt,
		})
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	return profileFromRecord(professionalID, record), nil
}

func (s *Service) UpsertAdminReviewState(
	ctx context.Context,
	input ProfessionalPortalAdminReviewStateData,
) (ProfessionalPortalProfileData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	professionalID := strings.TrimSpace(input.ProfessionalID)
	if professionalID == "" {
		return ProfessionalPortalProfileData{}, ErrInvalidProfessionalID
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalProfileData{}, err
	}
	currentReviewState := profileFromRecord(professionalID, record).ReviewState
	if err := validateAdminReviewTransition(currentReviewState.Status, input.ReviewState.Status); err != nil {
		return ProfessionalPortalProfileData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyAdminReviewStateToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
		return ProfessionalPortalProfileData{}, err
	}

	return profileFromRecord(professionalID, record), nil
}

func (s *Service) AdminReviewStates(ctx context.Context) (ProfessionalPortalAdminReviewStatesData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalAdminReviewStatesData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	store, err := s.readStore(ctx)
	if err != nil {
		return ProfessionalPortalAdminReviewStatesData{}, err
	}

	profilesByProfessionalID := make(map[string]ProfessionalPortalProfileData, len(store.Sessions))
	reviewStatesByProfessionalID := make(map[string]ProfessionalPortalReviewState, len(store.Sessions))
	for professionalID, record := range store.Sessions {
		profile := profileFromRecord(professionalID, record)
		profilesByProfessionalID[professionalID] = profile
		reviewStatesByProfessionalID[professionalID] = profile.ReviewState
	}

	return ProfessionalPortalAdminReviewStatesData{
		ProfilesByProfessionalID:     profilesByProfessionalID,
		ReviewStatesByProfessionalID: reviewStatesByProfessionalID,
	}, nil
}

func (s *Service) Coverage(ctx context.Context, professionalID string) (ProfessionalPortalCoverageData, error) {
	if err := ctx.Err(); err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalCoverageData{}, err
	}

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

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalCoverageData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyCoverageToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
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

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalServicesData{}, err
	}

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

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalServicesData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyServicesToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
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

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalRequestsData{}, err
	}

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

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalRequestsData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyRequestsToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
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

	session, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalRequestsData{}, err
	}
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
	if err := s.persistRecord(ctx, session, professionalID); err != nil {
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

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}

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

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalPortfolioData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyPortfolioToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
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

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalGalleryData{}, err
	}

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

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalGalleryData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyGalleryToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
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

	selectedProfessionalID, record, err := s.readResolvedRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalTrustData{}, err
	}

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

	record, err := s.readRecord(ctx, professionalID)
	if err != nil {
		return ProfessionalPortalTrustData{}, err
	}
	record = applyRecordMutation(record, professionalID, func(snapshot map[string]any) {
		applyTrustToSnapshot(snapshot, input)
	})
	if err := s.persistRecord(ctx, record, professionalID); err != nil {
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

func (s *Service) readResolvedRecord(ctx context.Context, professionalID string) (string, sessionRecord, error) {
	if s.store == nil {
		return resolveProfessionalID(professionalID, ""), sessionRecord{}, nil
	}

	recordReader, ok := s.store.(portalstore.RecordReader)
	if !ok {
		store, err := s.readStore(ctx)
		if err != nil {
			return "", sessionRecord{}, err
		}
		resolvedProfessionalID := resolveProfessionalID(professionalID, store.LastActiveProfessionalID)
		return resolvedProfessionalID, store.Sessions[resolvedProfessionalID], nil
	}

	lastActiveProfessionalID := ""
	if lastActiveReader, ok := s.store.(portalstore.LastActiveReader); ok {
		value, err := lastActiveReader.ReadLastActiveProfessionalID(ctx)
		if err != nil {
			return "", sessionRecord{}, err
		}
		lastActiveProfessionalID = value
	}
	resolvedProfessionalID := resolveProfessionalID(professionalID, lastActiveProfessionalID)
	if resolvedProfessionalID == "" {
		return "", sessionRecord{}, nil
	}

	record, err := recordReader.ReadRecord(ctx, resolvedProfessionalID)
	if err != nil {
		if errors.Is(err, portalstore.ErrNotFound) {
			return resolvedProfessionalID, sessionRecord{}, nil
		}
		return "", sessionRecord{}, err
	}

	return resolvedProfessionalID, sessionRecord{
		ProfessionalID: record.ProfessionalID,
		SavedAt:        record.SavedAt,
		Snapshot:       cloneSnapshot(record.Snapshot),
	}, nil
}

func (s *Service) readRecord(ctx context.Context, professionalID string) (sessionRecord, error) {
	if s.store == nil {
		return sessionRecord{}, nil
	}

	if recordReader, ok := s.store.(portalstore.RecordReader); ok {
		record, err := recordReader.ReadRecord(ctx, professionalID)
		if err != nil {
			if errors.Is(err, portalstore.ErrNotFound) {
				return sessionRecord{}, nil
			}
			return sessionRecord{}, err
		}
		return sessionRecord{
			ProfessionalID: record.ProfessionalID,
			SavedAt:        record.SavedAt,
			Snapshot:       cloneSnapshot(record.Snapshot),
		}, nil
	}

	store, err := s.readStore(ctx)
	if err != nil {
		return sessionRecord{}, err
	}
	return store.Sessions[professionalID], nil
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

func (s *Service) persistRecord(ctx context.Context, record sessionRecord, lastActiveProfessionalID string) error {
	if s.store == nil {
		return errors.New("professional portal store is not configured")
	}

	if recordWriter, ok := s.store.(portalstore.RecordWriter); ok {
		_, err := recordWriter.UpsertRecord(ctx, portalstore.Record{
			ProfessionalID: record.ProfessionalID,
			SavedAt:        record.SavedAt,
			Snapshot:       cloneSnapshot(record.Snapshot),
		}, lastActiveProfessionalID)
		return err
	}

	_, err := s.store.Upsert(ctx, portalstore.Record{
		ProfessionalID: record.ProfessionalID,
		SavedAt:        record.SavedAt,
		Snapshot:       cloneSnapshot(record.Snapshot),
	}, lastActiveProfessionalID)
	return err
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

func applyProfileToSnapshot(snapshot map[string]any, input UpsertProfessionalPortalProfileData) {
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
}

func applyProfessionalReviewSubmissionToSnapshot(
	snapshot map[string]any,
	professionalID string,
	reviewState ProfessionalPortalReviewState,
) {
	reviewStatesByProfessionalID := ensureMap(snapshot, "reviewStatesByProfessionalId")
	reviewStatesByProfessionalID[professionalID] = reviewState
}

func applyAdminReviewStateToSnapshot(snapshot map[string]any, input ProfessionalPortalAdminReviewStateData) {
	state := ensureMap(snapshot, "state")
	state["activeProfessionalId"] = input.ProfessionalID
	if input.AcceptingNewClients != nil {
		state["acceptingNewClients"] = *input.AcceptingNewClients
	}

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

func hasText(value string) bool {
	return strings.TrimSpace(value) != ""
}

func canProfessionalSubmitForReview(status string) bool {
	switch strings.TrimSpace(status) {
	case "", "changes_requested", "draft", "ready_for_review":
		return true
	default:
		return false
	}
}

func validateAdminReviewTransition(currentStatus string, nextStatus string) error {
	currentStatus = strings.TrimSpace(currentStatus)
	nextStatus = strings.TrimSpace(nextStatus)

	if currentStatus == nextStatus {
		switch nextStatus {
		case "submitted", "changes_requested", "published", "verified":
			return nil
		}
	}

	switch nextStatus {
	case "changes_requested", "verified":
		if currentStatus != "submitted" {
			return ErrInvalidReviewTransition
		}
	case "published":
		if currentStatus != "verified" {
			return ErrInvalidReviewTransition
		}
	default:
		return ErrInvalidReviewTransition
	}

	return nil
}

func isProfileReadyForReview(snapshot map[string]any) bool {
	state, ok := decodeSnapshotSection[reviewSubmissionState](snapshot, "state")
	if !ok {
		return false
	}

	if !hasText(state.DisplayName) ||
		!hasText(state.Phone) ||
		!hasText(state.City) ||
		!hasText(state.CredentialNumber) ||
		!hasText(state.YearsExperience) ||
		!hasText(state.PublicBio) ||
		!hasText(state.PracticeLabel) ||
		!hasText(state.PracticeAddress) ||
		!hasText(state.ResponseTimeGoal) ||
		len(state.CoverageAreaIDs) == 0 {
		return false
	}

	if !hasConfiguredActiveService(state.ServiceConfigurations) {
		return false
	}

	activeModes := activeServiceModes(state.ServiceConfigurations)
	if len(activeModes) == 0 {
		return false
	}

	if !hasFeaturedActiveService(state.ServiceConfigurations) {
		return false
	}

	if containsString(activeModes, "home_visit") && state.HomeVisitRadiusKm <= 0 {
		return false
	}

	if requiresOfflineAvailability(activeModes) &&
		!hasOfflineAvailabilityConfigured(state.AvailabilityRulesByMode, activeModes) {
		return false
	}

	publicPortfolioCount := 0
	for _, entry := range state.PortfolioEntries {
		if entry.Visibility == "public" {
			publicPortfolioCount += 1
		}
	}

	return publicPortfolioCount > 0
}

func hasConfiguredActiveService(serviceConfigurations []ProfessionalPortalManagedService) bool {
	for _, service := range serviceConfigurations {
		if service.IsActive && hasText(service.Summary) && hasText(service.Price) && hasText(service.Duration) {
			return true
		}
	}
	return false
}

func hasFeaturedActiveService(serviceConfigurations []ProfessionalPortalManagedService) bool {
	for _, service := range serviceConfigurations {
		if service.IsActive && service.Featured {
			return true
		}
	}
	return false
}

func activeServiceModes(serviceConfigurations []ProfessionalPortalManagedService) []string {
	seen := map[string]struct{}{}
	modes := make([]string, 0, 3)
	for _, service := range serviceConfigurations {
		if !service.IsActive {
			continue
		}

		if service.ServiceModes.Online {
			if _, ok := seen["online"]; !ok {
				seen["online"] = struct{}{}
				modes = append(modes, "online")
			}
		}
		if service.ServiceModes.HomeVisit {
			if _, ok := seen["home_visit"]; !ok {
				seen["home_visit"] = struct{}{}
				modes = append(modes, "home_visit")
			}
		}
		if service.ServiceModes.Onsite {
			if _, ok := seen["onsite"]; !ok {
				seen["onsite"] = struct{}{}
				modes = append(modes, "onsite")
			}
		}
	}
	return modes
}

func requiresOfflineAvailability(activeModes []string) bool {
	for _, mode := range activeModes {
		if mode == "home_visit" || mode == "onsite" {
			return true
		}
	}
	return false
}

func hasOfflineAvailabilityConfigured(
	availabilityRulesByMode map[string]readmodel.ProfessionalAvailabilityRules,
	activeModes []string,
) bool {
	for _, mode := range activeModes {
		if mode != "home_visit" && mode != "onsite" {
			continue
		}

		rules := availabilityRulesByMode[mode]
		hasEnabledWindow := false
		for _, window := range rules.WeeklyHours {
			if window.IsEnabled {
				hasEnabledWindow = true
				break
			}
		}
		if !hasEnabledWindow {
			return false
		}
	}

	return true
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func defaultReviewState() ProfessionalPortalReviewState {
	return ProfessionalPortalReviewState{Status: "draft"}
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
