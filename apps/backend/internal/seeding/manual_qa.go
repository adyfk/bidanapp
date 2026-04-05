package seeding

import (
	"fmt"
	"strings"

	"bidanapp/apps/backend/internal/modules/clientstate"
	"bidanapp/apps/backend/internal/modules/readmodel"
)

type ManualQALogin struct {
	Route             string `json:"route"`
	IdentifierType    string `json:"identifierType"`
	Identifier        string `json:"identifier"`
	Password          string `json:"password,omitempty"`
	PasswordReference string `json:"passwordReference,omitempty"`
	NotesEn           string `json:"notesEn,omitempty"`
	NotesId           string `json:"notesId,omitempty"`
}

type SampleEntityRef struct {
	Kind              string `json:"kind"`
	ID                string `json:"id,omitempty"`
	Slug              string `json:"slug,omitempty"`
	Label             string `json:"label"`
	Route             string `json:"route,omitempty"`
	AppointmentStatus string `json:"appointmentStatus,omitempty"`
	ReviewStatus      string `json:"reviewStatus,omitempty"`
	Mode              string `json:"mode,omitempty"`
	BookingFlow       string `json:"bookingFlow,omitempty"`
}

type ManualQACase struct {
	ID                 string            `json:"id"`
	PersonaRole        string            `json:"personaRole"`
	PersonaID          string            `json:"personaId,omitempty"`
	PersonaDisplayName string            `json:"personaDisplayName,omitempty"`
	TitleEn            string            `json:"titleEn"`
	TitleId            string            `json:"titleId"`
	StartRoutes        []string          `json:"startRoutes"`
	Login              *ManualQALogin    `json:"login,omitempty"`
	SampleEntityRefs   []SampleEntityRef `json:"sampleEntityRefs"`
	ChecksEn           []string          `json:"checksEn"`
	ChecksId           []string          `json:"checksId"`
	Tags               []string          `json:"tags"`
}

type manualQAConfig struct {
	AdminAccesses        []AdminAccess
	CustomerPassword     string
	ProfessionalPassword string
}

