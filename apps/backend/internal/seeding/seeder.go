package seeding

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/clientstate"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/modules/professionalportal"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/appointmentstore"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/documentstore"
	"bidanapp/apps/backend/internal/platform/portalstore"
	"bidanapp/apps/backend/internal/platform/pushstore"
)

const (
	scenarioComprehensive            = "comprehensive"
	defaultCustomerPassword          = "Customer2026A"
	defaultProfessionalPassword      = "Professional2026A"
	defaultSeededAdminRoute          = "/admin/support"
	defaultSupportDeskSchemaVersion  = 1
	defaultAdminConsoleSchemaVersion = 1
)

var seededReferenceTime = time.Date(2026, time.March, 23, 9, 0, 0, 0, time.FixedZone("WIB", 7*60*60))

type Options struct {
	CustomerPassword     string
	ProfessionalPassword string
	Reset                bool
	Scenario             string
}

type AccountLogin struct {
	City           string `json:"city"`
	DisplayName    string `json:"displayName"`
	ID             string `json:"id"`
	Password       string `json:"password"`
	Phone          string `json:"phone"`
	ProfessionalID string `json:"professionalId,omitempty"`
}

type AdminAccess struct {
	AdminID   string `json:"adminId"`
	Email     string `json:"email"`
	FocusArea string `json:"focusArea"`
}

type BearerToken struct {
	Description string `json:"description"`
	Role        string `json:"role"`
	Token       string `json:"token"`
}

type CustomerScenario struct {
	AppointmentStatuses   []string `json:"appointmentStatuses"`
	City                  string   `json:"city"`
	ConsumerID            string   `json:"consumerId"`
	DisplayName           string   `json:"displayName"`
	Phone                 string   `json:"phone"`
	ReadNotificationCount int      `json:"readNotificationCount"`
	SuggestedChecks       []string `json:"suggestedChecks"`
}

type ProfessionalScenario struct {
	AppointmentStatuses []string `json:"appointmentStatuses"`
	City                string   `json:"city"`
	CoverageReady       bool     `json:"coverageReady"`
	DisplayName         string   `json:"displayName"`
	HasFeaturedService  bool     `json:"hasFeaturedService"`
	Phone               string   `json:"phone"`
	ProfessionalID      string   `json:"professionalId"`
	ReviewStatus        string   `json:"reviewStatus"`
	ServicesReady       bool     `json:"servicesReady"`
	SuggestedChecks     []string `json:"suggestedChecks"`
}

type AdminScenario struct {
	AdminID         string   `json:"adminId"`
	Email           string   `json:"email"`
	FocusArea       string   `json:"focusArea"`
	SuggestedChecks []string `json:"suggestedChecks"`
}

type Summary struct {
	AdminAccesses                      []AdminAccess          `json:"adminAccesses"`
	AdminConsoleTableCount             int                    `json:"adminConsoleTableCount"`
	AdminScenarios                     []AdminScenario        `json:"adminScenarios"`
	AppointmentStatusCounts            map[string]int         `json:"appointmentStatusCounts"`
	BearerTokens                       []BearerToken          `json:"bearerTokens"`
	ChatMessageCount                   int                    `json:"chatMessageCount"`
	ChatThreadCount                    int                    `json:"chatThreadCount"`
	CoveredCities                      []string               `json:"coveredCities"`
	ManualQACases                      []ManualQACase         `json:"manualQaCases"`
	PublishedReadModelDocumentCount    int                    `json:"publishedReadModelDocumentCount"`
	CustomerAccounts                   []AccountLogin         `json:"customerAccounts"`
	CustomerNotificationStateCount     int                    `json:"customerNotificationStateCount"`
	CustomerPassword                   string                 `json:"customerPassword"`
	CustomerPreferenceCount            int                    `json:"customerPreferenceCount"`
	CustomerScenarios                  []CustomerScenario     `json:"customerScenarios"`
	PortalReviewStatusCounts           map[string]int         `json:"portalReviewStatusCounts"`
	PortalStateCount                   int                    `json:"portalStateCount"`
	ProfessionalAccounts               []AccountLogin         `json:"professionalAccounts"`
	ProfessionalNotificationStateCount int                    `json:"professionalNotificationStateCount"`
	ProfessionalPassword               string                 `json:"professionalPassword"`
	ProfessionalScenarios              []ProfessionalScenario `json:"professionalScenarios"`
	SampleEntityRefs                   []SampleEntityRef      `json:"sampleEntityRefs"`
	Scenario                           string                 `json:"scenario"`
	SupportedAppointmentModes          []string               `json:"supportedAppointmentModes"`
	SupportedBookingFlows              []string               `json:"supportedBookingFlows"`
	SupportedServiceModes              []string               `json:"supportedServiceModes"`
	SupportTicketCount                 int                    `json:"supportTicketCount"`
}

type seeder struct {
	adminAuth        *adminauth.Service
	appointments     []readmodel.AppointmentSeed
	appointmentStore appointmentstore.Store
	cfg              config.Config
	contentStore     contentstore.Store
	customerAuth     *customerauth.Service
	dataset          dataset
	db               *sql.DB
	documentStore    documentstore.Store
	opts             Options
	portalService    *professionalportal.Service
	portalStore      portalstore.Store
	pushStore        pushstore.Store
	profAuth         *professionalauth.Service
	summary          Summary
}

func Run(ctx context.Context, cfg config.Config, db *sql.DB, writer io.Writer, options Options) (Summary, error) {
	appliedOptions := normalizeOptions(options)

	dataset, err := loadDataset(ctx, cfg.SeedData.DataDir)
	if err != nil {
		return Summary{}, err
	}

	instance := &seeder{
		appointments:     buildSeedAppointments(dataset),
		appointmentStore: appointmentstore.NewPostgresStore(db),
		cfg:              cfg,
		contentStore:     contentstore.NewPostgresStore(db),
		dataset:          dataset,
		db:               db,
		documentStore:    documentstore.NewPostgresStore(db),
		opts:             appliedOptions,
		portalStore:      portalstore.NewPostgresStore(db),
		pushStore:        pushstore.NewPostgresStore(db),
		summary: Summary{
			AdminAccesses:             []AdminAccess{},
			AdminScenarios:            []AdminScenario{},
			AppointmentStatusCounts:   map[string]int{},
			BearerTokens:              []BearerToken{},
			CoveredCities:             []string{},
			CustomerAccounts:          []AccountLogin{},
			CustomerPassword:          appliedOptions.CustomerPassword,
			CustomerScenarios:         []CustomerScenario{},
			ManualQACases:             []ManualQACase{},
			PortalReviewStatusCounts:  map[string]int{},
			ProfessionalAccounts:      []AccountLogin{},
			ProfessionalPassword:      appliedOptions.ProfessionalPassword,
			ProfessionalScenarios:     []ProfessionalScenario{},
			SampleEntityRefs:          []SampleEntityRef{},
			Scenario:                  datasetScenarioName(appliedOptions.Scenario),
			SupportedAppointmentModes: []string{},
			SupportedBookingFlows:     []string{},
			SupportedServiceModes:     []string{},
		},
	}
	instance.portalService = professionalportal.NewService(instance.portalStore)
	authStore := authstore.NewPostgresStore(db)
	readModelService := readmodel.NewServiceWithStore(
		cfg.SeedData.DataDir,
		instance.contentStore,
		instance.portalStore,
		instance.appointmentStore,
	)
	instance.adminAuth = adminauth.NewService(cfg.AdminAuth, authStore)
	instance.customerAuth = customerauth.NewService(cfg.CustomerAuth, authStore)
	instance.profAuth = professionalauth.NewService(cfg.ProfessionalAuth, readModelService, authStore)

	if err := instance.run(ctx); err != nil {
		return Summary{}, err
	}

	if writer != nil {
		if err := instance.summary.WriteReport(writer); err != nil {
			return Summary{}, err
		}
	}

	return instance.summary, nil
}

func normalizeOptions(options Options) Options {
	if strings.TrimSpace(options.CustomerPassword) == "" {
		options.CustomerPassword = defaultCustomerPassword
	}
	if strings.TrimSpace(options.ProfessionalPassword) == "" {
		options.ProfessionalPassword = defaultProfessionalPassword
	}
	if strings.TrimSpace(options.Scenario) == "" {
		options.Scenario = scenarioComprehensive
	}
	return options
}

