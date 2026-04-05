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

func (s *MemoryStore) ReadRecord(ctx context.Context, professionalID string) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	record, ok := s.state.Sessions[professionalID]
	if !ok {
		return Record{}, ErrNotFound
	}
	return CloneRecord(record), nil
}

func (s *MemoryStore) ReadLastActiveProfessionalID(ctx context.Context) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	return s.state.LastActiveProfessionalID, nil
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

func (s *MemoryStore) UpsertRecord(ctx context.Context, record Record, lastActiveProfessionalID string) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.state.Sessions == nil {
		s.state.Sessions = make(map[string]Record)
	}

	s.state.LastActiveProfessionalID = lastActiveProfessionalID
	s.state.Sessions[record.ProfessionalID] = CloneRecord(record)
	return CloneRecord(s.state.Sessions[record.ProfessionalID]), nil
}