func buildManualQACases(
	data dataset,
	appointments []readmodel.AppointmentSeed,
	config manualQAConfig,
) []ManualQACase {
	userContextsByID := userContextsByID(data.UserContexts)
	adminNamesByID := adminNamesByID(data.AdminStaff)
	adminAccesses := adminAccessesForQAMetadata(config.AdminAccesses, data.AdminStaff)

	publishedProfessional, publishedIndex, _ := professionalByReviewStatus(data.Professionals, "published")
	publishedService, publishedOffering, _ := firstServiceForProfessional(
		publishedProfessional.ID,
		data.ServiceOfferings,
		data.Services,
	)
	publishedProfessionalRoute := professionalPublicRoute(publishedProfessional.Slug)
	publishedServiceRoute := servicePublicRoute(publishedService.Slug)

	runtimeSelection, _, runtimeArea, _ := primaryRuntimeSelection(data.RuntimeSelections, userContextsByID, data.Areas)

	alya, _ := consumerByID(data.Consumers, "guest-primary")
	alyaActiveAppointment, _ := appointmentByConsumerAndStatus(appointments, alya.ID, readmodel.AppointmentStatusInService)
	if alyaActiveAppointment.ID == "" {
		alyaActiveAppointment, _ = appointmentByConsumerAndStatus(appointments, alya.ID, readmodel.AppointmentStatusConfirmed)
	}
	alyaSecondaryAppointment, _ := appointmentByConsumerAndStatus(appointments, alya.ID, readmodel.AppointmentStatusConfirmed)
	alyaChatThread, _ := appointmentThreadByAppointmentID(data.ChatThreads, alyaActiveAppointment.ID)

	nadia, _ := consumerByID(data.Consumers, "ibu-nadia")
	nadiaRequestedAppointment, _ := appointmentByConsumerAndStatus(appointments, nadia.ID, readmodel.AppointmentStatusRequested)

	hendra, _ := consumerByID(data.Consumers, "mr-hendra")
	hendraCompletedAppointment, _ := appointmentByConsumerAndStatus(appointments, hendra.ID, readmodel.AppointmentStatusCompleted)
	hendraCancelledAppointment, _ := appointmentByConsumerAndStatus(appointments, hendra.ID, readmodel.AppointmentStatusCancelled)

	omeya, omeyaIndex, _ := professionalByReviewStatus(data.Professionals, "submitted")
	rani, raniIndex, _ := professionalByReviewStatus(data.Professionals, "changes_requested")
	martha, marthaIndex, _ := professionalByReviewStatus(data.Professionals, "verified")
	alex, alexIndex, _ := professionalByReviewStatus(data.Professionals, "draft")
	dimas, dimasIndex, _ := professionalByReviewStatus(data.Professionals, "ready_for_review")

	omeyaService, omeyaOffering, _ := firstServiceForProfessional(omeya.ID, data.ServiceOfferings, data.Services)
	raniService, raniOffering, _ := firstServiceForProfessional(rani.ID, data.ServiceOfferings, data.Services)
	marthaService, marthaOffering, _ := firstServiceForProfessional(martha.ID, data.ServiceOfferings, data.Services)
	dimasService, dimasOffering, _ := firstServiceForProfessional(dimas.ID, data.ServiceOfferings, data.Services)

	omeyaPhone := normalizePhone(seedProfessionalPhone(omeyaIndex))
	raniPhone := normalizePhone(seedProfessionalPhone(raniIndex))
	marthaPhone := normalizePhone(seedProfessionalPhone(marthaIndex))
	alexPhone := normalizePhone(seedProfessionalPhone(alexIndex))
	dimasPhone := normalizePhone(seedProfessionalPhone(dimasIndex))

	supportUrgent, _ := supportTicketByUrgency(data.SupportTickets, "urgent")
	supportHigh, _ := supportTicketByUrgency(data.SupportTickets, "high")
	supportNormal, _ := supportTicketByUrgency(data.SupportTickets, "normal")
	reviewTicket, _ := supportTicketByAdminID(data.SupportTickets, "adm-02")
	opsTicket, _ := supportTicketByAdminID(data.SupportTickets, "adm-03")
	catalogTicket, _ := supportTicketByAdminID(data.SupportTickets, "adm-04")

	adminByID := make(map[string]AdminAccess, len(adminAccesses))
	for _, access := range adminAccesses {
		adminByID[access.AdminID] = access
	}

	caseList := []ManualQACase{
		{
			ID:          "PUB-01",
			PersonaRole: "public",
			TitleEn:     "Locale switch and onboarding entry",
			TitleId:     "Perpindahan bahasa dan entry onboarding",
			StartRoutes: []string{"/id", "/en"},
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				runtimeSelectionRef(runtimeSelection, runtimeArea),
				areaSampleRef(runtimeArea, "Active visitor area"),
			}),
			ChecksEn: []string{
				"Open both locale entry routes and verify onboarding renders without development wording or broken navigation.",
				"Switch language and confirm the route and copy change cleanly while the visitor flow stays intact.",
				fmt.Sprintf("Keep the runtime pointed at the seeded %s context so later public and customer checks stay deterministic.", runtimeArea.Label),
			},
			ChecksId: []string{
				"Buka dua entry route locale dan pastikan onboarding tampil bersih tanpa wording development atau navigasi rusak.",
				"Pindahkan bahasa dan pastikan route serta copy berubah dengan rapi tanpa merusak flow visitor.",
				fmt.Sprintf("Pertahankan runtime pada context seed %s supaya pengecekan public dan customer berikutnya tetap deterministik.", runtimeArea.Label),
			},
			Tags: []string{"public", "locale", "onboarding"},
		},
		{
			ID:          "PUB-02",
			PersonaRole: "public",
			TitleEn:     "Public discovery surfaces",
			TitleId:     "Surface discovery publik",
			StartRoutes: []string{"/id/home", "/id/explore", "/id/services"},
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				serviceSampleRef(publishedService, publishedServiceRoute, publishedOffering, "Discovery reference service"),
				professionalSampleRef(publishedProfessional, publishedProfessionalRoute, "published", "Discovery reference professional"),
			}),
			ChecksEn: []string{
				"Open home, explore, and services as a visitor and verify catalog sections hydrate from the seeded backend runtime.",
				fmt.Sprintf("Use %s as the anchor service and confirm discovery cards stay consistent across list and detail surfaces.", publishedService.Name),
				fmt.Sprintf("Use %s as the anchor professional and verify public trust, badges, and CTA states remain coherent.", publishedProfessional.Name),
			},
			ChecksId: []string{
				"Buka home, explore, dan services sebagai visitor lalu pastikan section katalog ter-hydrate dari runtime backend seed.",
				fmt.Sprintf("Gunakan %s sebagai layanan acuan dan pastikan kartu discovery konsisten antara list dan detail.", publishedService.Name),
				fmt.Sprintf("Gunakan %s sebagai profesional acuan dan pastikan trust publik, badge, dan state CTA tetap koheren.", publishedProfessional.Name),
			},
			Tags: []string{"public", "catalog", "discovery"},
		},
		{
			ID:          "PUB-03",
			PersonaRole: "public",
			TitleEn:     "Published professional detail",
			TitleId:     "Detail profesional yang sudah published",
			StartRoutes: []string{publishedProfessionalRoute},
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(publishedProfessional, publishedProfessionalRoute, "published", "Published detail target"),
				serviceSampleRef(publishedService, publishedServiceRoute, publishedOffering, "Published detail primary service"),
			}),
			ChecksEn: []string{
				fmt.Sprintf("Open %s and verify the published profile renders as a live public listing.", publishedProfessionalRoute),
				fmt.Sprintf("Confirm %s shows trust, services, and booking entrypoints that look production-ready.", publishedProfessional.Name),
				fmt.Sprintf("Verify %s is visible as a compatible service option on the published profile.", publishedService.Name),
			},
			ChecksId: []string{
				fmt.Sprintf("Buka %s dan pastikan profil published tampil sebagai listing publik yang hidup.", publishedProfessionalRoute),
				fmt.Sprintf("Pastikan %s menampilkan trust, layanan, dan entry booking yang terasa siap produksi.", publishedProfessional.Name),
				fmt.Sprintf("Verifikasi %s tampil sebagai opsi layanan yang kompatibel pada profil published.", publishedService.Name),
			},
			Tags: []string{"public", "professional", "published"},
		},
		{
			ID:          "PUB-04",
			PersonaRole: "public",
			TitleEn:     "Service-first discovery routing",
			TitleId:     "Routing discovery dari halaman layanan",
			StartRoutes: []string{publishedServiceRoute},
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				serviceSampleRef(publishedService, publishedServiceRoute, publishedOffering, "Service-first route target"),
				professionalSampleRef(publishedProfessional, publishedProfessionalRoute, "published", "Expected professional continuation"),
			}),
			ChecksEn: []string{
				fmt.Sprintf("Open %s and verify the seeded service detail page resolves cleanly.", publishedServiceRoute),
				fmt.Sprintf("Continue into professional selection and confirm the flow stays compatible with %s.", publishedProfessional.Name),
				"Verify delivery mode and booking-flow messaging stay coherent when the user moves from service detail into the booking surface.",
			},
			ChecksId: []string{
				fmt.Sprintf("Buka %s dan pastikan halaman detail layanan seed terbuka dengan bersih.", publishedServiceRoute),
				fmt.Sprintf("Lanjutkan ke pemilihan profesional dan pastikan flow tetap kompatibel dengan %s.", publishedProfessional.Name),
				"Pastikan pesan mode layanan dan booking flow tetap koheren saat user berpindah dari detail layanan ke surface booking.",
			},
			Tags: []string{"public", "service", "routing"},
		},
		{
			ID:                 "CUS-01",
			PersonaRole:        "customer",
			PersonaID:          alya.ID,
			PersonaDisplayName: alya.Name,
			TitleEn:            "Active lifecycle and seeded chat",
			TitleId:            "Lifecycle aktif dan chat seed",
			StartRoutes:        []string{"/id/auth/customer", "/id/profile", "/id/notifications", "/id/appointments"},
			Login: customerLogin(
				normalizePhone(alya.Phone),
				config.CustomerPassword,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				appointmentSampleRef(alyaActiveAppointment, "Primary active appointment"),
				appointmentSampleRef(alyaSecondaryAppointment, "Secondary active appointment"),
				chatThreadSampleRef(alyaChatThread, "Primary seeded appointment chat"),
			}),
			ChecksEn: []string{
				"Sign in as Alya Rahma and verify profile plus session state hydrate immediately after login.",
				"Open notifications and confirm some appointment alerts are already read while active appointment alerts remain visible.",
				fmt.Sprintf("Inspect %s and the seeded thread %s before sending a new chat message.", alyaActiveAppointment.ID, alyaChatThread.ID),
			},
			ChecksId: []string{
				"Login sebagai Alya Rahma lalu pastikan profil serta state session langsung ter-hydrate setelah masuk.",
				"Buka notifikasi dan pastikan sebagian alert appointment sudah terbaca sementara alert appointment aktif masih terlihat.",
				fmt.Sprintf("Periksa %s dan thread seed %s sebelum mengirim pesan chat baru.", alyaActiveAppointment.ID, alyaChatThread.ID),
			},
			Tags: []string{"customer", "profile", "notifications", "appointments", "chat"},
		},
		{
			ID:                 "CUS-02",
			PersonaRole:        "customer",
			PersonaID:          nadia.ID,
			PersonaDisplayName: nadia.Name,
			TitleEn:            "Unread notifications and requested state",
			TitleId:            "Notifikasi unread dan state requested",
			StartRoutes:        []string{"/id/auth/customer", "/id/notifications", "/id/appointments"},
			Login: customerLogin(
				normalizePhone(nadia.Phone),
				config.CustomerPassword,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				appointmentSampleRef(nadiaRequestedAppointment, "Unread request-state appointment"),
			}),
			ChecksEn: []string{
				"Sign in as Nadia Prameswari and verify unread badges still appear because no relevant customer notifications were pre-read.",
				fmt.Sprintf("Open %s and verify the requested-state copy, next steps, and cards stay aligned with backend state.", nadiaRequestedAppointment.ID),
				"Edit customer profile data and confirm the mutation persists after refresh.",
			},
			ChecksId: []string{
				"Login sebagai Nadia Prameswari lalu pastikan badge unread masih muncul karena notifikasi relevan belum ditandai terbaca.",
				fmt.Sprintf("Buka %s dan pastikan copy, langkah berikutnya, serta kartu pada state requested tetap selaras dengan state backend.", nadiaRequestedAppointment.ID),
				"Ubah data profil customer dan pastikan mutasinya tetap tersimpan setelah refresh.",
			},
			Tags: []string{"customer", "notifications", "requested", "profile"},
		},
		{
			ID:                 "CUS-03",
			PersonaRole:        "customer",
			PersonaID:          hendra.ID,
			PersonaDisplayName: hendra.Name,
			TitleEn:            "History and resolved journeys",
			TitleId:            "Riwayat dan journey yang sudah selesai",
			StartRoutes:        []string{"/id/auth/customer", "/id/appointments", "/id/services", publishedProfessionalRoute},
			Login: customerLogin(
				normalizePhone(hendra.Phone),
				config.CustomerPassword,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				appointmentSampleRef(hendraCompletedAppointment, "History completed appointment"),
				appointmentSampleRef(hendraCancelledAppointment, "History cancelled appointment"),
				professionalSampleRef(publishedProfessional, publishedProfessionalRoute, "published", "Stable public detail reference"),
			}),
			ChecksEn: []string{
				"Sign in as Hendra Saputra and focus on completed and cancelled appointment history.",
				fmt.Sprintf("Verify the closed-journey timeline for %s and %s stays coherent after refresh.", hendraCompletedAppointment.ID, hendraCancelledAppointment.ID),
				"Switch between services and professional detail and confirm favorites plus resolved location remain stable.",
			},
			ChecksId: []string{
				"Login sebagai Hendra Saputra dan fokus pada riwayat appointment completed serta cancelled.",
				fmt.Sprintf("Pastikan timeline journey tertutup untuk %s dan %s tetap koheren setelah refresh.", hendraCompletedAppointment.ID, hendraCancelledAppointment.ID),
				"Pindah antara halaman layanan dan detail profesional lalu pastikan favorit serta lokasi tersimpan tetap stabil.",
			},
			Tags: []string{"customer", "history", "completed", "cancelled"},
		},
		{
			ID:                 "PRO-01",
			PersonaRole:        "professional",
			PersonaID:          publishedProfessional.ID,
			PersonaDisplayName: publishedProfessional.Name,
			TitleEn:            "Published professional portal",
			TitleId:            "Portal profesional published",
			StartRoutes:        []string{"/id/for-professionals", "/id/for-professionals/dashboard/requests", "/id/for-professionals/dashboard/services", "/id/for-professionals/dashboard/coverage", "/id/for-professionals/dashboard/trust"},
			Login: professionalLogin(
				normalizePhone(seedProfessionalPhone(publishedIndex)),
				config.ProfessionalPassword,
				publishedProfessional.Name,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(publishedProfessional, publishedProfessionalRoute, "published", "Published portal owner"),
				serviceSampleRef(publishedService, publishedServiceRoute, publishedOffering, "Published portal primary service"),
			}),
			ChecksEn: []string{
				"Sign in as Clara Wijaya and verify dashboard hydration comes from backend state instead of browser-owned drafts.",
				"Open requests, services, trust, and coverage tabs and confirm edits persist after refresh.",
				fmt.Sprintf("Verify the public route %s reflects the published portal state.", publishedProfessionalRoute),
			},
			ChecksId: []string{
				"Login sebagai Clara Wijaya lalu pastikan dashboard ter-hydrate dari backend state, bukan draft milik browser.",
				"Buka tab requests, services, trust, dan coverage lalu pastikan edit tersimpan setelah refresh.",
				fmt.Sprintf("Pastikan route publik %s merefleksikan state portal yang published.", publishedProfessionalRoute),
			},
			Tags: []string{"professional", "published", "portal", "public"},
		},
		{
			ID:                 "PRO-02",
			PersonaRole:        "professional",
			PersonaID:          omeya.ID,
			PersonaDisplayName: omeya.Name,
			TitleEn:            "Submitted review gate",
			TitleId:            "Gate review submitted",
			StartRoutes:        []string{"/id/for-professionals", "/id/for-professionals/dashboard/overview"},
			Login: professionalLogin(
				omeyaPhone,
				config.ProfessionalPassword,
				omeya.Name,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(omeya, "", "submitted", "Submitted professional"),
				serviceSampleRef(omeyaService, "", omeyaOffering, "Submitted portal service"),
			}),
			ChecksEn: []string{
				"Sign in as Omeya Sen and verify the portal clearly shows submitted status.",
				"Confirm editing and publish actions stay appropriately gated while the profile is waiting for admin review.",
				"Verify the seeded service configuration remains readable even while review actions are locked.",
			},
			ChecksId: []string{
				"Login sebagai Omeya Sen lalu pastikan portal menampilkan status submitted dengan jelas.",
				"Konfirmasi bahwa aksi edit dan publish tetap tergating dengan tepat saat profil menunggu review admin.",
				"Pastikan konfigurasi layanan seed tetap dapat dibaca walaupun aksi review sedang terkunci.",
			},
			Tags: []string{"professional", "submitted", "review"},
		},
		{
			ID:                 "PRO-03",
			PersonaRole:        "professional",
			PersonaID:          rani.ID,
			PersonaDisplayName: rani.Name,
			TitleEn:            "Changes requested revision flow",
			TitleId:            "Flow revisi changes requested",
			StartRoutes:        []string{"/id/for-professionals", "/id/for-professionals/dashboard/portfolio", "/id/for-professionals/dashboard/coverage"},
			Login: professionalLogin(
				raniPhone,
				config.ProfessionalPassword,
				rani.Name,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(rani, "", "changes_requested", "Changes requested professional"),
				serviceSampleRef(raniService, "", raniOffering, "Revision candidate service"),
			}),
			ChecksEn: []string{
				"Sign in as Rani Hartati and confirm admin feedback is visible on the changes-requested profile.",
				"Edit coverage or portfolio data and verify the portal accepts the revision flow cleanly.",
				"Resubmit and confirm the review state transitions away from changes requested as expected.",
			},
			ChecksId: []string{
				"Login sebagai Rani Hartati dan pastikan feedback admin terlihat pada profil changes requested.",
				"Ubah data coverage atau portofolio lalu pastikan portal menerima flow revisi dengan bersih.",
				"Resubmit dan konfirmasi state review berpindah dari changes requested sesuai harapan.",
			},
			Tags: []string{"professional", "changes_requested", "review", "revision"},
		},
		{
			ID:                 "PRO-04",
			PersonaRole:        "professional",
			PersonaID:          martha.ID,
			PersonaDisplayName: martha.Name,
			TitleEn:            "Verified pre-publish state",
			TitleId:            "State verified sebelum publish",
			StartRoutes:        []string{"/id/for-professionals", "/id/for-professionals/dashboard/trust"},
			Login: professionalLogin(
				marthaPhone,
				config.ProfessionalPassword,
				martha.Name,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(martha, "", "verified", "Verified professional"),
				serviceSampleRef(marthaService, "", marthaOffering, "Verified portal service"),
			}),
			ChecksEn: []string{
				"Sign in as Martha Teria and verify the verified review outcome is visible in trust or review surfaces.",
				"Confirm the profile is ready for final publish action without regressing portal data.",
				"Verify professional notifications include the seeded verified review outcome.",
			},
			ChecksId: []string{
				"Login sebagai Martha Teria lalu pastikan outcome review verified terlihat di surface trust atau review.",
				"Konfirmasi profil siap untuk aksi publish final tanpa meregresi data portal.",
				"Pastikan notifikasi profesional memuat outcome review verified yang sudah di-seed.",
			},
			Tags: []string{"professional", "verified", "trust", "review"},
		},
		{
			ID:                 "PRO-05",
			PersonaRole:        "professional",
			PersonaID:          alex.ID,
			PersonaDisplayName: alex.Name,
			TitleEn:            "Draft onboarding gaps",
			TitleId:            "Kesenjangan onboarding draft",
			StartRoutes:        []string{"/id/for-professionals", "/id/for-professionals/dashboard/services", "/id/for-professionals/dashboard/coverage"},
			Login: professionalLogin(
				alexPhone,
				config.ProfessionalPassword,
				alex.Name,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(alex, "", "draft", "Draft professional"),
			}),
			ChecksEn: []string{
				"Sign in as Alex Ben and verify the draft account still shows empty services and empty coverage prompts.",
				"Confirm onboarding guidance remains visible instead of looking like a published or review-ready profile.",
				"Verify the draft state persists after refresh.",
			},
			ChecksId: []string{
				"Login sebagai Alex Ben lalu pastikan akun draft masih menampilkan prompt layanan kosong dan coverage kosong.",
				"Konfirmasi panduan onboarding tetap terlihat dan tidak tampak seperti profil published atau siap review.",
				"Pastikan state draft tetap bertahan setelah refresh.",
			},
			Tags: []string{"professional", "draft", "onboarding"},
		},
		{
			ID:                 "PRO-06",
			PersonaRole:        "professional",
			PersonaID:          dimas.ID,
			PersonaDisplayName: dimas.Name,
			TitleEn:            "Ready-for-review warning path",
			TitleId:            "Path warning ready for review",
			StartRoutes:        []string{"/id/for-professionals", "/id/for-professionals/dashboard/services", "/id/for-professionals/dashboard/overview"},
			Login: professionalLogin(
				dimasPhone,
				config.ProfessionalPassword,
				dimas.Name,
			),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(dimas, "", "ready_for_review", "Ready-for-review professional"),
				serviceSampleRef(dimasService, "", dimasOffering, "Ready-for-review seeded service"),
			}),
			ChecksEn: []string{
				"Sign in as Dimas Pratama and verify services already exist while the featured-service requirement is still unmet.",
				"Confirm the ready-for-review warning path is visible and understandable from overview and services surfaces.",
				"Verify review preparation messaging stays coherent after refresh.",
			},
			ChecksId: []string{
				"Login sebagai Dimas Pratama lalu pastikan layanan sudah ada tetapi syarat featured service masih belum terpenuhi.",
				"Konfirmasi jalur warning ready for review terlihat jelas dan mudah dipahami dari overview serta services.",
				"Pastikan pesan persiapan review tetap koheren setelah refresh.",
			},
			Tags: []string{"professional", "ready_for_review", "warning", "review"},
		},
		{
			ID:                 "ADM-01",
			PersonaRole:        "admin",
			PersonaID:          "adm-01",
			PersonaDisplayName: adminNamesByID["adm-01"],
			TitleEn:            "Support desk triage",
			TitleId:            "Triage support desk",
			StartRoutes:        []string{"/admin/login", "/admin/support"},
			Login:              adminLogin(adminByID["adm-01"].Email),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				supportTicketSampleRef(supportUrgent, "Urgent support ticket"),
				supportTicketSampleRef(supportHigh, "High urgency support ticket"),
				supportTicketSampleRef(supportNormal, "Normal urgency support ticket"),
			}),
			ChecksEn: []string{
				"Sign in as the seeded support admin and verify urgent, high, and normal tickets render together in the support desk.",
				fmt.Sprintf("Use %s as the anchor urgent case and confirm command-center context points to active operational issues.", supportUrgent.ID),
				"Verify support desk hydration survives refresh without browser-only fallback state.",
			},
			ChecksId: []string{
				"Login sebagai admin support seed lalu pastikan tiket urgent, high, dan normal tampil bersama di support desk.",
				fmt.Sprintf("Gunakan %s sebagai kasus urgent acuan dan pastikan command-center mengarah ke isu operasional aktif.", supportUrgent.ID),
				"Pastikan hydration support desk tetap bertahan setelah refresh tanpa fallback state milik browser.",
			},
			Tags: []string{"admin", "support", "triage"},
		},
		{
			ID:                 "ADM-02",
			PersonaRole:        "admin",
			PersonaID:          "adm-02",
			PersonaDisplayName: adminNamesByID["adm-02"],
			TitleEn:            "Professional review operations",
			TitleId:            "Operasi review profesional",
			StartRoutes:        []string{"/admin/login", "/admin/professionals"},
			Login:              adminLogin(adminByID["adm-02"].Email),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				professionalSampleRef(omeya, "", "submitted", "Submitted review candidate"),
				professionalSampleRef(rani, "", "changes_requested", "Revision review candidate"),
				supportTicketSampleRef(reviewTicket, "Review-focused support ticket"),
			}),
			ChecksEn: []string{
				"Sign in as the seeded review admin and verify professional review surfaces hydrate from backend state.",
				fmt.Sprintf("Use %s and %s as the primary review-state references.", omeya.Name, rani.Name),
				"Confirm review-oriented console screens stay stable after refresh and after safe mutations.",
			},
			ChecksId: []string{
				"Login sebagai admin review seed lalu pastikan surface review profesional ter-hydrate dari backend state.",
				fmt.Sprintf("Gunakan %s dan %s sebagai referensi utama untuk state review.", omeya.Name, rani.Name),
				"Konfirmasi layar console yang berorientasi review tetap stabil setelah refresh dan mutasi aman.",
			},
			Tags: []string{"admin", "reviews", "professional"},
		},
		{
			ID:                 "ADM-03",
			PersonaRole:        "admin",
			PersonaID:          "adm-03",
			PersonaDisplayName: adminNamesByID["adm-03"],
			TitleEn:            "Operational booking context",
			TitleId:            "Konteks booking operasional",
			StartRoutes:        []string{"/admin/login", "/admin/customers", "/admin/appointments"},
			Login:              adminLogin(adminByID["adm-03"].Email),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				supportTicketSampleRef(opsTicket, "Operations support ticket"),
				appointmentSampleRef(appointmentByIDOrZero(appointments, opsTicket.RelatedAppointmentID), "Operations-linked appointment"),
			}),
			ChecksEn: []string{
				"Sign in as the seeded ops admin and verify customer plus appointment modules align with runtime backend state.",
				fmt.Sprintf("Use %s as the primary ops ticket reference and inspect the linked appointment context.", opsTicket.ID),
				"Confirm appointment and customer modules remain synchronized after refresh.",
			},
			ChecksId: []string{
				"Login sebagai admin ops seed lalu pastikan modul customer dan appointment selaras dengan runtime backend state.",
				fmt.Sprintf("Gunakan %s sebagai referensi utama tiket ops dan periksa context appointment yang terhubung.", opsTicket.ID),
				"Konfirmasi modul appointment dan customer tetap sinkron setelah refresh.",
			},
			Tags: []string{"admin", "ops", "appointments", "customers"},
		},
		{
			ID:                 "ADM-04",
			PersonaRole:        "admin",
			PersonaID:          "adm-04",
			PersonaDisplayName: adminNamesByID["adm-04"],
			TitleEn:            "Catalog and studio edits",
			TitleId:            "Edit katalog dan studio",
			StartRoutes:        []string{"/admin/login", "/admin/services", "/admin/studio"},
			Login:              adminLogin(adminByID["adm-04"].Email),
			SampleEntityRefs: compactSampleEntityRefs([]SampleEntityRef{
				serviceSampleRef(publishedService, publishedServiceRoute, publishedOffering, "Catalog reference service"),
				supportTicketSampleRef(catalogTicket, "Catalog support ticket"),
				professionalSampleRef(publishedProfessional, publishedProfessionalRoute, "published", "Published catalog reference professional"),
			}),
			ChecksEn: []string{
				"Sign in as the seeded catalog admin and verify services plus studio tables hydrate from backend state.",
				fmt.Sprintf("Use %s as the reference service when validating row-level table mutations.", publishedService.Name),
				"Confirm safe table edits persist and the related public catalog surface reflects the backend mutation after refresh.",
			},
			ChecksId: []string{
				"Login sebagai admin katalog seed lalu pastikan tabel services dan studio ter-hydrate dari backend state.",
				fmt.Sprintf("Gunakan %s sebagai layanan acuan saat memvalidasi mutasi tabel level baris.", publishedService.Name),
				"Konfirmasi edit tabel yang aman tetap tersimpan dan surface katalog publik terkait merefleksikan mutasi backend setelah refresh.",
			},
			Tags: []string{"admin", "catalog", "studio"},
		},
	}

	return caseList
}

