package professionalportal

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/platform/web"
)

var errForbiddenProfessionalAccess = errors.New("professional access does not match authenticated session")

type sessionQueryInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific portal snapshot"`
}

type upsertSessionInput struct {
	Body UpsertProfessionalPortalSessionRequest
}

type sessionResponseBody struct {
	Data ProfessionalPortalSessionData `json:"data"`
}

type sessionResponse struct {
	Body sessionResponseBody
}

type profileInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific profile resource"`
}

type coverageInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific coverage resource"`
}

type servicesInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific services resource"`
}

type requestsInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific requests resource"`
}

type portfolioInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific portfolio resource"`
}

type galleryInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific gallery resource"`
}

type trustInput struct {
	ProfessionalID string `query:"professional_id" doc:"Optional professional id to load a specific trust resource"`
}

type upsertProfileInput struct {
	Body ProfessionalPortalProfileData
}

type upsertCoverageInput struct {
	Body ProfessionalPortalCoverageData
}

type upsertServicesInput struct {
	Body ProfessionalPortalServicesData
}

type upsertRequestsInput struct {
	Body ProfessionalPortalRequestsData
}

type upsertPortfolioInput struct {
	Body ProfessionalPortalPortfolioData
}

type upsertGalleryInput struct {
	Body ProfessionalPortalGalleryData
}

type upsertTrustInput struct {
	Body ProfessionalPortalTrustData
}

type profileResponseBody struct {
	Data ProfessionalPortalProfileData `json:"data"`
}

type coverageResponseBody struct {
	Data ProfessionalPortalCoverageData `json:"data"`
}

type servicesResponseBody struct {
	Data ProfessionalPortalServicesData `json:"data"`
}

type requestsResponseBody struct {
	Data ProfessionalPortalRequestsData `json:"data"`
}

type portfolioResponseBody struct {
	Data ProfessionalPortalPortfolioData `json:"data"`
}

type galleryResponseBody struct {
	Data ProfessionalPortalGalleryData `json:"data"`
}

type trustResponseBody struct {
	Data ProfessionalPortalTrustData `json:"data"`
}

type profileResponse struct {
	Body profileResponseBody
}

type coverageResponse struct {
	Body coverageResponseBody
}

type servicesResponse struct {
	Body servicesResponseBody
}

type requestsResponse struct {
	Body requestsResponseBody
}

type portfolioResponse struct {
	Body portfolioResponseBody
}

type galleryResponse struct {
	Body galleryResponseBody
}

type trustResponse struct {
	Body trustResponseBody
}

func RegisterRoutes(api huma.API, service *Service) {
	registerGetRoute(api, service)
	registerUpsertSessionRoute(api, service)
	registerProfileRoutes(api, service)
	registerCoverageRoutes(api, service)
	registerServicesRoutes(api, service)
	registerRequestsRoutes(api, service)
	registerPortfolioRoutes(api, service)
	registerGalleryRoutes(api, service)
	registerTrustRoutes(api, service)
}

