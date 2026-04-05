package seeding

import (
	"context"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"testing"
)

func TestBuildManualQACasesProducesStableBilingualPack(t *testing.T) {
	t.Parallel()

	data := loadTestDataset(t)
	cases := buildManualQACases(data, buildSeedAppointments(data), manualQAConfig{
		AdminAccesses:        adminAccessesForQAMetadata(nil, data.AdminStaff),
		CustomerPassword:     defaultCustomerPassword,
		ProfessionalPassword: defaultProfessionalPassword,
	})

	wantIDs := []string{
		"PUB-01",
		"PUB-02",
		"PUB-03",
		"PUB-04",
		"CUS-01",
		"CUS-02",
		"CUS-03",
		"PRO-01",
		"PRO-02",
		"PRO-03",
		"PRO-04",
		"PRO-05",
		"PRO-06",
		"ADM-01",
		"ADM-02",
		"ADM-03",
		"ADM-04",
	}

	if got := manualQACaseIDs(cases); !reflect.DeepEqual(got, wantIDs) {
		t.Fatalf("manual QA case IDs mismatch\nwant: %#v\ngot:  %#v", wantIDs, got)
	}

	for _, qaCase := range cases {
		if strings.TrimSpace(qaCase.PersonaRole) == "" {
			t.Fatalf("case %s is missing personaRole", qaCase.ID)
		}
		if strings.TrimSpace(qaCase.TitleEn) == "" || strings.TrimSpace(qaCase.TitleId) == "" {
			t.Fatalf("case %s is missing bilingual titles", qaCase.ID)
		}
		if len(qaCase.StartRoutes) == 0 {
			t.Fatalf("case %s is missing startRoutes", qaCase.ID)
		}
		if len(qaCase.SampleEntityRefs) == 0 {
			t.Fatalf("case %s is missing sampleEntityRefs", qaCase.ID)
		}
		if len(qaCase.ChecksEn) == 0 || len(qaCase.ChecksId) == 0 {
			t.Fatalf("case %s is missing bilingual checks", qaCase.ID)
		}
		if len(qaCase.Tags) == 0 {
			t.Fatalf("case %s is missing tags", qaCase.ID)
		}
		if qaCase.PersonaRole != "public" && qaCase.Login == nil {
			t.Fatalf("case %s is missing login metadata", qaCase.ID)
		}
	}

	summaryRefs := collectSummarySampleEntityRefs(cases)
	if len(summaryRefs) < len(cases) {
		t.Fatalf("expected summary refs to cover the QA pack, got %d refs for %d cases", len(summaryRefs), len(cases))
	}
}