func compactSampleEntityRefs(refs []SampleEntityRef) []SampleEntityRef {
	compact := make([]SampleEntityRef, 0, len(refs))
	for _, ref := range refs {
		if strings.TrimSpace(ref.Kind) == "" || strings.TrimSpace(ref.Label) == "" {
			continue
		}
		compact = append(compact, ref)
	}
	return compact
}

func collectSummarySampleEntityRefs(cases []ManualQACase) []SampleEntityRef {
	refs := make([]SampleEntityRef, 0)
	seen := map[string]struct{}{}

	for _, qaCase := range cases {
		for _, ref := range qaCase.SampleEntityRefs {
			key := strings.Join([]string{
				ref.Kind,
				ref.ID,
				ref.Slug,
				ref.Route,
				ref.AppointmentStatus,
				ref.ReviewStatus,
				ref.Mode,
				ref.BookingFlow,
			}, "|")
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			refs = append(refs, ref)
		}
	}

	return refs
}

func manualQACaseIDs(cases []ManualQACase) []string {
	ids := make([]string, 0, len(cases))
	for _, qaCase := range cases {
		if strings.TrimSpace(qaCase.ID) == "" {
			continue
		}
		ids = append(ids, qaCase.ID)
	}
	return ids
}

func adminAccessesForQAMetadata(
	adminAccesses []AdminAccess,
	adminStaff []seedAdminStaffRow,
) []AdminAccess {
	if len(adminAccesses) > 0 {
		return append([]AdminAccess(nil), adminAccesses...)
	}

	fallback := make([]AdminAccess, 0, len(adminStaff))
	for _, staff := range adminStaff {
		fallback = append(fallback, AdminAccess{
			AdminID:   staff.ID,
			Email:     staff.Email,
			FocusArea: staff.FocusArea,
		})
	}
	return fallback
}

