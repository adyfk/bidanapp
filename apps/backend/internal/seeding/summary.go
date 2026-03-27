package seeding

import (
	"encoding/json"
	"fmt"
	"io"
	"sort"
	"strings"
)

func (s Summary) WriteReport(writer io.Writer) error {
	if writer == nil {
		return nil
	}

	lines := []string{
		"BidanApp comprehensive seed completed",
		"scenario: " + s.Scenario,
		fmt.Sprintf("content_documents: %d", s.ContentDocumentCount),
		fmt.Sprintf("chat_threads: %d", s.ChatThreadCount),
		fmt.Sprintf("chat_messages: %d", s.ChatMessageCount),
		fmt.Sprintf("professional_portal_sessions: %d", s.PortalSessionCount),
		fmt.Sprintf("customer_preferences: %d", s.CustomerPreferenceCount),
		fmt.Sprintf("customer_notifications: %d", s.CustomerNotificationStateCount),
		fmt.Sprintf("professional_notifications: %d", s.ProfessionalNotificationStateCount),
		fmt.Sprintf("support_tickets: %d", s.SupportTicketCount),
		fmt.Sprintf("admin_console_tables: %d", s.AdminConsoleTableCount),
	}

	if len(s.PortalReviewStatusCounts) > 0 {
		statuses := make([]string, 0, len(s.PortalReviewStatusCounts))
		for status := range s.PortalReviewStatusCounts {
			statuses = append(statuses, status)
		}
		sort.Strings(statuses)

		parts := make([]string, 0, len(statuses))
		for _, status := range statuses {
			parts = append(parts, fmt.Sprintf("%s=%d", status, s.PortalReviewStatusCounts[status]))
		}

		lines = append(lines, "portal_review_statuses: "+strings.Join(parts, ", "))
	}

	if len(s.AppointmentStatusCounts) > 0 {
		statuses := make([]string, 0, len(s.AppointmentStatusCounts))
		for status := range s.AppointmentStatusCounts {
			statuses = append(statuses, status)
		}
		sort.Strings(statuses)

		parts := make([]string, 0, len(statuses))
		for _, status := range statuses {
			parts = append(parts, fmt.Sprintf("%s=%d", status, s.AppointmentStatusCounts[status]))
		}

		lines = append(lines, "appointment_statuses: "+strings.Join(parts, ", "))
	}

	if len(s.CoveredCities) > 0 {
		lines = append(lines, "covered_cities: "+strings.Join(s.CoveredCities, ", "))
	}

	if len(s.SupportedServiceModes) > 0 {
		lines = append(lines, "service_modes: "+strings.Join(s.SupportedServiceModes, ", "))
	}

	if len(s.SupportedBookingFlows) > 0 {
		lines = append(lines, "booking_flows: "+strings.Join(s.SupportedBookingFlows, ", "))
	}

	if len(s.SupportedAppointmentModes) > 0 {
		lines = append(lines, "appointment_modes: "+strings.Join(s.SupportedAppointmentModes, ", "))
	}

	if len(s.CustomerAccounts) > 0 {
		lines = append(lines, "")
		lines = append(lines, "customer logins")
		for _, account := range s.CustomerAccounts {
			lines = append(lines, fmt.Sprintf("- %s | %s | %s", account.ID, account.Phone, account.Password))
		}
	}

	if len(s.ProfessionalAccounts) > 0 {
		lines = append(lines, "")
		lines = append(lines, "professional logins")
		for _, account := range s.ProfessionalAccounts {
			lines = append(lines, fmt.Sprintf("- %s | %s | %s", account.ProfessionalID, account.Phone, account.Password))
		}
	}

	if len(s.AdminAccesses) > 0 {
		lines = append(lines, "")
		lines = append(lines, "admin identities")
		for _, admin := range s.AdminAccesses {
			lines = append(lines, fmt.Sprintf("- %s | %s | %s", admin.AdminID, admin.Email, admin.FocusArea))
		}
		lines = append(lines, "admin UI login still uses the password configured in ADMIN_CONSOLE_CREDENTIALS_JSON")
	}

	if len(s.BearerTokens) > 0 {
		lines = append(lines, "")
		lines = append(lines, "seeded bearer tokens")
		for _, token := range s.BearerTokens {
			lines = append(lines, fmt.Sprintf("- %s | %s | %s", token.Role, token.Description, token.Token))
		}
	}

	if len(s.CustomerScenarios) > 0 {
		lines = append(lines, "")
		lines = append(lines, "customer scenario matrix")
		for _, scenario := range s.CustomerScenarios {
			lines = append(lines, fmt.Sprintf("- %s | %s | read_notifications=%d | statuses=%s", scenario.ConsumerID, scenario.DisplayName, scenario.ReadNotificationCount, formatScenarioStatuses(scenario.AppointmentStatuses)))
		}
	}

	if len(s.ProfessionalScenarios) > 0 {
		lines = append(lines, "")
		lines = append(lines, "professional scenario matrix")
		for _, scenario := range s.ProfessionalScenarios {
			lines = append(lines, fmt.Sprintf("- %s | %s | review=%s | coverage_ready=%t | services_ready=%t | featured_service=%t | statuses=%s", scenario.ProfessionalID, scenario.DisplayName, scenario.ReviewStatus, scenario.CoverageReady, scenario.ServicesReady, scenario.HasFeaturedService, formatScenarioStatuses(scenario.AppointmentStatuses)))
		}
	}

	_, err := io.WriteString(writer, strings.Join(lines, "\n")+"\n")
	return err
}

func (s Summary) WriteJSON(writer io.Writer) error {
	if writer == nil {
		return nil
	}

	encoder := json.NewEncoder(writer)
	encoder.SetIndent("", "  ")
	return encoder.Encode(s)
}

func formatScenarioStatuses(statuses []string) string {
	if len(statuses) == 0 {
		return "none"
	}
	return strings.Join(statuses, ",")
}
