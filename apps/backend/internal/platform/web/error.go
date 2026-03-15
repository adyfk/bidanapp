package web

import (
	"net/http"
	"strings"
)

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type APIError struct {
	Payload ErrorPayload `json:"error"`
	Status  int          `json:"-"`
}

func NewAPIError(status int, code string, message string) *APIError {
	if strings.TrimSpace(code) == "" {
		code = DefaultErrorCode(status)
	}

	return &APIError{
		Payload: ErrorPayload{
			Code:    code,
			Message: message,
		},
		Status: status,
	}
}

func (e *APIError) Error() string {
	return e.Payload.Message
}

func (e *APIError) GetStatus() int {
	return e.Status
}

func DefaultErrorCode(status int) string {
	switch status {
	case http.StatusBadRequest:
		return "bad_request"
	case http.StatusNotFound:
		return "not_found"
	case http.StatusGatewayTimeout:
		return "timeout"
	default:
		return "internal_error"
	}
}