func servicesByID(services []readmodel.GlobalService) map[string]readmodel.GlobalService {
	indexed := make(map[string]readmodel.GlobalService, len(services))
	for _, service := range services {
		indexed[service.ID] = service
	}
	return indexed
}

func userContextsByID(rows []seedUserContextRow) map[string]seedUserContextRow {
	indexed := make(map[string]seedUserContextRow, len(rows))
	for _, row := range rows {
		indexed[row.ID] = row
	}
	return indexed
}

func adminNamesByID(rows []seedAdminStaffRow) map[string]string {
	indexed := make(map[string]string, len(rows))
	for _, row := range rows {
		indexed[row.ID] = row.Name
	}
	return indexed
}

func primaryRuntimeSelection(
	rows []seedRuntimeSelectionRow,
	contexts map[string]seedUserContextRow,
	areas []readmodel.Area,
) (seedRuntimeSelectionRow, seedUserContextRow, readmodel.Area, bool) {
	if len(rows) == 0 {
		return seedRuntimeSelectionRow{}, seedUserContextRow{}, readmodel.Area{}, false
	}

	selection := rows[0]
	context, ok := contexts[selection.CurrentUserContextID]
	if !ok {
		return selection, seedUserContextRow{}, readmodel.Area{}, false
	}

	area, ok := areaByID(areas, context.SelectedAreaID)
	if !ok {
		return selection, context, readmodel.Area{}, false
	}

	return selection, context, area, true
}

