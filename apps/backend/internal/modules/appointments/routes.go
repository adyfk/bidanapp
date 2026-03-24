package appointments

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"bidanapp/apps/backend/internal/modules/professionalportal"
	"bidanapp/apps/backend/internal/platform/web"
)

type Service struct {
	portal *professionalportal.Service
}

type appointmentUpsertPathInput struct {
	AppointmentID string `path:"appointment_id" doc:"Appointment record identifier"`
	Body          AppointmentRecordUpsertData
}

type AppointmentRecordUpsertData struct {
	AppointmentRecord professionalportal.ProfessionalPortalManagedAppointmentRecord `json:"appointmentRecord"`
	ProfessionalID    string                                                        `json:"professionalId" required:"true"`
}

type appointmentRequestsResponseBody struct {
	Data professionalportal.ProfessionalPortalRequestsData `json:"data"`
}

type appointmentRequestsResponse struct {
	Body appointmentRequestsResponseBody
}

func NewService(portal *professionalportal.Service) *Service {
	return &Service{portal: portal}
}

func RegisterRoutes(api huma.API, service *Service) {
	if service == nil {
		return
	}

	huma.Register(api, huma.Operation{
		OperationID: "upsert-appointment-record",
		Method:      http.MethodPut,
		Path:        "/appointments/{appointment_id}",
		Summary:     "Create or update a persisted appointment record",
		Tags:        []string{"Appointments"},
		Errors:      []int{http.StatusBadRequest, http.StatusInternalServerError},
	}, func(ctx context.Context, input *appointmentUpsertPathInput) (*appointmentRequestsResponse, error) {
		record := input.Body.AppointmentRecord
		record.ID = input.AppointmentID

		payload, err := service.portal.UpsertAppointmentRecord(ctx, input.Body.ProfessionalID, record)
		if err != nil {
			return nil, toAPIError(err)
		}

		response := &appointmentRequestsResponse{}
		response.Body.Data = payload
		return response, nil
	})
}

func toAPIError(err error) error {
	switch {
	case errors.Is(err, professionalportal.ErrInvalidProfessionalID), errors.Is(err, professionalportal.ErrInvalidAppointmentRecord):
		return web.NewAPIError(http.StatusBadRequest, "invalid_appointment_record", err.Error())
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, http.ErrHandlerTimeout):
		return web.NewAPIError(http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		return web.NewAPIError(http.StatusInternalServerError, "internal_error", "internal server error")
	}
}