func (s *seeder) run(ctx context.Context) error {
	if datasetScenarioName(s.opts.Scenario) != scenarioComprehensive {
		return fmt.Errorf("unsupported seed scenario %q", s.opts.Scenario)
	}

	if s.opts.Reset {
		if err := resetMutableState(ctx, s.db); err != nil {
			return err
		}
	}

	if err := s.bootstrapPublishedReadModelDocuments(ctx); err != nil {
		return err
	}

	if err := s.seedChatRuntime(ctx); err != nil {
		return err
	}

	if err := s.seedCustomerAuthRegistry(ctx); err != nil {
		return err
	}

	if err := s.seedProfessionalAuthRegistry(ctx); err != nil {
		return err
	}

	if err := s.seedAdminAccessTokens(ctx); err != nil {
		return err
	}

	if err := s.seedCustomerAccessToken(ctx); err != nil {
		return err
	}

	if err := s.seedProfessionalAccessToken(ctx); err != nil {
		return err
	}

	if err := s.seedAppointments(ctx); err != nil {
		return err
	}

	if err := s.seedProfessionalPortal(ctx); err != nil {
		return err
	}

	if err := s.seedClientState(ctx); err != nil {
		return err
	}

	s.buildVerificationScenarios()

	return nil
}

func resetMutableState(ctx context.Context, db *sql.DB) error {
	if db == nil {
		return fmt.Errorf("seed runtime requires a database connection")
	}

	_, err := db.ExecContext(ctx, `
		TRUNCATE TABLE
			chat_messages,
			chat_threads,
			auth_sessions,
			admin_auth_accounts,
			professional_auth_accounts,
			customer_auth_accounts,
			auth_users,
			admin_console_table_rows,
			admin_console_tables,
			admin_console_states,
			support_tickets,
			admin_support_desk_states,
			admin_session_states,
			consumer_preference_states,
			professional_notification_states,
			customer_notification_states,
			customer_push_subscriptions,
			payout_batches,
			professional_earnings_ledger,
			refund_events,
			refund_requests,
			payment_events,
			payment_requests,
			appointment_operational_events,
			appointment_participants,
			appointment_change_requests,
			appointment_status_history,
			viewer_session_states,
			appointment_home_visit_executions,
			appointments,
			professional_portal_runtime_state,
			professional_portal_states,
			published_readmodel_documents
		RESTART IDENTITY CASCADE
	`)
	if err != nil {
		return fmt.Errorf("reset mutable runtime tables: %w", err)
	}

	return nil
}

func (s *seeder) bootstrapPublishedReadModelDocuments(ctx context.Context) error {
	repository := readmodel.NewRepository(s.cfg.SeedData.DataDir, s.contentStore)
	if err := repository.EnsureBootstrapped(ctx); err != nil {
		return fmt.Errorf("bootstrap published read-model documents: %w", err)
	}

	entries, err := jsonSeedFiles(s.cfg.SeedData.DataDir)
	if err != nil {
		return err
	}

	s.summary.PublishedReadModelDocumentCount = len(entries)
	return nil
}