func consumerByID(consumers []seedConsumerRow, consumerID string) (seedConsumerRow, bool) {
	for _, consumer := range consumers {
		if consumer.ID == consumerID {
			return consumer, true
		}
	}
	return seedConsumerRow{}, false
}

func professionalByReviewStatus(
	professionals []readmodel.Professional,
	reviewStatus string,
) (readmodel.Professional, int, bool) {
	for index, professional := range professionals {
		if portalReviewStatusForIndex(index) == reviewStatus {
			return professional, index, true
		}
	}
	return readmodel.Professional{}, 0, false
}

func firstServiceForProfessional(
	professionalID string,
	offerings []seedServiceOfferingRow,
	services []readmodel.GlobalService,
) (readmodel.GlobalService, seedServiceOfferingRow, bool) {
	servicesIndex := servicesByID(services)
	for _, offering := range offerings {
		if offering.ProfessionalID != professionalID {
			continue
		}
		service, ok := servicesIndex[offering.ServiceID]
		if !ok {
			continue
		}
		return service, offering, true
	}

	return readmodel.GlobalService{}, seedServiceOfferingRow{}, false
}

func appointmentByConsumerAndStatus(
	appointments []readmodel.AppointmentSeed,
	consumerID string,
	status readmodel.AppointmentStatus,
) (readmodel.AppointmentSeed, bool) {
	for _, appointment := range appointments {
		if appointment.ConsumerID == consumerID && appointment.Status == status {
			return appointment, true
		}
	}
	return readmodel.AppointmentSeed{}, false
}

