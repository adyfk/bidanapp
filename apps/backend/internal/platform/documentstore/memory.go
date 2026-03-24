package documentstore

import (
	"context"
	"sync"
	"time"
)

type MemoryStore struct {
	mu      sync.RWMutex
	records map[string]Record
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		records: make(map[string]Record),
	}
}

func (s *MemoryStore) Read(ctx context.Context, namespace string, key string) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	record, ok := s.records[buildRecordKey(namespace, key)]
	if !ok {
		return Record{}, ErrNotFound
	}

	return cloneRecord(record), nil
}

func (s *MemoryStore) Upsert(ctx context.Context, record Record) (Record, error) {
	if err := ctx.Err(); err != nil {
		return Record{}, err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if record.SavedAt.IsZero() {
		record.SavedAt = time.Now().UTC()
	}
	if record.Snapshot == nil {
		record.Snapshot = map[string]any{}
	}

	cloned := cloneRecord(record)
	s.records[buildRecordKey(record.Namespace, record.Key)] = cloned
	return cloneRecord(cloned), nil
}

func buildRecordKey(namespace string, key string) string {
	return namespace + "::" + key
}

func cloneRecord(record Record) Record {
	cloned := Record{
		Namespace: record.Namespace,
		Key:       record.Key,
		SavedAt:   record.SavedAt,
		Snapshot:  map[string]any{},
	}

	for key, value := range record.Snapshot {
		cloned.Snapshot[key] = value
	}

	return cloned
}