func TestManualQACasesReferenceExistingSeedEntities(t *testing.T) {
	t.Parallel()

	data := loadTestDataset(t)
	appointments := buildSeedAppointments(data)
	cases := buildManualQACases(data, appointments, manualQAConfig{
		AdminAccesses:        adminAccessesForQAMetadata(nil, data.AdminStaff),
		CustomerPassword:     defaultCustomerPassword,
		ProfessionalPassword: defaultProfessionalPassword,
	})

	serviceIDs := map[string]string{}
	for _, service := range data.Services {
		serviceIDs[service.ID] = service.Slug
	}

	professionalSlugsByID := map[string]string{}
	reviewStatusesByProfessionalID := map[string]string{}
	for index, professional := range data.Professionals {
		professionalSlugsByID[professional.ID] = professional.Slug
		reviewStatusesByProfessionalID[professional.ID] = portalReviewStatusForIndex(index)
	}

	appointmentByID := make(map[string]readmodelAppointmentRef, len(appointments))
	for _, appointment := range appointments {
		appointmentByID[appointment.ID] = readmodelAppointmentRef{
			status:      string(appointment.Status),
			mode:        appointment.RequestedMode,
			bookingFlow: appointment.BookingFlow,
		}
	}

	threadIDs := map[string]struct{}{}
	for _, thread := range data.ChatThreads {
		threadIDs[thread.ID] = struct{}{}
	}

	ticketIDs := map[string]struct{}{}
	for _, ticket := range data.SupportTickets {
		ticketIDs[ticket.ID] = struct{}{}
	}

	areaIDs := map[string]struct{}{}
	for _, area := range data.Areas {
		areaIDs[area.ID] = struct{}{}
	}

	runtimeSelectionIDs := map[string]struct{}{}
	for _, selection := range data.RuntimeSelections {
		runtimeSelectionIDs[selection.ID] = struct{}{}
	}

	supportedModes := setFromStrings(append(
		collectSupportedAppointmentModes(appointments),
		collectSupportedServiceModes(data.ServiceOfferings)...,
	))
	supportedFlows := setFromStrings(collectSupportedBookingFlows(data.ServiceOfferings))

	for _, qaCase := range cases {
		for _, startRoute := range qaCase.StartRoutes {
			validateDynamicRoute(t, qaCase.ID, startRoute, serviceIDs, professionalSlugsByID)
		}

		for _, ref := range qaCase.SampleEntityRefs {
			switch ref.Kind {
			case "runtime_selection":
				if _, ok := runtimeSelectionIDs[ref.ID]; !ok {
					t.Fatalf("case %s references unknown runtime selection %s", qaCase.ID, ref.ID)
				}
			case "area":
				if _, ok := areaIDs[ref.ID]; !ok {
					t.Fatalf("case %s references unknown area %s", qaCase.ID, ref.ID)
				}
			case "service":
				slug, ok := serviceIDs[ref.ID]
				if !ok {
					t.Fatalf("case %s references unknown service %s", qaCase.ID, ref.ID)
				}
				if ref.Slug != slug {
					t.Fatalf("case %s references service %s with mismatched slug %s", qaCase.ID, ref.ID, ref.Slug)
				}
				validateDynamicRoute(t, qaCase.ID, ref.Route, serviceIDs, professionalSlugsByID)
				if ref.Mode != "" {
					if _, ok := supportedModes[ref.Mode]; !ok {
						t.Fatalf("case %s references unsupported service mode %s", qaCase.ID, ref.Mode)
					}
				}
				if ref.BookingFlow != "" {
					if _, ok := supportedFlows[ref.BookingFlow]; !ok {
						t.Fatalf("case %s references unsupported booking flow %s", qaCase.ID, ref.BookingFlow)
					}
				}
			case "professional":
				slug, ok := professionalSlugsByID[ref.ID]
				if !ok {
					t.Fatalf("case %s references unknown professional %s", qaCase.ID, ref.ID)
				}
				if ref.Slug != slug {
					t.Fatalf("case %s references professional %s with mismatched slug %s", qaCase.ID, ref.ID, ref.Slug)
				}
				validateDynamicRoute(t, qaCase.ID, ref.Route, serviceIDs, professionalSlugsByID)
				if ref.ReviewStatus != "" && reviewStatusesByProfessionalID[ref.ID] != ref.ReviewStatus {
					t.Fatalf("case %s references professional %s with mismatched review status %s", qaCase.ID, ref.ID, ref.ReviewStatus)
				}
			case "appointment":
				record, ok := appointmentByID[ref.ID]
				if !ok {
					t.Fatalf("case %s references unknown appointment %s", qaCase.ID, ref.ID)
				}
				if ref.AppointmentStatus != "" && record.status != ref.AppointmentStatus {
					t.Fatalf("case %s references appointment %s with mismatched status %s", qaCase.ID, ref.ID, ref.AppointmentStatus)
				}
				if ref.Mode != "" && record.mode != ref.Mode {
					t.Fatalf("case %s references appointment %s with mismatched mode %s", qaCase.ID, ref.ID, ref.Mode)
				}
				if ref.BookingFlow != "" && record.bookingFlow != ref.BookingFlow {
					t.Fatalf("case %s references appointment %s with mismatched booking flow %s", qaCase.ID, ref.ID, ref.BookingFlow)
				}
			case "chat_thread":
				if _, ok := threadIDs[ref.ID]; !ok {
					t.Fatalf("case %s references unknown chat thread %s", qaCase.ID, ref.ID)
				}
			case "support_ticket":
				if _, ok := ticketIDs[ref.ID]; !ok {
					t.Fatalf("case %s references unknown support ticket %s", qaCase.ID, ref.ID)
				}
			default:
				t.Fatalf("case %s references unknown sampleEntityRef kind %s", qaCase.ID, ref.Kind)
			}
		}
	}
}

