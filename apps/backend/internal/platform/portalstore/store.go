package portalstore

import (
	"context"
	"encoding/json"
)

type Record struct {
	ProfessionalID string         `json:"professionalId"`
	SavedAt        string         `json:"savedAt"`
	Snapshot       map[string]any `json:"snapshot"`
}

type State struct {
	LastActiveProfessionalID string            `json:"lastActiveProfessionalId,omitempty"`
	Sessions                 map[string]Record `json:"sessions,omitempty"`
}

type Reader interface {
	Read(ctx context.Context) (State, error)
}

type Store interface {
	Reader
	Upsert(ctx context.Context, record Record, lastActiveProfessionalID string) (State, error)
}

func CloneState(state State) State {
	clonedSessions := make(map[string]Record, len(state.Sessions))
	for professionalID, record := range state.Sessions {
		clonedSessions[professionalID] = CloneRecord(record)
	}

	return State{
		LastActiveProfessionalID: state.LastActiveProfessionalID,
		Sessions:                 clonedSessions,
	}
}

func CloneRecord(record Record) Record {
	return Record{
		ProfessionalID: record.ProfessionalID,
		SavedAt:        record.SavedAt,
		Snapshot:       CloneSnapshot(record.Snapshot),
	}
}

func CloneSnapshot(snapshot map[string]any) map[string]any {
	if len(snapshot) == 0 {
		return map[string]any{}
	}

	bytes, err := json.Marshal(snapshot)
	if err != nil {
		return snapshot
	}

	var cloned map[string]any
	if err := json.Unmarshal(bytes, &cloned); err != nil {
		return snapshot
	}

	return cloned
}