func appointmentThreadByAppointmentID(
	threads []seedChatThreadRow,
	appointmentID string,
) (seedChatThreadRow, bool) {
	for _, thread := range threads {
		if thread.AppointmentID == appointmentID {
			return thread, true
		}
	}
	return seedChatThreadRow{}, false
}

func supportTicketByUrgency(
	tickets []clientstate.SupportTicketData,
	urgency string,
) (clientstate.SupportTicketData, bool) {
	for _, ticket := range tickets {
		if ticket.Urgency == urgency {
			return ticket, true
		}
	}
	return clientstate.SupportTicketData{}, false
}

func supportTicketByAdminID(
	tickets []clientstate.SupportTicketData,
	adminID string,
) (clientstate.SupportTicketData, bool) {
	for _, ticket := range tickets {
		if ticket.AssignedAdminID == adminID {
			return ticket, true
		}
	}
	return clientstate.SupportTicketData{}, false
}

func appointmentByIDOrZero(
	appointments []readmodel.AppointmentSeed,
	appointmentID string,
) readmodel.AppointmentSeed {
	for _, appointment := range appointments {
		if appointment.ID == appointmentID {
			return appointment
		}
	}
	return readmodel.AppointmentSeed{}
}

func areaByID(areas []readmodel.Area, areaID string) (readmodel.Area, bool) {
	for _, area := range areas {
		if area.ID == areaID {
			return area, true
		}
	}
	return readmodel.Area{}, false
}