func (s *seeder) seedChatRuntime(ctx context.Context) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin chat seed transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	messagesByThreadID := make(map[string][]seedChatMessageRow)
	for _, message := range s.dataset.ChatMessages {
		messagesByThreadID[message.ThreadID] = append(messagesByThreadID[message.ThreadID], message)
	}

	for _, thread := range s.dataset.ChatThreads {
		threadMessages := messagesByThreadID[thread.ID]
		sort.SliceStable(threadMessages, func(leftIndex int, rightIndex int) bool {
			return threadMessages[leftIndex].Index < threadMessages[rightIndex].Index
		})

		participantKind, participantID := deriveChatParticipant(thread)
		threadCreatedAt := seededChatTimestamp(thread.Index, 0)
		threadUpdatedAt := threadCreatedAt
		if len(threadMessages) > 0 {
			threadUpdatedAt = seededChatTimestamp(thread.Index, threadMessages[len(threadMessages)-1].Index)
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO chat_threads (
				id,
				title,
				participant_kind,
				participant_id,
				created_at,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, $6)
		`, thread.ID, thread.ID, participantKind, participantID, threadCreatedAt, threadUpdatedAt); err != nil {
			return fmt.Errorf("insert chat thread %s: %w", thread.ID, err)
		}

		for _, message := range threadMessages {
			sentAt := seededChatTimestamp(thread.Index, message.Index)
			if _, err := tx.ExecContext(ctx, `
				INSERT INTO chat_messages (
					id,
					thread_id,
					sender_kind,
					sender_id,
					sender_name,
					body,
					sent_at,
					created_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`, message.ID, thread.ID, message.Sender, message.Sender, normalizeChatSenderName(message.Sender), message.Text, sentAt, sentAt); err != nil {
				return fmt.Errorf("insert chat message %s: %w", message.ID, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit chat seed transaction: %w", err)
	}

	s.summary.ChatThreadCount = len(s.dataset.ChatThreads)
	s.summary.ChatMessageCount = len(s.dataset.ChatMessages)
	return nil
}

func (s *seeder) seedAppointments(ctx context.Context) error {
	if s.appointmentStore == nil {
		return fmt.Errorf("appointment store is required")
	}

	for _, appointment := range s.appointments {
		record := appointmentRecordFromSeed(appointment)
		if _, err := s.appointmentStore.UpsertAppointment(ctx, record); err != nil {
			return fmt.Errorf("seed appointment %s: %w", appointment.ID, err)
		}

		if err := s.appointmentStore.ReplaceAppointmentParticipants(ctx, appointment.ID, []appointmentstore.AppointmentParticipant{
			{
				AppointmentID:   appointment.ID,
				ParticipantKind: "customer",
				ParticipantID:   appointment.ConsumerID,
				DisplayName:     appointment.ConsumerID,
				CreatedAt:       record.CreatedAt,
			},
			{
				AppointmentID:   appointment.ID,
				ParticipantKind: "professional",
				ParticipantID:   appointment.ProfessionalID,
				DisplayName:     appointment.ProfessionalID,
				CreatedAt:       record.CreatedAt,
			},
		}); err != nil {
			return fmt.Errorf("seed appointment participants %s: %w", appointment.ID, err)
		}

		for _, event := range appointmentStatusHistoryFromSeed(appointment) {
			if _, err := s.appointmentStore.AppendAppointmentStatusEvent(ctx, event); err != nil {
				return fmt.Errorf("seed appointment timeline %s: %w", appointment.ID, err)
			}
		}
	}

	return nil
}

func (s *seeder) seedCustomerAuthRegistry(ctx context.Context) error {
	for index, consumer := range s.dataset.Consumers {
		area := s.areaForConsumerIndex(index)
		city := area.City
		normalizedPhone := normalizePhone(consumer.Phone)
		if err := s.customerAuth.SeedAccount(ctx, customerauth.SeedAccountInput{
			City:         city,
			ConsumerID:   consumer.ID,
			DisplayName:  consumer.Name,
			Password:     s.opts.CustomerPassword,
			Phone:        normalizedPhone,
			RegisteredAt: seededReferenceTime.Add(-time.Duration(index+1) * 24 * time.Hour),
		}); err != nil {
			return fmt.Errorf("seed customer auth account %s: %w", consumer.ID, err)
		}

		s.summary.CustomerAccounts = append(s.summary.CustomerAccounts, AccountLogin{
			City:        city,
			DisplayName: consumer.Name,
			ID:          consumer.ID,
			Password:    s.opts.CustomerPassword,
			Phone:       normalizedPhone,
		})
	}
	return nil
}

func (s *seeder) seedProfessionalAuthRegistry(ctx context.Context) error {
	areasByID := areasByID(s.dataset.Areas)
	for index, professional := range s.dataset.Professionals {
		normalizedPhone := normalizePhone(seedProfessionalPhone(index))
		city := primaryProfessionalCity(professional, areasByID)
		credentialNumber := seedCredentialNumber(professional.ID)
		if err := s.profAuth.SeedAccount(ctx, professionalauth.SeedAccountInput{
			City:             city,
			CredentialNumber: credentialNumber,
			DisplayName:      professional.Name,
			Password:         s.opts.ProfessionalPassword,
			Phone:            normalizedPhone,
			ProfessionalID:   professional.ID,
			RegisteredAt:     seededReferenceTime.Add(-time.Duration(index+2) * 12 * time.Hour),
		}); err != nil {
			return fmt.Errorf("seed professional auth account %s: %w", professional.ID, err)
		}

		s.summary.ProfessionalAccounts = append(s.summary.ProfessionalAccounts, AccountLogin{
			City:           city,
			DisplayName:    professional.Name,
			ID:             professional.ID,
			Password:       s.opts.ProfessionalPassword,
			Phone:          normalizedPhone,
			ProfessionalID: professional.ID,
		})
	}

	return nil
}

func (s *seeder) seedAdminAccessTokens(ctx context.Context) error {
	if len(s.cfg.AdminAuth.Credentials) == 0 {
		return nil
	}

	if err := s.adminAuth.Bootstrap(ctx); err != nil {
		return fmt.Errorf("bootstrap admin auth accounts: %w", err)
	}

	now := time.Now().UTC()
	for _, credential := range s.cfg.AdminAuth.Credentials {
		s.summary.AdminAccesses = append(s.summary.AdminAccesses, AdminAccess{
			AdminID:   credential.AdminID,
			Email:     credential.Email,
			FocusArea: credential.FocusArea,
		})
		rawToken := "seed-admin-session-" + credential.AdminID
		if _, err := s.adminAuth.SeedSession(ctx, adminauth.SeedSessionInput{
			AdminID:          credential.AdminID,
			Email:            credential.Email,
			ExpiresAt:        now.Add(s.cfg.AdminAuth.SessionTTL),
			FocusArea:        credential.FocusArea,
			LastLoginAt:      now,
			LastVisitedRoute: defaultSeededAdminRoute,
			RawToken:         rawToken,
		}); err != nil {
			return fmt.Errorf("seed admin bearer token for %s: %w", credential.AdminID, err)
		}

		s.summary.BearerTokens = append(s.summary.BearerTokens, BearerToken{
			Description: "Seeded admin API session for " + credential.Email,
			Role:        "admin",
			Token:       rawToken,
		})
	}
	return nil
}

func (s *seeder) seedCustomerAccessToken(ctx context.Context) error {
	if len(s.dataset.Consumers) == 0 {
		return nil
	}

	now := time.Now().UTC()
	for _, consumer := range s.dataset.Consumers {
		rawToken := "seed-customer-session-" + consumer.ID
		if _, err := s.customerAuth.SeedSession(ctx, customerauth.SeedSessionInput{
			ConsumerID:  consumer.ID,
			ExpiresAt:   now.Add(s.cfg.CustomerAuth.SessionTTL),
			LastLoginAt: now,
			RawToken:    rawToken,
		}); err != nil {
			return fmt.Errorf("seed customer bearer token for %s: %w", consumer.ID, err)
		}

		s.summary.BearerTokens = append(s.summary.BearerTokens, BearerToken{
			Description: "Seeded customer API session for " + consumer.ID,
			Role:        "customer",
			Token:       rawToken,
		})
	}
	return nil
}

func (s *seeder) seedProfessionalAccessToken(ctx context.Context) error {
	if len(s.dataset.Professionals) == 0 {
		return nil
	}

	now := time.Now().UTC()
	for _, professional := range s.dataset.Professionals {
		rawToken := "seed-professional-session-" + professional.ID
		if _, err := s.profAuth.SeedSession(ctx, professionalauth.SeedSessionInput{
			ExpiresAt:      now.Add(s.cfg.ProfessionalAuth.SessionTTL),
			LastLoginAt:    now,
			ProfessionalID: professional.ID,
			RawToken:       rawToken,
		}); err != nil {
			return fmt.Errorf("seed professional bearer token for %s: %w", professional.ID, err)
		}

		s.summary.BearerTokens = append(s.summary.BearerTokens, BearerToken{
			Description: "Seeded professional API session for " + professional.ID,
			Role:        "professional",
			Token:       rawToken,
		})
	}
	return nil
}

func (s *seeder) seedProfessionalPortal(ctx context.Context) error {
	areasByID := areasByID(s.dataset.Areas)
	reviewerName := ""
	if len(s.dataset.AdminStaff) > 1 {
		reviewerName = s.dataset.AdminStaff[1].Name
	} else if len(s.dataset.AdminStaff) > 0 {
		reviewerName = s.dataset.AdminStaff[0].Name
	}

	for index, professional := range s.dataset.Professionals {
		status := portalReviewStatusForIndex(index)
		reviewState := buildPortalReviewState(status, reviewerName, index)
		profile := buildPortalProfileData(professional, reviewState, areasByID, index)
		coverage := buildPortalCoverageData(professional, status, areasByID)
		services := buildPortalServicesData(professional, status, s.dataset.ServiceOfferings)
		portfolio := buildPortalPortfolioData(professional, status)
		gallery := buildPortalGalleryData(professional, status)
		trust := buildPortalTrustData(professional, status)
		requests := buildPortalRequestsData(professional.ID, s.appointments)

		if _, err := s.portalService.UpsertProfile(ctx, profile); err != nil {
			return fmt.Errorf("seed portal profile for professional %s: %w", professional.ID, err)
		}
		if _, err := s.portalService.UpsertCoverage(ctx, coverage); err != nil {
			return fmt.Errorf("seed portal coverage for professional %s: %w", professional.ID, err)
		}
		if _, err := s.portalService.UpsertServices(ctx, services); err != nil {
			return fmt.Errorf("seed portal services for professional %s: %w", professional.ID, err)
		}
		if _, err := s.portalService.UpsertPortfolio(ctx, portfolio); err != nil {
			return fmt.Errorf("seed portal portfolio for professional %s: %w", professional.ID, err)
		}
		if _, err := s.portalService.UpsertGallery(ctx, gallery); err != nil {
			return fmt.Errorf("seed portal gallery for professional %s: %w", professional.ID, err)
		}
		if _, err := s.portalService.UpsertTrust(ctx, trust); err != nil {
			return fmt.Errorf("seed portal trust for professional %s: %w", professional.ID, err)
		}
		if _, err := s.portalService.UpsertRequests(ctx, requests); err != nil {
			return fmt.Errorf("seed portal requests for professional %s: %w", professional.ID, err)
		}
		if err := s.seedProfessionalPortalReviewLifecycle(
			ctx,
			professional.ID,
			professional.Availability.IsAvailable,
			reviewState,
		); err != nil {
			return fmt.Errorf("seed portal review lifecycle for professional %s: %w", professional.ID, err)
		}

		s.summary.PortalStateCount += 1
		s.summary.PortalReviewStatusCounts[status] += 1

		session, err := s.portalService.Session(ctx, professional.ID)
		if err != nil {
			return fmt.Errorf("load portal session for professional %s: %w", professional.ID, err)
		}
		if session.HasSnapshot {
			if _, err := s.portalService.UpsertSession(ctx, professionalportal.UpsertProfessionalPortalSessionRequest{
				ProfessionalID: professional.ID,
				Snapshot:       session.Snapshot,
			}); err != nil {
				return fmt.Errorf("set default active portal session %s: %w", professional.ID, err)
			}
		}
	}

	return nil
}

func (s *seeder) seedClientState(ctx context.Context) error {
	service := clientstate.NewService(s.documentStore, s.pushStore, s.contentStore)

	if _, err := service.UpsertViewerSession(ctx, clientstate.ViewerSessionData{
		Mode: "visitor",
	}); err != nil {
		return fmt.Errorf("seed viewer session state: %w", err)
	}

	if _, err := service.UpsertAdminSession(ctx, clientstate.AdminSessionData{
		AdminID:          "",
		Email:            "",
		FocusArea:        "support",
		IsAuthenticated:  false,
		LastVisitedRoute: defaultSeededAdminRoute,
	}); err != nil {
		return fmt.Errorf("seed admin session state: %w", err)
	}

	if _, err := service.UpsertSupportDesk(ctx, clientstate.SupportDeskData{
		CommandCenter: buildSupportCommandCenter(s.dataset),
		SavedAt:       seededReferenceTime.Format(time.RFC3339),
		SchemaVersion: defaultSupportDeskSchemaVersion,
		Tickets:       append([]clientstate.SupportTicketData(nil), s.dataset.SupportTickets...),
	}); err != nil {
		return fmt.Errorf("seed support desk state: %w", err)
	}
	s.summary.SupportTicketCount = len(s.dataset.SupportTickets)

	if _, err := service.UpsertAdminConsole(ctx, clientstate.AdminConsoleData{
		SavedAt:       seededReferenceTime.Format(time.RFC3339),
		SchemaVersion: defaultAdminConsoleSchemaVersion,
		Tables:        cloneAdminConsoleTables(s.dataset.AdminConsoleTables),
	}); err != nil {
		return fmt.Errorf("seed admin console state: %w", err)
	}
	s.summary.AdminConsoleTableCount = len(s.dataset.AdminConsoleTables)

	areasByID := areasByID(s.dataset.Areas)
	for index, consumer := range s.dataset.Consumers {
		preferences := buildConsumerPreferencesData(consumer, s.areaForConsumerIndex(index), index)
		if _, err := service.UpsertConsumerPreferences(ctx, preferences, consumer.ID); err != nil {
			return fmt.Errorf("seed consumer preferences for %s: %w", consumer.ID, err)
		}
		s.summary.CustomerPreferenceCount += 1

		readIDs := buildCustomerNotificationReadIDs(consumer.ID, s.appointments, index)
		if _, err := service.UpsertCustomerNotifications(ctx, clientstate.CustomerNotificationStateData{
			ReadIDs: readIDs,
		}, consumer.ID); err != nil {
			return fmt.Errorf("seed customer notifications for %s: %w", consumer.ID, err)
		}
		s.summary.CustomerNotificationStateCount += 1
	}

	for index, professional := range s.dataset.Professionals {
		readIDs := buildProfessionalNotificationReadIDs(
			professional.ID,
			portalReviewStatusForIndex(index),
			buildPortalCoverageData(professional, portalReviewStatusForIndex(index), areasByID),
			buildPortalServicesData(professional, portalReviewStatusForIndex(index), s.dataset.ServiceOfferings),
		)
		if _, err := service.UpsertProfessionalNotifications(ctx, clientstate.ProfessionalNotificationStateData{
			ReadIDsByProfessional: map[string][]string{
				professional.ID: readIDs,
			},
		}, professional.ID); err != nil {
			return fmt.Errorf("seed professional notifications for %s: %w", professional.ID, err)
		}
		s.summary.ProfessionalNotificationStateCount += 1
	}

	return nil
}

func (s *seeder) buildVerificationScenarios() {
	areasByID := areasByID(s.dataset.Areas)
	customerStatusesByID := make(map[string]map[string]struct{}, len(s.dataset.Consumers))
	professionalStatusesByID := make(map[string]map[string]struct{}, len(s.dataset.Professionals))
	s.summary.CoveredCities = collectReferencedCities(s.dataset.Areas, s.dataset.UserContexts, s.dataset.Professionals, s.appointments)
	s.summary.SupportedServiceModes = collectSupportedServiceModes(s.dataset.ServiceOfferings)
	s.summary.SupportedBookingFlows = collectSupportedBookingFlows(s.dataset.ServiceOfferings)
	s.summary.SupportedAppointmentModes = collectSupportedAppointmentModes(s.appointments)

	for _, appointment := range s.appointments {
		status := string(appointment.Status)
		s.summary.AppointmentStatusCounts[status] += 1
		appendUniqueStatus(customerStatusesByID, appointment.ConsumerID, status)
		appendUniqueStatus(professionalStatusesByID, appointment.ProfessionalID, status)
	}

	for index, consumer := range s.dataset.Consumers {
		readIDs := buildCustomerNotificationReadIDs(consumer.ID, s.appointments, index)
		s.summary.CustomerScenarios = append(s.summary.CustomerScenarios, CustomerScenario{
			AppointmentStatuses:   sortedStatusKeys(customerStatusesByID[consumer.ID]),
			City:                  s.areaForConsumerIndex(index).City,
			ConsumerID:            consumer.ID,
			DisplayName:           consumer.Name,
			Phone:                 normalizePhone(consumer.Phone),
			ReadNotificationCount: len(readIDs),
			SuggestedChecks:       suggestedCustomerChecks(index),
		})
	}

	for index, professional := range s.dataset.Professionals {
		reviewStatus := portalReviewStatusForIndex(index)
		coverage := buildPortalCoverageData(professional, reviewStatus, areasByID)
		services := buildPortalServicesData(professional, reviewStatus, s.dataset.ServiceOfferings)
		s.summary.ProfessionalScenarios = append(s.summary.ProfessionalScenarios, ProfessionalScenario{
			AppointmentStatuses: sortedStatusKeys(professionalStatusesByID[professional.ID]),
			City:                primaryProfessionalCity(professional, areasByID),
			CoverageReady:       len(coverage.CoverageAreaIDs) > 0,
			DisplayName:         professional.Name,
			HasFeaturedService:  hasFeaturedManagedService(services.ServiceConfigurations),
			Phone:               normalizePhone(seedProfessionalPhone(index)),
			ProfessionalID:      professional.ID,
			ReviewStatus:        reviewStatus,
			ServicesReady:       len(services.ServiceConfigurations) > 0,
			SuggestedChecks:     suggestedProfessionalChecks(reviewStatus),
		})
	}

	for _, admin := range adminAccessesForQAMetadata(s.summary.AdminAccesses, s.dataset.AdminStaff) {
		s.summary.AdminScenarios = append(s.summary.AdminScenarios, AdminScenario{
			AdminID:         admin.AdminID,
			Email:           admin.Email,
			FocusArea:       admin.FocusArea,
			SuggestedChecks: suggestedAdminChecks(admin.FocusArea),
		})
	}

	s.summary.ManualQACases = buildManualQACases(s.dataset, s.appointments, manualQAConfig{
		AdminAccesses:        s.summary.AdminAccesses,
		CustomerPassword:     s.summary.CustomerPassword,
		ProfessionalPassword: s.summary.ProfessionalPassword,
	})
	s.summary.SampleEntityRefs = collectSummarySampleEntityRefs(s.summary.ManualQACases)
}

func buildSeedAppointments(data dataset) []readmodel.AppointmentSeed {
	appointments := append([]readmodel.AppointmentSeed(nil), data.Appointments...)
	if len(appointments) == 0 || len(data.Consumers) < 3 {
		return appointments
	}

	maxIndex := 0
	for _, appointment := range appointments {
		if appointment.Index > maxIndex {
			maxIndex = appointment.Index
		}
	}

	if clone, ok := cloneAppointmentByStatus(
		appointments,
		readmodel.AppointmentStatusRequested,
		data.Consumers[1].ID,
		"seed-qa-ibu-nadia-requested",
		"Seeded requested journey for unread customer notification QA.",
		maxIndex+1,
	); ok {
		appointments = append(appointments, clone)
		maxIndex = clone.Index
	}

	if clone, ok := cloneAppointmentByStatus(
		appointments,
		readmodel.AppointmentStatusCompleted,
		data.Consumers[2].ID,
		"seed-qa-mr-hendra-completed",
		"Seeded completed journey for resolved customer history QA.",
		maxIndex+1,
	); ok {
		appointments = append(appointments, clone)
		maxIndex = clone.Index
	}

	if clone, ok := cloneAppointmentByStatus(
		appointments,
		readmodel.AppointmentStatusCancelled,
		data.Consumers[2].ID,
		"seed-qa-mr-hendra-cancelled",
		"Seeded cancelled journey for refund and resolution QA.",
		maxIndex+1,
	); ok {
		appointments = append(appointments, clone)
	}

	return appointments
}

func cloneAppointmentByStatus(
	appointments []readmodel.AppointmentSeed,
	status readmodel.AppointmentStatus,
	consumerID string,
	appointmentID string,
	requestNote string,
	index int,
) (readmodel.AppointmentSeed, bool) {
	for _, appointment := range appointments {
		if appointment.Status != status {
			continue
		}

		clone := appointment
		clone.Index = index
		clone.ID = appointmentID
		clone.ConsumerID = consumerID
		clone.RequestNote = requestNote
		clone.Timeline = cloneAppointmentTimeline(appointmentID, appointment.Timeline)

		if clone.CustomerFeedback != nil {
			feedback := *clone.CustomerFeedback
			feedback.Author = consumerID
			clone.CustomerFeedback = &feedback
		}

		return clone, true
	}

	return readmodel.AppointmentSeed{}, false
}

func cloneAppointmentTimeline(
	appointmentID string,
	events []readmodel.AppointmentTimelineEvent,
) []readmodel.AppointmentTimelineEvent {
	if len(events) == 0 {
		return []readmodel.AppointmentTimelineEvent{}
	}

	timeline := make([]readmodel.AppointmentTimelineEvent, 0, len(events))
	for index, event := range events {
		clonedEvent := event
		clonedEvent.ID = fmt.Sprintf("%s-event-%d", appointmentID, index+1)
		timeline = append(timeline, clonedEvent)
	}

	return timeline
}

func appointmentRecordFromSeed(appointment readmodel.AppointmentSeed) appointmentstore.AppointmentRecord {
	requestedAt := seededReferenceTime.UTC()
	if parsedRequestedAt, err := time.Parse(time.RFC3339, strings.TrimSpace(appointment.RequestedAt)); err == nil {
		requestedAt = parsedRequestedAt.UTC()
	}

	serviceSnapshotBytes, _ := json.Marshal(appointment.ServiceSnapshot)
	scheduleSnapshotBytes, _ := json.Marshal(appointment.ScheduleSnapshot)
	cancellationPolicyBytes, _ := json.Marshal(appointment.CancellationPolicySnapshot)
	recentActivityBytes, _ := json.Marshal(appointment.RecentActivity)
	feedbackBytes, _ := json.Marshal(appointment.CustomerFeedback)
	cancellationResolutionBytes, _ := json.Marshal(appointment.CancellationResolution)

	record := appointmentstore.AppointmentRecord{
		ID:                         appointment.ID,
		AreaID:                     appointment.AreaID,
		BookingFlow:                appointment.BookingFlow,
		ConsumerID:                 appointment.ConsumerID,
		ProfessionalID:             appointment.ProfessionalID,
		RequestNote:                appointment.RequestNote,
		RequestedAt:                requestedAt,
		RequestedMode:              appointment.RequestedMode,
		ServiceID:                  appointment.ServiceID,
		ServiceOfferingID:          appointment.ServiceOfferingID,
		Status:                     normalizeSeedAppointmentStatus(string(appointment.Status)),
		TotalPriceAmount:           priceAmountFromLabel(appointment.TotalPriceLabel),
		TotalPriceLabel:            appointment.TotalPriceLabel,
		Currency:                   "IDR",
		ServiceSnapshot:            mapFromJSONBytes(serviceSnapshotBytes),
		ScheduleSnapshot:           mapFromJSONBytes(scheduleSnapshotBytes),
		PricingSnapshot:            map[string]any{"amount": priceAmountFromLabel(appointment.TotalPriceLabel), "currency": "IDR", "label": appointment.TotalPriceLabel},
		CancellationPolicySnapshot: mapFromJSONBytes(cancellationPolicyBytes),
		CancellationResolution:     mapFromJSONBytes(cancellationResolutionBytes),
		RecentActivity:             mapFromJSONBytes(recentActivityBytes),
		CustomerFeedback:           mapFromJSONBytes(feedbackBytes),
		CreatedAt:                  requestedAt,
		UpdatedAt:                  requestedAt,
	}

	if len(appointment.Timeline) > 0 {
		if parsedUpdatedAt, err := time.Parse(time.RFC3339, strings.TrimSpace(appointment.Timeline[len(appointment.Timeline)-1].CreatedAt)); err == nil {
			record.UpdatedAt = parsedUpdatedAt.UTC()
		}
	}

	return record
}

func appointmentStatusHistoryFromSeed(
	appointment readmodel.AppointmentSeed,
) []appointmentstore.AppointmentStatusEvent {
	if len(appointment.Timeline) == 0 {
		return []appointmentstore.AppointmentStatusEvent{}
	}

	events := make([]appointmentstore.AppointmentStatusEvent, 0, len(appointment.Timeline))
	lastStatus := ""
	for _, event := range appointment.Timeline {
		createdAt := seededReferenceTime.UTC()
		if parsedCreatedAt, err := time.Parse(time.RFC3339, strings.TrimSpace(event.CreatedAt)); err == nil {
			createdAt = parsedCreatedAt.UTC()
		}

		toStatus := normalizeSeedAppointmentStatus(string(event.ToStatus))
		fromStatus := normalizeSeedAppointmentStatus(string(event.FromStatus))
		if fromStatus == "" {
			fromStatus = lastStatus
		}
		if toStatus == lastStatus {
			continue
		}

		events = append(events, appointmentstore.AppointmentStatusEvent{
			ID:              event.ID,
			AppointmentID:   appointment.ID,
			FromStatus:      fromStatus,
			ToStatus:        toStatus,
			ActorKind:       normalizeSeedTimelineActor(event.Actor),
			ActorID:         actorIDForTimelineEvent(appointment, event.Actor),
			ActorName:       actorNameForTimelineEvent(appointment, event.Actor),
			CustomerSummary: event.CustomerSummary,
			InternalNote:    event.InternalNote,
			EvidenceURL:     event.EvidenceURL,
			CreatedAt:       createdAt,
			CreatedAtLabel:  event.CreatedAtLabel,
		})
		lastStatus = toStatus
	}

	return events
}

func normalizeSeedAppointmentStatus(status string) string {
	switch strings.TrimSpace(status) {
	case string(readmodel.AppointmentStatusApprovedWaitingPayment):
		return appointmentstore.StatusAwaitingPayment
	case string(readmodel.AppointmentStatusPaid):
		return appointmentstore.StatusConfirmed
	case "":
		return ""
	default:
		return status
	}
}

func normalizeSeedTimelineActor(actor string) string {
	switch strings.TrimSpace(actor) {
	case "customer":
		return "customer"
	case "professional":
		return "professional"
	default:
		return "system"
	}
}

func actorIDForTimelineEvent(appointment readmodel.AppointmentSeed, actor string) string {
	switch strings.TrimSpace(actor) {
	case "customer":
		return appointment.ConsumerID
	case "professional":
		return appointment.ProfessionalID
	default:
		return "system"
	}
}

func actorNameForTimelineEvent(appointment readmodel.AppointmentSeed, actor string) string {
	switch strings.TrimSpace(actor) {
	case "customer":
		return appointment.ConsumerID
	case "professional":
		return appointment.ProfessionalID
	default:
		return "System"
	}
}

func mapFromJSONBytes(payload []byte) map[string]any {
	if len(payload) == 0 || string(payload) == "null" {
		return map[string]any{}
	}

	var decoded map[string]any
	if err := json.Unmarshal(payload, &decoded); err != nil || decoded == nil {
		return map[string]any{}
	}
	return decoded
}

func priceAmountFromLabel(value string) int {
	digitsOnly := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
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

func buildSupportCommandCenter(data dataset) clientstate.AdminCommandCenterStateData {
	activeAdminID := ""
	if len(data.AdminStaff) > 0 {
		activeAdminID = data.AdminStaff[0].ID
	}

	incidentMode := "monitoring"
	for _, ticket := range data.SupportTickets {
		if ticket.Urgency == "urgent" || ticket.Urgency == "high" {
			incidentMode = "degraded"
			break
		}
	}

	highlightedProfessionalID := ""
	for _, ticket := range data.SupportTickets {
		if strings.TrimSpace(ticket.RelatedProfessionalID) != "" {
			highlightedProfessionalID = ticket.RelatedProfessionalID
			break
		}
	}

	watchAreaID := ""
	for _, appointment := range data.Appointments {
		if strings.TrimSpace(appointment.AreaID) != "" {
			watchAreaID = appointment.AreaID
			break
		}
	}

	return clientstate.AdminCommandCenterStateData{
		ActiveAdminID:             activeAdminID,
		CommandNote:               "Comprehensive QA seed loaded across auth, portal, chat, support, and admin tables.",
		FocusArea:                 "support",
		HighlightedProfessionalID: highlightedProfessionalID,
		IncidentMode:              incidentMode,
		RuntimeNarrative:          "Seeded refund, trust, onboarding, and appointment edge cases are ready for validation.",
		WatchAreaID:               watchAreaID,
	}
}

func buildConsumerPreferencesData(consumer seedConsumerRow, area readmodel.Area, consumerIndex int) clientstate.ConsumerPreferencesData {
	point := clientstate.GeoPointData{
		Latitude:  area.Latitude,
		Longitude: area.Longitude,
	}

	return clientstate.ConsumerPreferencesData{
		ConsumerID:              consumer.ID,
		FavoriteProfessionalIDs: favoriteProfessionalIDsForConsumer(consumerIndex),
		ResolvedLocation: clientstate.ResolvedLocationData{
			AreaID:           area.ID,
			AreaLabel:        area.Label,
			City:             area.City,
			Country:          "Indonesia",
			District:         area.District,
			FormattedAddress: fmt.Sprintf("%s, %s, %s, Indonesia", area.District, area.City, area.Province),
			Point:            point,
			PostalCode:       fmt.Sprintf("%05d", 16410+consumerIndex),
			Precision:        "district",
			Province:         area.Province,
			Source:           "derived",
		},
		SelectedAreaID: area.ID,
		UserLocation:   point,
	}
}

func appendUniqueStatus(target map[string]map[string]struct{}, actorID string, status string) {
	if strings.TrimSpace(actorID) == "" || strings.TrimSpace(status) == "" {
		return
	}

	statuses, ok := target[actorID]
	if !ok {
		statuses = map[string]struct{}{}
		target[actorID] = statuses
	}

	statuses[status] = struct{}{}
}

func collectReferencedCities(
	areas []readmodel.Area,
	userContexts []seedUserContextRow,
	professionals []readmodel.Professional,
	appointments []readmodel.AppointmentSeed,
) []string {
	areasByID := areasByID(areas)
	values := map[string]struct{}{}

	for _, contextRow := range userContexts {
		if area, ok := areasByID[contextRow.SelectedAreaID]; ok && strings.TrimSpace(area.City) != "" {
			values[area.City] = struct{}{}
		}
	}

	for _, professional := range professionals {
		if city := strings.TrimSpace(primaryProfessionalCity(professional, areasByID)); city != "" {
			values[city] = struct{}{}
		}
	}

	for _, appointment := range appointments {
		if area, ok := areasByID[appointment.AreaID]; ok && strings.TrimSpace(area.City) != "" {
			values[area.City] = struct{}{}
		}
	}

	return sortedKeys(values)
}

func collectSupportedServiceModes(offerings []seedServiceOfferingRow) []string {
	values := map[string]struct{}{}
	for _, offering := range offerings {
		if offering.SupportsHomeVisit {
			values["home_visit"] = struct{}{}
		}
		if offering.SupportsOnline {
			values["online"] = struct{}{}
		}
		if offering.SupportsOnsite {
			values["onsite"] = struct{}{}
		}
	}
	return sortedKeys(values)
}

func collectSupportedBookingFlows(offerings []seedServiceOfferingRow) []string {
	values := map[string]struct{}{}
	for _, offering := range offerings {
		flow := strings.TrimSpace(offering.BookingFlow)
		if flow != "" {
			values[flow] = struct{}{}
		}
	}
	return sortedKeys(values)
}

func collectSupportedAppointmentModes(appointments []readmodel.AppointmentSeed) []string {
	values := map[string]struct{}{}
	for _, appointment := range appointments {
		mode := strings.TrimSpace(appointment.RequestedMode)
		if mode != "" {
			values[mode] = struct{}{}
		}
	}
	return sortedKeys(values)
}

func sortedKeys(values map[string]struct{}) []string {
	if len(values) == 0 {
		return []string{}
	}

	keys := make([]string, 0, len(values))
	for value := range values {
		keys = append(keys, value)
	}
	sort.Strings(keys)
	return keys
}

func sortedStatusKeys(values map[string]struct{}) []string {
	if len(values) == 0 {
		return []string{}
	}

	statuses := make([]string, 0, len(values))
	for status := range values {
		statuses = append(statuses, status)
	}
	sort.Strings(statuses)
	return statuses
}

func suggestedCustomerChecks(index int) []string {
	switch index {
	case 0:
		return []string{
			"Login as this customer, open profile, and verify the backend-restored session and preferences hydrate immediately.",
			"Open customer notifications and confirm only part of the appointment-related alerts are marked read.",
			"Open an existing appointment chat thread and verify seeded conversation history and live send flow both work.",
		}
	case 1:
		return []string{
			"Login as this customer and verify unread notification badges still appear because nothing is pre-read.",
			"Walk the payment or confirmation branch of the seeded appointments and verify request-status cards match backend state.",
			"Edit customer profile fields and confirm changes persist after refresh.",
		}
	default:
		return []string{
			"Login as this customer and verify the history path with mostly-read notifications and resolved appointments.",
			"Open completed or cancelled appointment journeys to confirm timeline, cancellation, and review states render correctly.",
			"Switch between service detail and professional detail flows to confirm favorites and resolved location stay consistent.",
		}
	}
}

func suggestedProfessionalChecks(reviewStatus string) []string {
	checks := []string{
		"Login through professional access and verify portal hydration comes from backend state, not browser-owned draft data.",
		"Open requests, services, trust, and coverage tabs and confirm edits persist after refresh.",
	}

	switch reviewStatus {
	case "published":
		return append(checks,
			"Verify public home, explore, services, and professional detail pages reflect this professional as a published catalog entry.",
		)
	case "submitted":
		return append(checks,
			"Verify review state shows submitted and actions stay read-only until an admin decision is applied.",
		)
	case "changes_requested":
		return append(checks,
			"Verify review feedback and admin note are visible, then edit portfolio or coverage data and resubmit.",
		)
	case "verified":
		return append(checks,
			"Verify trust notifications include the verified review outcome and the portal is ready for final publish action.",
		)
	case "draft":
		return append(checks,
			"Verify incomplete draft behavior: empty services, empty coverage areas, and onboarding prompts remain visible.",
		)
	case "ready_for_review":
		return append(checks,
			"Verify the pre-review warning path where services exist but no featured service is selected yet.",
		)
	default:
		return checks
	}
}

func buildCustomerNotificationReadIDs(consumerID string, appointments []readmodel.AppointmentSeed, consumerIndex int) []string {
	ids := []string{}
	for _, appointment := range appointments {
		if appointment.ConsumerID != consumerID {
			continue
		}
		notificationID, ok := customerNotificationID(appointment)
		if !ok {
			continue
		}
		ids = append(ids, notificationID)
	}

	switch consumerIndex {
	case 0:
		if len(ids) > 0 {
			return ids[:1]
		}
	case 1:
		return []string{}
	default:
		return ids
	}

	return []string{}
}

func buildProfessionalNotificationReadIDs(
	professionalID string,
	reviewStatus string,
	coverage professionalportal.ProfessionalPortalCoverageData,
	services professionalportal.ProfessionalPortalServicesData,
) []string {
	ids := []string{}

	if reviewStatus == "verified" {
		ids = append(ids, "operations:review-verified:"+professionalID)
	}

	if reviewStatus == "ready_for_review" && !hasFeaturedManagedService(services.ServiceConfigurations) {
		ids = append(ids, "operations:services-featured:"+professionalID)
	}

	if len(coverage.CoverageAreaIDs) == 0 {
		return ids
	}

	return ids
}

func customerNotificationID(appointment readmodel.AppointmentSeed) (string, bool) {
	switch appointment.Status {
	case readmodel.AppointmentStatusApprovedWaitingPayment,
		readmodel.AppointmentStatusRequested,
		readmodel.AppointmentStatusConfirmed,
		readmodel.AppointmentStatusInService:
	case readmodel.AppointmentStatusCompleted:
		if appointment.CustomerFeedback != nil {
			return "", false
		}
	default:
		return "", false
	}

	createdAt := appointment.RequestedAt
	if len(appointment.Timeline) > 0 && strings.TrimSpace(appointment.Timeline[len(appointment.Timeline)-1].CreatedAt) != "" {
		createdAt = appointment.Timeline[len(appointment.Timeline)-1].CreatedAt
	}

	return fmt.Sprintf("appointment:%s:%s:%s", appointment.ID, appointment.Status, createdAt), true
}

func buildPortalProfileData(
	professional readmodel.Professional,
	reviewState professionalportal.ProfessionalPortalReviewState,
	areas map[string]readmodel.Area,
	index int,
) professionalportal.UpsertProfessionalPortalProfileData {
	return professionalportal.UpsertProfessionalPortalProfileData{
		AcceptingNewClients:        reviewState.Status != "draft" && professional.Availability.IsAvailable,
		AutoApproveInstantBookings: hasInstantBooking(professional.Services),
		City:                       primaryProfessionalCity(professional, areas),
		CredentialNumber:           seedCredentialNumber(professional.ID),
		DisplayName:                professional.Name,
		Phone:                      seedProfessionalPhone(index),
		ProfessionalID:             professional.ID,
		PublicBio:                  professional.About,
		ResponseTimeGoal:           professional.ResponseTime,
		YearsExperience:            professional.Experience,
	}
}

func (s *seeder) seedProfessionalPortalReviewLifecycle(
	ctx context.Context,
	professionalID string,
	acceptingNewClients bool,
	reviewState professionalportal.ProfessionalPortalReviewState,
) error {
	status := strings.TrimSpace(reviewState.Status)
	switch status {
	case "", "draft", "ready_for_review":
		return nil
	case "submitted":
		if _, err := s.portalService.SubmitProfileForReview(ctx, professionalID); err != nil {
			return err
		}
		_, err := s.portalService.UpsertAdminReviewState(ctx, professionalportal.ProfessionalPortalAdminReviewStateData{
			ProfessionalID: professionalID,
			ReviewState:    reviewState,
		})
		return err
	case "changes_requested", "verified":
		if _, err := s.portalService.SubmitProfileForReview(ctx, professionalID); err != nil {
			return err
		}
		_, err := s.portalService.UpsertAdminReviewState(ctx, professionalportal.ProfessionalPortalAdminReviewStateData{
			ProfessionalID: professionalID,
			ReviewState:    reviewState,
		})
		return err
	case "published":
		if _, err := s.portalService.SubmitProfileForReview(ctx, professionalID); err != nil {
			return err
		}
		if _, err := s.portalService.UpsertAdminReviewState(ctx, professionalportal.ProfessionalPortalAdminReviewStateData{
			ProfessionalID: professionalID,
			ReviewState: professionalportal.ProfessionalPortalReviewState{
				AdminNote:    reviewState.AdminNote,
				ReviewedAt:   reviewState.ReviewedAt,
				ReviewerName: reviewState.ReviewerName,
				Status:       "verified",
				SubmittedAt:  reviewState.SubmittedAt,
			},
		}); err != nil {
			return err
		}
		_, err := s.portalService.UpsertAdminReviewState(ctx, professionalportal.ProfessionalPortalAdminReviewStateData{
			AcceptingNewClients: &acceptingNewClients,
			ProfessionalID:      professionalID,
			ReviewState:         reviewState,
		})
		return err
	default:
		return nil
	}
}

func buildPortalCoverageData(
	professional readmodel.Professional,
	status string,
	areas map[string]readmodel.Area,
) professionalportal.ProfessionalPortalCoverageData {
	if status == "draft" {
		return professionalportal.ProfessionalPortalCoverageData{
			AcceptingNewClients:        false,
			AutoApproveInstantBookings: false,
			AvailabilityRulesByMode:    map[string]readmodel.ProfessionalAvailabilityRules{},
			City:                       primaryProfessionalCity(professional, areas),
			CoverageAreaIDs:            []string{},
			CoverageCenter:             professional.Coverage.Center,
			HomeVisitRadiusKm:          0,
			PracticeAddress:            "",
			PracticeLabel:              "",
			ProfessionalID:             professional.ID,
			PublicBio:                  professional.About,
			ResponseTimeGoal:           professional.ResponseTime,
		}
	}

	practiceAddress := strings.Join(professional.AddressLines, ", ")
	practiceLabel := professional.Location
	if professional.PracticeLocation != nil {
		practiceAddress = professional.PracticeLocation.Address
		practiceLabel = professional.PracticeLocation.Label
	}
	coverageAreaIDs := append([]string(nil), professional.Coverage.AreaIDs...)
	if len(coverageAreaIDs) == 0 && professional.PracticeLocation != nil {
		if areaID := strings.TrimSpace(professional.PracticeLocation.AreaID); areaID != "" {
			if _, ok := areas[areaID]; ok {
				coverageAreaIDs = append(coverageAreaIDs, areaID)
			}
		}
	}

	return professionalportal.ProfessionalPortalCoverageData{
		AcceptingNewClients:        professional.Availability.IsAvailable,
		AutoApproveInstantBookings: hasInstantBooking(professional.Services),
		AvailabilityRulesByMode:    cloneAvailabilityRules(professional.AvailabilityRulesByMode),
		City:                       primaryProfessionalCity(professional, areas),
		CoverageAreaIDs:            coverageAreaIDs,
		CoverageCenter:             professional.Coverage.Center,
		HomeVisitRadiusKm:          professional.Coverage.HomeVisitRadiusKm,
		PracticeAddress:            practiceAddress,
		PracticeLabel:              practiceLabel,
		ProfessionalID:             professional.ID,
		PublicBio:                  professional.About,
		ResponseTimeGoal:           professional.ResponseTime,
	}
}

func buildPortalServicesData(
	professional readmodel.Professional,
	status string,
	serviceOfferings []seedServiceOfferingRow,
) professionalportal.ProfessionalPortalServicesData {
	if status == "draft" {
		return professionalportal.ProfessionalPortalServicesData{
			ProfessionalID:        professional.ID,
			ServiceConfigurations: []professionalportal.ProfessionalPortalManagedService{},
		}
	}

	configurations := make([]professionalportal.ProfessionalPortalManagedService, 0)
	filtered := make([]seedServiceOfferingRow, 0)
	for _, row := range serviceOfferings {
		if row.ProfessionalID == professional.ID {
			filtered = append(filtered, row)
		}
	}
	sort.SliceStable(filtered, func(leftIndex int, rightIndex int) bool {
		return filtered[leftIndex].Index < filtered[rightIndex].Index
	})

	for index, offering := range filtered {
		featured := index == 0
		if status == "ready_for_review" {
			featured = false
		}

		configurations = append(configurations, professionalportal.ProfessionalPortalManagedService{
			BookingFlow:  offering.BookingFlow,
			DefaultMode:  offering.DefaultMode,
			Duration:     offering.Duration,
			Featured:     featured,
			ID:           offering.ID,
			Index:        offering.Index,
			IsActive:     true,
			Price:        offering.Price,
			ServiceID:    offering.ServiceID,
			ServiceModes: serviceModesFromOffering(offering),
			Source:       "seeddata",
			Summary:      offering.Summary,
		})
	}

	return professionalportal.ProfessionalPortalServicesData{
		ProfessionalID:        professional.ID,
		ServiceConfigurations: configurations,
	}
}

func buildPortalPortfolioData(
	professional readmodel.Professional,
	status string,
) professionalportal.ProfessionalPortalPortfolioData {
	if status == "draft" {
		return professionalportal.ProfessionalPortalPortfolioData{
			PortfolioEntries: []professionalportal.ProfessionalPortalPortfolioEntry{},
			ProfessionalID:   professional.ID,
		}
	}

	entries := make([]professionalportal.ProfessionalPortalPortfolioEntry, 0, len(professional.PortfolioEntries))
	for index, entry := range professional.PortfolioEntries {
		visibility := "public"
		if index%2 == 1 {
			visibility = "private"
		}

		entries = append(entries, professionalportal.ProfessionalPortalPortfolioEntry{
			ID:          entry.ID,
			Image:       entry.Image,
			Index:       entry.Index,
			Outcomes:    append([]string(nil), entry.Outcomes...),
			PeriodLabel: entry.PeriodLabel,
			ServiceID:   entry.ServiceID,
			Summary:     entry.Summary,
			Title:       entry.Title,
			Visibility:  visibility,
		})
	}

	return professionalportal.ProfessionalPortalPortfolioData{
		PortfolioEntries: entries,
		ProfessionalID:   professional.ID,
	}
}

func buildPortalGalleryData(
	professional readmodel.Professional,
	status string,
) professionalportal.ProfessionalPortalGalleryData {
	if status == "draft" {
		return professionalportal.ProfessionalPortalGalleryData{
			GalleryItems:   []professionalportal.ProfessionalPortalGalleryItem{},
			ProfessionalID: professional.ID,
		}
	}

	items := make([]professionalportal.ProfessionalPortalGalleryItem, 0, len(professional.Gallery))
	for index, item := range professional.Gallery {
		items = append(items, professionalportal.ProfessionalPortalGalleryItem{
			Alt:        item.Alt,
			ID:         item.ID,
			Image:      item.Image,
			Index:      item.Index,
			IsFeatured: index == 0,
			Label:      item.Label,
		})
	}

	return professionalportal.ProfessionalPortalGalleryData{
		GalleryItems:   items,
		ProfessionalID: professional.ID,
	}
}

func buildPortalTrustData(
	professional readmodel.Professional,
	status string,
) professionalportal.ProfessionalPortalTrustData {
	if status == "draft" {
		return professionalportal.ProfessionalPortalTrustData{
			ActivityStories: []professionalportal.ProfessionalPortalActivityStory{},
			Credentials:     []professionalportal.ProfessionalPortalCredential{},
			ProfessionalID:  professional.ID,
		}
	}

	credentials := make([]professionalportal.ProfessionalPortalCredential, 0, len(professional.Credentials))
	for index, credential := range professional.Credentials {
		credentials = append(credentials, professionalportal.ProfessionalPortalCredential{
			ID:     fmt.Sprintf("%s-credential-%d", professional.ID, index+1),
			Index:  credential.Index,
			Issuer: credential.Issuer,
			Note:   credential.Note,
			Title:  credential.Title,
			Year:   credential.Year,
		})
	}

	activityStories := make([]professionalportal.ProfessionalPortalActivityStory, 0, len(professional.ActivityStories))
	for index, story := range professional.ActivityStories {
		activityStories = append(activityStories, professionalportal.ProfessionalPortalActivityStory{
			CapturedAt: story.CapturedAt,
			ID:         fmt.Sprintf("%s-story-%d", professional.ID, index+1),
			Image:      story.Image,
			Index:      story.Index,
			Location:   story.Location,
			Note:       story.Note,
			Title:      story.Title,
		})
	}

	return professionalportal.ProfessionalPortalTrustData{
		ActivityStories: activityStories,
		Credentials:     credentials,
		ProfessionalID:  professional.ID,
	}
}

func buildPortalRequestsData(
	professionalID string,
	appointments []readmodel.AppointmentSeed,
) professionalportal.ProfessionalPortalRequestsData {
	records := make([]professionalportal.ProfessionalPortalManagedAppointmentRecord, 0)
	for _, appointment := range appointments {
		if appointment.ProfessionalID != professionalID {
			continue
		}

		records = append(records, professionalportal.ProfessionalPortalManagedAppointmentRecord{
			AreaID:      appointment.AreaID,
			BookingFlow: appointment.BookingFlow,
			CancellationPolicySnapshot: readmodel.ProfessionalCancellationPolicy{
				CustomerPaidCancelCutoffHours: appointment.CancellationPolicySnapshot.CustomerPaidCancelCutoffHours,
				ProfessionalCancelOutcome:     appointment.CancellationPolicySnapshot.ProfessionalCancelOutcome,
				BeforeCutoffOutcome:           appointment.CancellationPolicySnapshot.BeforeCutoffOutcome,
				AfterCutoffOutcome:            appointment.CancellationPolicySnapshot.AfterCutoffOutcome,
			},
			CancellationResolution: toPortalCancellationResolution(appointment.CancellationResolution),
			ConsumerID:             appointment.ConsumerID,
			ID:                     appointment.ID,
			Index:                  appointment.Index,
			ProfessionalID:         appointment.ProfessionalID,
			RequestNote:            appointment.RequestNote,
			RequestedAt:            appointment.RequestedAt,
			RequestedMode:          appointment.RequestedMode,
			ScheduleSnapshot: professionalportal.ProfessionalPortalAppointmentScheduleSnapshot{
				DateISO:            appointment.ScheduleSnapshot.DateISO,
				RequiresSchedule:   appointment.ScheduleSnapshot.RequiresSchedule,
				ScheduleDayID:      appointment.ScheduleSnapshot.ScheduleDayID,
				ScheduleDayLabel:   appointment.ScheduleSnapshot.ScheduleDayLabel,
				ScheduledTimeLabel: appointment.ScheduleSnapshot.ScheduledTimeLabel,
				TimeSlotID:         appointment.ScheduleSnapshot.TimeSlotID,
				TimeSlotLabel:      appointment.ScheduleSnapshot.TimeSlotLabel,
			},
			ServiceID:         appointment.ServiceID,
			ServiceOfferingID: appointment.ServiceOfferingID,
			ServiceSnapshot: professionalportal.ProfessionalPortalAppointmentServiceSnapshot{
				BookingFlow:       appointment.ServiceSnapshot.BookingFlow,
				CategoryID:        appointment.ServiceSnapshot.CategoryID,
				CoverImage:        appointment.ServiceSnapshot.CoverImage,
				DefaultMode:       appointment.ServiceSnapshot.DefaultMode,
				Description:       appointment.ServiceSnapshot.Description,
				DurationLabel:     appointment.ServiceSnapshot.DurationLabel,
				Highlights:        append([]string(nil), appointment.ServiceSnapshot.Highlights...),
				Image:             appointment.ServiceSnapshot.Image,
				Name:              appointment.ServiceSnapshot.Name,
				PriceAmount:       appointment.ServiceSnapshot.PriceAmount,
				PriceLabel:        appointment.ServiceSnapshot.PriceLabel,
				ServiceID:         appointment.ServiceSnapshot.ServiceID,
				ServiceModes:      appointment.ServiceSnapshot.ServiceModes,
				ServiceOfferingID: appointment.ServiceSnapshot.ServiceOfferingID,
				ShortDescription:  appointment.ServiceSnapshot.ShortDescription,
				Slug:              appointment.ServiceSnapshot.Slug,
				Summary:           appointment.ServiceSnapshot.Summary,
				Tags:              append([]string(nil), appointment.ServiceSnapshot.Tags...),
			},
			Status:   appointment.Status,
			Timeline: toPortalTimeline(appointment.Timeline),
		})
	}

	sort.SliceStable(records, func(leftIndex int, rightIndex int) bool {
		return records[leftIndex].RequestedAt > records[rightIndex].RequestedAt
	})

	return professionalportal.ProfessionalPortalRequestsData{
		AppointmentRecords: records,
		ProfessionalID:     professionalID,
	}
}

func portalReviewStatusForIndex(index int) string {
	statuses := []string{"published", "submitted", "changes_requested", "verified", "draft", "ready_for_review"}
	return statuses[index%len(statuses)]
}

func buildPortalReviewState(status string, reviewerName string, index int) professionalportal.ProfessionalPortalReviewState {
	base := seededReferenceTime.Add(-time.Duration(index+1) * 6 * time.Hour)
	switch status {
	case "published":
		return professionalportal.ProfessionalPortalReviewState{
			PublishedAt:  base.Add(4 * time.Hour).Format(time.RFC3339),
			ReviewedAt:   base.Add(3 * time.Hour).Format(time.RFC3339),
			ReviewerName: reviewerName,
			Status:       status,
			SubmittedAt:  base.Format(time.RFC3339),
		}
	case "submitted":
		return professionalportal.ProfessionalPortalReviewState{
			Status:      status,
			SubmittedAt: base.Format(time.RFC3339),
		}
	case "changes_requested":
		return professionalportal.ProfessionalPortalReviewState{
			AdminNote:    "Lengkapi kelengkapan portofolio dan revisi detail coverage sebelum publish.",
			ReviewedAt:   base.Add(2 * time.Hour).Format(time.RFC3339),
			ReviewerName: reviewerName,
			Status:       status,
			SubmittedAt:  base.Format(time.RFC3339),
		}
	case "verified":
		return professionalportal.ProfessionalPortalReviewState{
			AdminNote:    "Profile sudah lolos review trust dan siap dipublish setelah final confirmation.",
			ReviewedAt:   base.Add(2 * time.Hour).Format(time.RFC3339),
			ReviewerName: reviewerName,
			Status:       status,
			SubmittedAt:  base.Format(time.RFC3339),
		}
	case "ready_for_review":
		return professionalportal.ProfessionalPortalReviewState{
			Status: status,
		}
	default:
		return professionalportal.ProfessionalPortalReviewState{
			Status: "draft",
		}
	}
}

func toPortalCancellationResolution(
	resolution *readmodel.AppointmentCancellationResolution,
) *professionalportal.ProfessionalPortalAppointmentCancellationResolution {
	if resolution == nil {
		return nil
	}

	return &professionalportal.ProfessionalPortalAppointmentCancellationResolution{
		CancelledAt:        resolution.CancelledAt,
		CancelledBy:        resolution.CancelledBy,
		CancellationReason: resolution.CancellationReason,
		FinancialOutcome:   resolution.FinancialOutcome,
	}
}

func toPortalTimeline(events []readmodel.AppointmentTimelineEvent) []professionalportal.ProfessionalPortalAppointmentTimelineEvent {
	timeline := make([]professionalportal.ProfessionalPortalAppointmentTimelineEvent, 0, len(events))
	for _, event := range events {
		timeline = append(timeline, professionalportal.ProfessionalPortalAppointmentTimelineEvent{
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

func serviceModesFromOffering(offering seedServiceOfferingRow) readmodel.ServiceMode {
	return readmodel.ServiceMode{
		HomeVisit: offering.SupportsHomeVisit,
		Online:    offering.SupportsOnline,
		Onsite:    offering.SupportsOnsite,
	}
}

func hasFeaturedManagedService(services []professionalportal.ProfessionalPortalManagedService) bool {
	for _, service := range services {
		if service.Featured {
			return true
		}
	}
	return false
}

func favoriteProfessionalIDsForConsumer(index int) []string {
	switch index {
	case 0:
		return []string{"6", "1"}
	case 1:
		return []string{}
	default:
		return []string{"4"}
	}
}

func hasInstantBooking(services []readmodel.ProfessionalService) bool {
	for _, service := range services {
		if strings.TrimSpace(service.BookingFlow) == "instant" {
			return true
		}
	}
	return false
}

func primaryProfessionalCity(professional readmodel.Professional, areas map[string]readmodel.Area) string {
	for _, areaID := range professional.Coverage.AreaIDs {
		if area, ok := areas[areaID]; ok {
			return area.City
		}
	}
	if professional.PracticeLocation != nil {
		if area, ok := areas[professional.PracticeLocation.AreaID]; ok {
			return area.City
		}
	}
	return ""
}

func areasByID(areas []readmodel.Area) map[string]readmodel.Area {
	values := make(map[string]readmodel.Area, len(areas))
	for _, area := range areas {
		values[area.ID] = area
	}
	return values
}

func (s *seeder) areaForConsumerIndex(index int) readmodel.Area {
	if len(s.dataset.UserContexts) > 0 {
		contextRow := s.dataset.UserContexts[index%len(s.dataset.UserContexts)]
		for _, area := range s.dataset.Areas {
			if area.ID == contextRow.SelectedAreaID {
				return area
			}
		}
	}

	if len(s.dataset.Areas) == 0 {
		return readmodel.Area{}
	}

	return s.dataset.Areas[index%len(s.dataset.Areas)]
}

func seedCredentialNumber(professionalID string) string {
	return "REG-" + strings.ToUpper(strings.TrimSpace(professionalID)) + "-2026"
}

func seedProfessionalPhone(index int) string {
	return fmt.Sprintf("+628137000%04d", index+1)
}

func normalizePhone(value string) string {
	trimmed := strings.TrimSpace(value)
	var builder strings.Builder
	for index, runeValue := range trimmed {
		switch {
		case runeValue >= '0' && runeValue <= '9':
			builder.WriteRune(runeValue)
		case runeValue == '+' && index == 0:
			builder.WriteRune(runeValue)
		}
	}
	return builder.String()
}

func deriveChatParticipant(thread seedChatThreadRow) (string, string) {
	if strings.TrimSpace(thread.AppointmentID) != "" {
		return "appointment", thread.AppointmentID
	}
	if strings.TrimSpace(thread.ProfessionalID) != "" {
		return "professional", thread.ProfessionalID
	}
	return "conversation", thread.ID
}

func seededChatTimestamp(threadIndex int, messageIndex int) time.Time {
	offsetMinutes := (threadIndex * 15) + messageIndex
	return seededReferenceTime.Add(time.Duration(offsetMinutes) * time.Minute).UTC()
}

func normalizeChatSenderName(sender string) string {
	switch strings.ToLower(strings.TrimSpace(sender)) {
	case "professional":
		return "professional"
	case "system":
		return "system"
	default:
		return "user"
	}
}

func cloneAvailabilityRules(input map[string]readmodel.ProfessionalAvailabilityRules) map[string]readmodel.ProfessionalAvailabilityRules {
	if len(input) == 0 {
		return map[string]readmodel.ProfessionalAvailabilityRules{}
	}

	bytes, err := json.Marshal(input)
	if err != nil {
		return input
	}

	var output map[string]readmodel.ProfessionalAvailabilityRules
	if err := json.Unmarshal(bytes, &output); err != nil {
		return input
	}

	return output
}

func cloneAdminConsoleTables(input map[string][]map[string]any) map[string][]map[string]any {
	if len(input) == 0 {
		return map[string][]map[string]any{}
	}

	bytes, err := json.Marshal(input)
	if err != nil {
		return input
	}

	var output map[string][]map[string]any
	if err := json.Unmarshal(bytes, &output); err != nil {
		return input
	}

	return output
}

func jsonSeedFiles(dataDir string) ([]string, error) {
	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return nil, fmt.Errorf("list seed data files: %w", err)
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		files = append(files, entry.Name())
	}
	sort.Strings(files)
	return files, nil
}
