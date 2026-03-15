package simulation

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"bidanapp/apps/backend/internal/platform/web"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return Handler{service: service}
}

func (h Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	h.writeRaw(w, r, h.service.Settings)
}

func (h Handler) GetCatalog(w http.ResponseWriter, r *http.Request) {
	h.writeRaw(w, r, h.service.Catalog)
}

func (h Handler) GetAppointments(w http.ResponseWriter, r *http.Request) {
	h.writeRaw(w, r, h.service.Appointments)
}

func (h Handler) GetChat(w http.ResponseWriter, r *http.Request) {
	h.writeRaw(w, r, h.service.Chat)
}

func (h Handler) ListProfessionals(w http.ResponseWriter, r *http.Request) {
	payload, err := h.service.Professionals(r.Context())
	if err != nil {
		h.writeError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]any{
		"data": payload,
	})
}

func (h Handler) GetProfessional(w http.ResponseWriter, r *http.Request) {
	payload, err := h.service.ProfessionalBySlug(r.Context(), r.PathValue("slug"))
	if err != nil {
		h.writeError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]any{
		"data": payload,
	})
}

func (h Handler) writeRaw(w http.ResponseWriter, r *http.Request, reader func(context.Context) (json.RawMessage, error)) {
	payload, err := reader(r.Context())
	if err != nil {
		h.writeError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]any{
		"data": payload,
	})
}

func (h Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		web.WriteError(w, http.StatusNotFound, "not_found", "requested resource was not found")
	case errors.Is(err, http.ErrHandlerTimeout):
		web.WriteError(w, http.StatusGatewayTimeout, "timeout", "upstream operation timed out")
	default:
		web.WriteError(w, http.StatusInternalServerError, "simulation_error", err.Error())
	}
}
