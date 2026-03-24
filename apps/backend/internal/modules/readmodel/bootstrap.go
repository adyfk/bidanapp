package readmodel

import "context"

func (s Service) Bootstrap(ctx context.Context) (BootstrapData, error) {
	catalog, err := s.Catalog(ctx)
	if err != nil {
		return BootstrapData{}, err
	}

	consumerRows, err := readJSON[[]seedDataConsumerRow](ctx, s.repository, "consumers.json")
	if err != nil {
		return BootstrapData{}, err
	}

	userContextRows, err := readJSON[[]seedDataUserContextRow](ctx, s.repository, "user_contexts.json")
	if err != nil {
		return BootstrapData{}, err
	}

	runtimeSelectionRows, err := readJSON[[]seedDataRuntimeSelectionRow](ctx, s.repository, "app_runtime_selections.json")
	if err != nil {
		return BootstrapData{}, err
	}

	homeFeedRows, err := readJSON[[]seedDataHomeFeedRow](ctx, s.repository, "home_feed_snapshots.json")
	if err != nil {
		return BootstrapData{}, err
	}

	featuredAppointmentRows, err := readOptionalJSON[[]seedDataHomeFeedFeaturedAppointmentRow](ctx, s.repository, "home_feed_featured_appointments.json", []seedDataHomeFeedFeaturedAppointmentRow{})
	if err != nil {
		return BootstrapData{}, err
	}

	popularServiceRows, err := readOptionalJSON[[]seedDataHomeFeedPopularServiceRow](ctx, s.repository, "home_feed_popular_services.json", []seedDataHomeFeedPopularServiceRow{})
	if err != nil {
		return BootstrapData{}, err
	}

	nearbyProfessionalRows, err := readOptionalJSON[[]seedDataHomeFeedNearbyProfessionalRow](ctx, s.repository, "home_feed_nearby_professionals.json", []seedDataHomeFeedNearbyProfessionalRow{})
	if err != nil {
		return BootstrapData{}, err
	}

	appSectionConfigRows, err := readOptionalJSON[[]seedDataAppSectionConfigRow](ctx, s.repository, "app_section_configs.json", []seedDataAppSectionConfigRow{})
	if err != nil {
		return BootstrapData{}, err
	}

	appointmentRows, err := readOptionalJSON[[]seedDataAppointmentRow](ctx, s.repository, "appointments.json", []seedDataAppointmentRow{})
	if err != nil {
		return BootstrapData{}, err
	}

	areasByID := make(map[string]Area, len(catalog.Areas))
	for _, area := range catalog.Areas {
		areasByID[area.ID] = area
	}

	consumersByID := make(map[string]ConsumerProfile, len(consumerRows))
	for _, row := range consumerRows {
		consumersByID[row.ID] = ConsumerProfile{
			Index:  row.Index,
			ID:     row.ID,
			Name:   row.Name,
			Phone:  row.Phone,
			Avatar: row.Avatar,
		}
	}

	userContextsByID := make(map[string]UserContext, len(userContextRows))
	for _, row := range userContextRows {
		area := areasByID[row.SelectedAreaID]
		userContextsByID[row.ID] = UserContext{
			Index:             row.Index,
			ID:                row.ID,
			Area:              area,
			CurrentArea:       area.Label,
			UserLocation:      GeoPoint{Latitude: row.UserLatitude, Longitude: row.UserLongitude},
			OnlineStatusLabel: row.OnlineStatusLabel,
		}
	}

	appointmentsByID := make(map[string]HomeFeedAppointmentSummary, len(appointmentRows))
	for _, row := range appointmentRows {
		appointmentsByID[row.ID] = HomeFeedAppointmentSummary{
			ID:     row.ID,
			Status: row.Status,
		}
	}

	servicesByID := make(map[string]GlobalService, len(catalog.Services))
	for _, service := range catalog.Services {
		servicesByID[service.ID] = service
	}

	professionalsByID := make(map[string]Professional, len(catalog.Professionals))
	for _, professional := range catalog.Professionals {
		professionalsByID[professional.ID] = professional
	}

	runtimeSelection := seedDataRuntimeSelectionRow{}
	if len(runtimeSelectionRows) > 0 {
		runtimeSelection = runtimeSelectionRows[0]
	}

	currentConsumer := consumersByID[runtimeSelection.CurrentConsumerID]
	currentUserContext := userContextsByID[runtimeSelection.CurrentUserContextID]

	featuredAppointmentsByHomeFeedID := make(map[string]seedDataHomeFeedFeaturedAppointmentRow, len(featuredAppointmentRows))
	for _, row := range featuredAppointmentRows {
		featuredAppointmentsByHomeFeedID[row.HomeFeedID] = row
	}

	popularServicesByHomeFeedID := make(map[string][]GlobalService)
	for _, row := range popularServiceRows {
		service, ok := servicesByID[row.ServiceID]
		if !ok {
			continue
		}

		popularServicesByHomeFeedID[row.HomeFeedID] = append(popularServicesByHomeFeedID[row.HomeFeedID], service)
	}

	nearbyProfessionalsByHomeFeedID := make(map[string][]Professional)
	for _, row := range nearbyProfessionalRows {
		professional, ok := professionalsByID[row.ProfessionalID]
		if !ok {
			continue
		}

		nearbyProfessionalsByHomeFeedID[row.HomeFeedID] = append(nearbyProfessionalsByHomeFeedID[row.HomeFeedID], professional)
	}

	activeHomeFeed := HomeFeedSnapshot{
		CurrentUser:         currentConsumer,
		SharedContext:       currentUserContext,
		PopularServices:     []GlobalService{},
		NearbyProfessionals: []Professional{},
	}

	for _, row := range homeFeedRows {
		if row.ID != runtimeSelection.ActiveHomeFeedID {
			continue
		}

		activeHomeFeed = HomeFeedSnapshot{
			ID:                  row.ID,
			Title:               row.Title,
			CurrentUser:         consumersByID[row.ConsumerID],
			SharedContext:       userContextsByID[row.UserContextID],
			PopularServices:     popularServicesByHomeFeedID[row.ID],
			NearbyProfessionals: nearbyProfessionalsByHomeFeedID[row.ID],
		}

		if featuredRow, ok := featuredAppointmentsByHomeFeedID[row.ID]; ok {
			appointment, hasAppointment := appointmentsByID[featuredRow.AppointmentID]
			professional, hasProfessional := professionalsByID[featuredRow.ProfessionalID]

			if hasAppointment && hasProfessional {
				activeHomeFeed.FeaturedAppointment = &HomeFeedFeaturedAppointment{
					Appointment:  appointment,
					DateLabel:    featuredRow.DateLabel,
					TimeLabel:    featuredRow.TimeLabel,
					Professional: professional,
				}
			}
		}
	}

	appSectionConfig := AppSectionConfig{
		HomeCategoryIDs: []string{},
	}
	for _, row := range appSectionConfigRows {
		if row.Section == "home" && row.ConfigKey == "homeCategoryIds" && row.EntityType == "category" {
			appSectionConfig.HomeCategoryIDs = append(appSectionConfig.HomeCategoryIDs, row.EntityID)
		}
	}

	return BootstrapData{
		Catalog:            catalog,
		CurrentConsumer:    currentConsumer,
		CurrentUserContext: currentUserContext,
		AppSectionConfig:   appSectionConfig,
		ActiveHomeFeed:     activeHomeFeed,
	}, nil
}