func registerGetRoute(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-session",
		Method:      http.MethodGet,
		Path:        "/professionals/portal/session",
		Summary:     "Get persisted professional portal session",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *sessionQueryInput) (*sessionResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Session(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &sessionResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerUpsertSessionRoute(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-session",
		Method:      http.MethodPut,
		Path:        "/professionals/portal/session",
		Summary:     "Persist professional portal session",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertSessionInput) (*sessionResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		input.Body.ProfessionalID = professionalID
		setSnapshotProfessionalID(input.Body.Snapshot, professionalID)

		payload, err := service.UpsertSession(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &sessionResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerProfileRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-profile",
		Method:      http.MethodGet,
		Path:        "/professionals/me/profile",
		Summary:     "Get persisted professional profile resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *profileInput) (*profileResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Profile(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &profileResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-profile",
		Method:      http.MethodPut,
		Path:        "/professionals/me/profile",
		Summary:     "Persist professional profile resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertProfileInput) (*profileResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertProfile(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &profileResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerCoverageRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-coverage",
		Method:      http.MethodGet,
		Path:        "/professionals/me/coverage",
		Summary:     "Get persisted professional coverage resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *coverageInput) (*coverageResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Coverage(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &coverageResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-coverage",
		Method:      http.MethodPut,
		Path:        "/professionals/me/coverage",
		Summary:     "Persist professional coverage resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertCoverageInput) (*coverageResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertCoverage(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &coverageResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerServicesRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-services",
		Method:      http.MethodGet,
		Path:        "/professionals/me/services",
		Summary:     "Get persisted professional services resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *servicesInput) (*servicesResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Services(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &servicesResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-services",
		Method:      http.MethodPut,
		Path:        "/professionals/me/services",
		Summary:     "Persist professional services resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertServicesInput) (*servicesResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertServices(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &servicesResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerRequestsRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-requests",
		Method:      http.MethodGet,
		Path:        "/professionals/me/requests",
		Summary:     "Get persisted professional request records resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *requestsInput) (*requestsResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Requests(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &requestsResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-requests",
		Method:      http.MethodPut,
		Path:        "/professionals/me/requests",
		Summary:     "Persist professional request records resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertRequestsInput) (*requestsResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertRequests(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &requestsResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerPortfolioRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-portfolio",
		Method:      http.MethodGet,
		Path:        "/professionals/me/portfolio",
		Summary:     "Get persisted professional portfolio resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *portfolioInput) (*portfolioResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Portfolio(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &portfolioResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-portfolio",
		Method:      http.MethodPut,
		Path:        "/professionals/me/portfolio",
		Summary:     "Persist professional portfolio resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertPortfolioInput) (*portfolioResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertPortfolio(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &portfolioResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerGalleryRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-gallery",
		Method:      http.MethodGet,
		Path:        "/professionals/me/gallery",
		Summary:     "Get persisted professional gallery resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *galleryInput) (*galleryResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Gallery(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &galleryResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-gallery",
		Method:      http.MethodPut,
		Path:        "/professionals/me/gallery",
		Summary:     "Persist professional gallery resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertGalleryInput) (*galleryResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertGallery(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &galleryResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func registerTrustRoutes(api huma.API, service *Service) {
	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "get-professional-portal-trust",
		Method:      http.MethodGet,
		Path:        "/professionals/me/trust",
		Summary:     "Get persisted professional trust resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusForbidden, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *trustInput) (*trustResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		payload, err := service.Trust(ctx, professionalID)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &trustResponse{}
		response.Body.Data = payload
		return response, nil
	})

	huma.Register(api, withProfessionalSecurity(huma.Operation{
		OperationID: "upsert-professional-portal-trust",
		Method:      http.MethodPut,
		Path:        "/professionals/me/trust",
		Summary:     "Persist professional trust resource",
		Tags:        []string{"Professional Portal"},
		Errors:      []int{http.StatusBadRequest, http.StatusUnauthorized, http.StatusInternalServerError},
	}), func(ctx context.Context, input *upsertTrustInput) (*trustResponse, error) {
		professionalID, err := authorizedProfessionalID(ctx, input.Body.ProfessionalID)
		if err != nil {
			return nil, toAPIError(err)
		}
		input.Body.ProfessionalID = professionalID

		payload, err := service.UpsertTrust(ctx, input.Body)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &trustResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, errForbiddenProfessionalAccess):
		return web.NewAPIError(http.StatusForbidden, "forbidden_professional_access", "professional access does not match authenticated session")
	case errors.Is(err, professionalauth.ErrSessionNotFound),
		errors.Is(err, professionalauth.ErrMissingAuthorization),
		errors.Is(err, professionalauth.ErrInvalidAuthorization),
		errors.Is(err, professionalauth.ErrSessionExpired),
		errors.Is(err, professionalauth.ErrSessionRevoked):
		return web.NewAPIError(http.StatusUnauthorized, "professional_session_not_found", "professional session not found")
	case errors.Is(err, ErrInvalidProfessionalID), errors.Is(err, ErrInvalidSnapshot):
		return web.NewAPIError(http.StatusBadRequest, "invalid_professional_portal_session", err.Error())
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

func withProfessionalSecurity(operation huma.Operation) huma.Operation {
	operation.Security = []map[string][]string{
		{professionalauth.SecuritySchemeName: {}},
	}
	return operation
}

func authorizedProfessionalID(ctx context.Context, candidate string) (string, error) {
	authSession, ok := professionalauth.ContextSession(ctx)
	if !ok {
		return "", professionalauth.ErrSessionNotFound
	}

	sessionProfessionalID := strings.TrimSpace(authSession.Session.ProfessionalID)
	candidate = strings.TrimSpace(candidate)
	if candidate == "" || candidate == sessionProfessionalID {
		return sessionProfessionalID, nil
	}

	return "", errForbiddenProfessionalAccess
}

func setSnapshotProfessionalID(snapshot map[string]any, professionalID string) {
	if snapshot == nil {
		return
	}

	state, ok := snapshot["state"].(map[string]any)
	if !ok {
		state = map[string]any{}
		snapshot["state"] = state
	}
	state["activeProfessionalId"] = professionalID
}
