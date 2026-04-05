package seeding

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"bidanapp/apps/backend/internal/modules/clientstate"
	"bidanapp/apps/backend/internal/modules/readmodel"
)

var adminConsoleTableFiles = []string{
	"admin_staff",
	"app_runtime_selections",
	"appointments",
	"consumers",
	"home_feed_snapshots",
	"professional_service_offerings",
	"professionals",
	"reference_appointment_statuses",
	"service_categories",
	"services",
	"user_contexts",
}

type seedConsumerRow struct {
	ID    string `json:"id"`
	Index int    `json:"index"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type seedUserContextRow struct {
	ID                string  `json:"id"`
	Index             int     `json:"index"`
	OnlineStatusLabel string  `json:"onlineStatusLabel"`
	SelectedAreaID    string  `json:"selectedAreaId"`
	UserLatitude      float64 `json:"userLatitude"`
	UserLongitude     float64 `json:"userLongitude"`
}

type seedRuntimeSelectionRow struct {
	ActiveHomeFeedID     string `json:"activeHomeFeedId"`
	ActiveMediaPresetID  string `json:"activeMediaPresetId"`
	CurrentConsumerID    string `json:"currentConsumerId"`
	CurrentDateTimeISO   string `json:"currentDateTimeIso"`
	CurrentUserContextID string `json:"currentUserContextId"`
	ID                   string `json:"id"`
	Index                int    `json:"index"`
}

type seedChatThreadRow struct {
	AppointmentID    string `json:"appointmentId"`
	AutoReplyText    string `json:"autoReplyText"`
	DayLabel         string `json:"dayLabel"`
	ID               string `json:"id"`
	Index            int    `json:"index"`
	InputPlaceholder string `json:"inputPlaceholder"`
	ProfessionalID   string `json:"professionalId"`
	ThreadType       string `json:"threadType"`
}

type seedChatMessageRow struct {
	ID              string `json:"id"`
	Index           int    `json:"index"`
	IsRead          bool   `json:"isRead"`
	Sender          string `json:"sender"`
	SourceMessageID int    `json:"sourceMessageId"`
	Text            string `json:"text"`
	ThreadID        string `json:"threadId"`
	TimeLabel       string `json:"timeLabel"`
}

type seedServiceOfferingRow struct {
	BookingFlow       string `json:"bookingFlow"`
	DefaultMode       string `json:"defaultMode"`
	Duration          string `json:"duration"`
	ID                string `json:"id"`
	Index             int    `json:"index"`
	Price             string `json:"price"`
	ProfessionalID    string `json:"professionalId"`
	ServiceID         string `json:"serviceId"`
	Source            string `json:"source"`
	Summary           string `json:"summary"`
	SupportsHomeVisit bool   `json:"supportsHomeVisit"`
	SupportsOnline    bool   `json:"supportsOnline"`
	SupportsOnsite    bool   `json:"supportsOnsite"`
}

type seedAdminStaffRow struct {
	Email     string `json:"email"`
	FocusArea string `json:"focusArea"`
	ID        string `json:"id"`
	Index     int    `json:"index"`
	Name      string `json:"name"`
}

type dataset struct {
	AdminConsoleTables map[string][]map[string]any
	AdminStaff         []seedAdminStaffRow
	Appointments       []readmodel.AppointmentSeed
	Areas              []readmodel.Area
	ChatMessages       []seedChatMessageRow
	ChatThreads        []seedChatThreadRow
	Consumers          []seedConsumerRow
	Professionals      []readmodel.Professional
	RuntimeSelections  []seedRuntimeSelectionRow
	Services           []readmodel.GlobalService
	ServiceOfferings   []seedServiceOfferingRow
	SupportTickets     []clientstate.SupportTicketData
	UserContexts       []seedUserContextRow
}

func loadDataset(ctx context.Context, dataDir string) (dataset, error) {
	readModel := readmodel.NewService(dataDir, nil)

	catalog, err := readModel.Catalog(ctx)
	if err != nil {
		return dataset{}, fmt.Errorf("load catalog dataset: %w", err)
	}

	appointments, err := readModel.Appointments(ctx)
	if err != nil {
		return dataset{}, fmt.Errorf("load appointment dataset: %w", err)
	}

	consumers, err := readSeedJSON[[]seedConsumerRow](dataDir, "consumers.json")
	if err != nil {
		return dataset{}, err
	}

	userContexts, err := readSeedJSON[[]seedUserContextRow](dataDir, "user_contexts.json")
	if err != nil {
		return dataset{}, err
	}

	runtimeSelections, err := readSeedJSON[[]seedRuntimeSelectionRow](dataDir, "app_runtime_selections.json")
	if err != nil {
		return dataset{}, err
	}

	chatThreads, err := readSeedJSON[[]seedChatThreadRow](dataDir, "chat_threads.json")
	if err != nil {
		return dataset{}, err
	}

	chatMessages, err := readSeedJSON[[]seedChatMessageRow](dataDir, "chat_messages.json")
	if err != nil {
		return dataset{}, err
	}

	serviceOfferings, err := readSeedJSON[[]seedServiceOfferingRow](dataDir, "professional_service_offerings.json")
	if err != nil {
		return dataset{}, err
	}

	supportTickets, err := readSeedJSON[[]clientstate.SupportTicketData](dataDir, "support_tickets.json")
	if err != nil {
		return dataset{}, err
	}

	adminStaff, err := readSeedJSON[[]seedAdminStaffRow](dataDir, "admin_staff.json")
	if err != nil {
		return dataset{}, err
	}

	adminConsoleTables := make(map[string][]map[string]any, len(adminConsoleTableFiles))
	for _, tableName := range adminConsoleTableFiles {
		rows, err := readTableRows(dataDir, tableName+".json")
		if err != nil {
			return dataset{}, err
		}
		adminConsoleTables[tableName] = rows
	}

	sort.SliceStable(consumers, func(leftIndex int, rightIndex int) bool {
		return consumers[leftIndex].Index < consumers[rightIndex].Index
	})
	sort.SliceStable(userContexts, func(leftIndex int, rightIndex int) bool {
		return userContexts[leftIndex].Index < userContexts[rightIndex].Index
	})
	sort.SliceStable(runtimeSelections, func(leftIndex int, rightIndex int) bool {
		return runtimeSelections[leftIndex].Index < runtimeSelections[rightIndex].Index
	})
	sort.SliceStable(chatThreads, func(leftIndex int, rightIndex int) bool {
		return chatThreads[leftIndex].Index < chatThreads[rightIndex].Index
	})
	sort.SliceStable(chatMessages, func(leftIndex int, rightIndex int) bool {
		if chatMessages[leftIndex].ThreadID == chatMessages[rightIndex].ThreadID {
			return chatMessages[leftIndex].Index < chatMessages[rightIndex].Index
		}
		return chatMessages[leftIndex].ThreadID < chatMessages[rightIndex].ThreadID
	})
	sort.SliceStable(serviceOfferings, func(leftIndex int, rightIndex int) bool {
		if serviceOfferings[leftIndex].ProfessionalID == serviceOfferings[rightIndex].ProfessionalID {
			return serviceOfferings[leftIndex].Index < serviceOfferings[rightIndex].Index
		}
		return serviceOfferings[leftIndex].ProfessionalID < serviceOfferings[rightIndex].ProfessionalID
	})

	return dataset{
		AdminConsoleTables: adminConsoleTables,
		AdminStaff:         adminStaff,
		Appointments:       appointments.Appointments,
		Areas:              catalog.Areas,
		ChatMessages:       chatMessages,
		ChatThreads:        chatThreads,
		Consumers:          consumers,
		Professionals:      catalog.Professionals,
		RuntimeSelections:  runtimeSelections,
		Services:           catalog.Services,
		ServiceOfferings:   serviceOfferings,
		SupportTickets:     supportTickets,
		UserContexts:       userContexts,
	}, nil
}

func readSeedJSON[T any](dataDir string, filename string) (T, error) {
	var payload T

	path := filepath.Join(dataDir, filename)
	bytes, err := os.ReadFile(path)
	if err != nil {
		return payload, fmt.Errorf("read %s: %w", filename, err)
	}

	if err := json.Unmarshal(bytes, &payload); err != nil {
		return payload, fmt.Errorf("decode %s: %w", filename, err)
	}

	return payload, nil
}

func readTableRows(dataDir string, filename string) ([]map[string]any, error) {
	rows, err := readSeedJSON[[]map[string]any](dataDir, filename)
	if err != nil {
		return nil, err
	}

	for index, row := range rows {
		if row == nil {
			rows[index] = map[string]any{}
		}
	}

	return rows, nil
}

func datasetScenarioName(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	if value == "" {
		return "comprehensive"
	}
	return value
}
