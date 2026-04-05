package seeding

import (
	"bytes"
	"strings"
	"testing"
)

func TestSummaryWriteReportIncludesScenarioMatrices(t *testing.T) {
	t.Parallel()

	summary := Summary{
		AdminAccesses: []AdminAccess{
			{AdminID: "adm-01", Email: "ops@bidanapp.id", FocusArea: "support"},
		},
		AdminScenarios: []AdminScenario{
			{AdminID: "adm-01", Email: "ops@bidanapp.id", FocusArea: "support"},
		},
		AppointmentStatusCounts: map[string]int{
			"confirmed": 1,
			"requested": 2,
		},
		BearerTokens: []BearerToken{
			{Role: "admin", Description: "Seeded admin API session", Token: "seed-admin-token"},
		},
		ChatMessageCount: 3,
		ChatThreadCount:  2,
		CoveredCities:    []string{"Bandung", "Jakarta Selatan", "Surabaya"},
		ManualQACases: []ManualQACase{
			{ID: "PUB-01"},
			{ID: "CUS-01"},
		},
		PublishedReadModelDocumentCount: 10,
		CustomerAccounts: []AccountLogin{
			{ID: "guest-primary", Phone: "+628123", Password: "Customer2026A"},
		},
		CustomerNotificationStateCount: 1,
		CustomerPreferenceCount:        1,
		CustomerScenarios: []CustomerScenario{
			{ConsumerID: "guest-primary", DisplayName: "Guest", ReadNotificationCount: 1, AppointmentStatuses: []string{"requested"}},
		},
		PortalReviewStatusCounts: map[string]int{
			"published": 1,
		},
		PortalStateCount: 1,
		ProfessionalAccounts: []AccountLogin{
			{ProfessionalID: "prof-01", Phone: "+628999", Password: "Professional2026A"},
		},
		ProfessionalNotificationStateCount: 1,
		ProfessionalScenarios: []ProfessionalScenario{
			{ProfessionalID: "prof-01", DisplayName: "Nadia", ReviewStatus: "published", CoverageReady: true, ServicesReady: true, HasFeaturedService: true, AppointmentStatuses: []string{"confirmed"}},
		},
		SampleEntityRefs: []SampleEntityRef{
			{Kind: "service", ID: "svc-01", Label: "Sample service"},
		},
		Scenario:                  "comprehensive",
		SupportedAppointmentModes: []string{"home_visit", "online", "onsite"},
		SupportedBookingFlows:     []string{"instant", "request"},
		SupportedServiceModes:     []string{"home_visit", "online", "onsite"},
		SupportTicketCount:        4,
	}

	var buffer bytes.Buffer
	if err := summary.WriteReport(&buffer); err != nil {
		t.Fatalf("WriteReport() error = %v", err)
	}

	report := buffer.String()
	for _, needle := range []string{
		"BidanApp comprehensive seed completed",
		"appointment_statuses: confirmed=1, requested=2",
		"covered_cities: Bandung, Jakarta Selatan, Surabaya",
		"service_modes: home_visit, online, onsite",
		"booking_flows: instant, request",
		"appointment_modes: home_visit, online, onsite",
		"manual_qa_cases: 2",
		"manual_qa_case_ids: PUB-01, CUS-01",
		"sample_entity_refs: 1",
		"customer scenario matrix",
		"professional scenario matrix",
		"admin identities",
	} {
		if !strings.Contains(report, needle) {
			t.Fatalf("expected report to contain %q, got:\n%s", needle, report)
		}
	}
}

func TestSummaryWriteJSONProducesIndentedPayload(t *testing.T) {
	t.Parallel()

	summary := Summary{
		Scenario: "comprehensive",
		CustomerScenarios: []CustomerScenario{
			{ConsumerID: "guest-primary"},
		},
	}

	var buffer bytes.Buffer
	if err := summary.WriteJSON(&buffer); err != nil {
		t.Fatalf("WriteJSON() error = %v", err)
	}

	json := buffer.String()
	for _, needle := range []string{`"scenario": "comprehensive"`, `"customerScenarios": [`} {
		if !strings.Contains(json, needle) {
			t.Fatalf("expected json to contain %q, got:\n%s", needle, json)
		}
	}
}