func customerLogin(phone string, password string) *ManualQALogin {
	return &ManualQALogin{
		Route:             "/id/auth/customer",
		IdentifierType:    "phone",
		Identifier:        phone,
		Password:          password,
		PasswordReference: "summary.customerPassword",
	}
}

func professionalLogin(phone string, password string, professionalName string) *ManualQALogin {
	return &ManualQALogin{
		Route:             "/id/for-professionals",
		IdentifierType:    "phone",
		Identifier:        phone,
		Password:          password,
		PasswordReference: "summary.professionalPassword",
		NotesEn:           fmt.Sprintf("If the profile picker appears first, choose %s before entering the WhatsApp number.", professionalName),
		NotesId:           fmt.Sprintf("Jika pemilih profil tampil lebih dulu, pilih %s sebelum mengisi nomor WhatsApp.", professionalName),
	}
}

func adminLogin(email string) *ManualQALogin {
	if strings.TrimSpace(email) == "" {
		return nil
	}

	return &ManualQALogin{
		Route:             "/admin/login",
		IdentifierType:    "email",
		Identifier:        email,
		PasswordReference: "Use the password configured in apps/backend/.env under ADMIN_CONSOLE_CREDENTIALS_JSON.",
	}
}

func professionalPublicRoute(slug string) string {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return ""
	}
	return "/id/p/" + slug
}

