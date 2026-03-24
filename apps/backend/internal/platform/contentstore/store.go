package contentstore

import (
	"context"
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrNilDB    = errors.New("contentstore requires a database connection")
	ErrNotFound = errors.New("contentstore record not found")
)

type Record struct {
	Namespace string
	Key       string
	SavedAt   time.Time
	Payload   json.RawMessage
}

type Reader interface {
	Read(ctx context.Context, namespace string, key string) (Record, error)
}

type Store interface {
	Reader
	Upsert(ctx context.Context, record Record) (Record, error)
}
