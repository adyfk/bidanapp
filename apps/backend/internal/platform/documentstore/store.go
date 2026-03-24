package documentstore

import (
	"context"
	"errors"
	"time"
)

var (
	ErrNilDB    = errors.New("documentstore requires a database connection")
	ErrNotFound = errors.New("documentstore record not found")
)

type Record struct {
	Namespace string
	Key       string
	SavedAt   time.Time
	Snapshot  map[string]any
}

type Reader interface {
	Read(ctx context.Context, namespace string, key string) (Record, error)
}

type Store interface {
	Reader
	Upsert(ctx context.Context, record Record) (Record, error)
}