func servicePublicRoute(slug string) string {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return ""
	}
	return "/id/s/" + slug
}

func runtimeSelectionRef(selection seedRuntimeSelectionRow, area readmodel.Area) SampleEntityRef {
	if strings.TrimSpace(selection.ID) == "" {
		return SampleEntityRef{}
	}

	label := "Active runtime selection"
	if strings.TrimSpace(area.Label) != "" {
		label = fmt.Sprintf("Active runtime selection for %s", area.Label)
	}

	return SampleEntityRef{
		Kind:  "runtime_selection",
		ID:    selection.ID,
		Label: label,
	}
}

func areaSampleRef(area readmodel.Area, label string) SampleEntityRef {
	if strings.TrimSpace(area.ID) == "" {
		return SampleEntityRef{}
	}

	return SampleEntityRef{
		Kind:  "area",
		ID:    area.ID,
		Label: firstNonEmpty(label, area.Label),
	}
}

func serviceSampleRef(
	service readmodel.GlobalService,
	route string,
	offering seedServiceOfferingRow,
	label string,
) SampleEntityRef {
	if strings.TrimSpace(service.ID) == "" {
		return SampleEntityRef{}
	}

	mode := strings.TrimSpace(offering.DefaultMode)
	if mode == "" {
		mode = strings.TrimSpace(service.DefaultMode)
	}

	return SampleEntityRef{
		Kind:        "service",
		ID:          service.ID,
		Slug:        service.Slug,
		Label:       firstNonEmpty(label, service.Name),
		Route:       route,
		Mode:        mode,
		BookingFlow: strings.TrimSpace(offering.BookingFlow),
	}
}

func professionalSampleRef(
	professional readmodel.Professional,
	route string,
	reviewStatus string,
	label string,
) SampleEntityRef {
	if strings.TrimSpace(professional.ID) == "" {
		return SampleEntityRef{}
	}

	return SampleEntityRef{
		Kind:         "professional",
		ID:           professional.ID,
		Slug:         professional.Slug,
		Label:        firstNonEmpty(label, professional.Name),
		Route:        route,
		ReviewStatus: strings.TrimSpace(reviewStatus),
	}
}

func appointmentSampleRef(appointment readmodel.AppointmentSeed, label string) SampleEntityRef {
	if strings.TrimSpace(appointment.ID) == "" {
		return SampleEntityRef{}
	}

	return SampleEntityRef{
		Kind:              "appointment",
		ID:                appointment.ID,
		Label:             firstNonEmpty(label, appointment.ID),
		AppointmentStatus: strings.TrimSpace(string(appointment.Status)),
		Mode:              strings.TrimSpace(appointment.RequestedMode),
		BookingFlow:       strings.TrimSpace(appointment.BookingFlow),
	}
}

func chatThreadSampleRef(thread seedChatThreadRow, label string) SampleEntityRef {
	if strings.TrimSpace(thread.ID) == "" {
		return SampleEntityRef{}
	}

	return SampleEntityRef{
		Kind:  "chat_thread",
		ID:    thread.ID,
		Label: firstNonEmpty(label, thread.ID),
		Route: "/id/appointments",
	}
}

func supportTicketSampleRef(ticket clientstate.SupportTicketData, label string) SampleEntityRef {
	if strings.TrimSpace(ticket.ID) == "" {
		return SampleEntityRef{}
	}

	return SampleEntityRef{
		Kind:  "support_ticket",
		ID:    ticket.ID,
		Label: firstNonEmpty(label, ticket.Summary),
	}
}

func suggestedAdminChecks(focusArea string) []string {
	switch strings.TrimSpace(focusArea) {
	case "support":
		return []string{
			"Open /admin/support and verify urgent, high, and normal support tickets render with seeded command-center context.",
			"Refresh the support desk and confirm ticket hydration remains backend-owned instead of browser-owned.",
			"Use safe support actions to verify state remains coherent after refresh.",
		}
	case "reviews":
		return []string{
			"Open /admin/professionals and verify professional review tables hydrate from the seeded backend runtime.",
			"Inspect submitted and changes-requested professionals and confirm review cues remain visible after refresh.",
			"Use safe review-oriented mutations and verify the console stays synchronized.",
		}
	case "ops":
		return []string{
			"Open /admin/customers and /admin/appointments and verify operational rows match the seeded appointment runtime.",
			"Inspect payment, cancellation, and fulfillment context without losing synchronization after refresh.",
			"Use safe admin mutations and confirm customer plus appointment modules remain aligned.",
		}
	case "catalog":
		return []string{
			"Open /admin/services and /admin/studio and verify backend-owned table hydration is present.",
			"Use safe row-level table edits and confirm granular table sync persists after refresh.",
			"Verify related public catalog surfaces reflect backend mutations rather than stale browser data.",
		}
	default:
		return []string{
			"Open /admin/studio and verify seeded admin console tables hydrate without browser-owned fallback data.",
			"Open /admin/support and verify urgent, high, and normal support tickets render with seeded command-center context.",
			"Use admin mutations on staff or service tables and verify granular table sync persists to backend state.",
		}
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}