func TestManualQADocumentCaseIDsStayAligned(t *testing.T) {
	t.Parallel()

	data := loadTestDataset(t)
	wantIDs := manualQACaseIDs(buildManualQACases(data, buildSeedAppointments(data), manualQAConfig{
		AdminAccesses:        adminAccessesForQAMetadata(nil, data.AdminStaff),
		CustomerPassword:     defaultCustomerPassword,
		ProfessionalPassword: defaultProfessionalPassword,
	}))

	for _, relativePath := range []string{
		filepath.Join("..", "..", "..", "..", "docs", "manual-qa-playbook.md"),
		filepath.Join("..", "..", "..", "..", "docs", "manual-qa-playbook.id.md"),
		filepath.Join("..", "..", "..", "..", "docs", "qa-seed-matrix.md"),
	} {
		markdown, err := os.ReadFile(relativePath)
		if err != nil {
			t.Fatalf("read %s: %v", relativePath, err)
		}

		gotIDs := extractManualQACaseIDs(string(markdown))
		if !reflect.DeepEqual(gotIDs, wantIDs) {
			t.Fatalf("case IDs in %s are out of sync\nwant: %#v\ngot:  %#v", relativePath, wantIDs, gotIDs)
		}
	}
}

type readmodelAppointmentRef struct {
	bookingFlow string
	mode        string
	status      string
}

func loadTestDataset(t *testing.T) dataset {
	t.Helper()

	data, err := loadDataset(context.Background(), filepath.Join("..", "..", "seeddata"))
	if err != nil {
		t.Fatalf("load seed dataset: %v", err)
	}
	return data
}

func setFromStrings(values []string) map[string]struct{} {
	set := make(map[string]struct{}, len(values))
	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			continue
		}
		set[value] = struct{}{}
	}
	return set
}

func validateDynamicRoute(
	t *testing.T,
	caseID string,
	route string,
	serviceIDs map[string]string,
	professionalSlugsByID map[string]string,
) {
	t.Helper()

	route = strings.TrimSpace(route)
	if route == "" {
		return
	}

	if strings.HasPrefix(route, "/id/s/") {
		slug := strings.TrimPrefix(route, "/id/s/")
		if !containsValue(serviceIDs, slug) {
			t.Fatalf("case %s references unknown service route %s", caseID, route)
		}
	}

	if strings.HasPrefix(route, "/id/p/") {
		slug := strings.TrimPrefix(route, "/id/p/")
		if !containsValue(professionalSlugsByID, slug) {
			t.Fatalf("case %s references unknown professional route %s", caseID, route)
		}
	}
}

func containsValue(values map[string]string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func extractManualQACaseIDs(markdown string) []string {
	pattern := regexp.MustCompile(`\b(?:PUB|CUS|PRO|ADM)-\d{2}\b`)
	matches := pattern.FindAllString(markdown, -1)
	seen := map[string]struct{}{}
	ids := make([]string, 0, len(matches))

	for _, match := range matches {
		if _, ok := seen[match]; ok {
			continue
		}
		seen[match] = struct{}{}
		ids = append(ids, match)
	}

	sort.SliceStable(ids, func(left int, right int) bool {
		return manualQACaseSortKey(ids[left]) < manualQACaseSortKey(ids[right])
	})
	return ids
}

func manualQACaseSortKey(value string) string {
	switch {
	case strings.HasPrefix(value, "PUB-"):
		return "1-" + value
	case strings.HasPrefix(value, "CUS-"):
		return "2-" + value
	case strings.HasPrefix(value, "PRO-"):
		return "3-" + value
	case strings.HasPrefix(value, "ADM-"):
		return "4-" + value
	default:
		return "9-" + value
	}
}
