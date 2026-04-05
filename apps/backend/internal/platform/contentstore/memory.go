package contentstore

import (
	"context"
	"encoding/json"
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

func (s *MemoryStore) ReadMany(ctx context.Context, namespace string, keys []string) (map[string]Record, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	records := make(map[string]Record, len(keys))
	for _, key := range keys {
		record, ok := s.records[buildRecordKey(namespace, key)]
		if !ok {
			continue
		}
		records[key] = cloneRecord(record)
	}

	return records, nil
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
	if len(record.Payload) == 0 {
		record.Payload = json.RawMessage("null")
	}

	cloned := cloneRecord(record)
	s.records[buildRecordKey(record.Namespace, record.Key)] = cloned
	return cloneRecord(cloned), nil
}

func buildRecordKey(namespace string, key string) string {
	return namespace + "::" + key
}

func cloneRecord(record Record) Record {
	return Record{
		Namespace: record.Namespace,
		Key:       record.Key,
		SavedAt:   record.SavedAt,
		Payload:   append(json.RawMessage(nil), record.Payload...),
	}
}
