package portalstore

import (
	"context"
	"sync"
)

type MemoryStore struct {
	mu    sync.Mutex
	state State
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		state: State{
			Sessions: make(map[string]Record),
		},
	}
}

func (s *MemoryStore) Read(ctx context.Context) (State, error) {
	if err := ctx.Err(); err != nil {
		return State{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	return CloneState(s.state), nil
}

func (s *MemoryStore) Upsert(ctx context.Context, record Record, lastActiveProfessionalID string) (State, error) {
	if err := ctx.Err(); err != nil {
		return State{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.state.Sessions == nil {
		s.state.Sessions = make(map[string]Record)
	}

	s.state.LastActiveProfessionalID = lastActiveProfessionalID
	s.state.Sessions[record.ProfessionalID] = CloneRecord(record)

	return CloneState(s.state), nil
}
