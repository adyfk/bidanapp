package web

import (
	"encoding/json"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if payload == nil {
		return
	}

	encoder := json.NewEncoder(w)
	encoder.SetEscapeHTML(false)
	_ = encoder.Encode(payload)
}

func WriteError(w http.ResponseWriter, status int, code string, message string) {
	WriteJSON(w, status, NewAPIError(status, code, message))
}
