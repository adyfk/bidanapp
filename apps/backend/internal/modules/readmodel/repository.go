package readmodel

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/platform/contentstore"
)

const seedDataNamespace = "seeddata"

type SeedRepository interface {
	Read(ctx context.Context, filename string) ([]byte, error)
	EnsureBootstrapped(ctx context.Context) error
}

type Repository struct {
	dataDir string
	store   contentstore.Store
}

func NewRepository(dataDir string, store contentstore.Store) Repository {
	return Repository{
		dataDir: strings.TrimSpace(dataDir),
		store:   store,
	}
}

func (r Repository) EnsureBootstrapped(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if r.store == nil || r.dataDir == "" {
		return nil
	}

	entries, err := os.ReadDir(r.dataDir)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		if _, err := r.store.Read(ctx, seedDataNamespace, entry.Name()); err == nil {
			continue
		} else if !errors.Is(err, contentstore.ErrNotFound) {
			return err
		}

		payload, err := r.readFile(entry.Name())
		if err != nil {
			return err
		}

		if _, err := r.store.Upsert(ctx, contentstore.Record{
			Namespace: seedDataNamespace,
			Key:       entry.Name(),
			SavedAt:   now,
			Payload:   payload,
		}); err != nil {
			return err
		}
	}

	return nil
}

func (r Repository) Read(ctx context.Context, filename string) ([]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	if r.store != nil {
		record, err := r.store.Read(ctx, seedDataNamespace, filename)
		if err == nil {
			return append([]byte(nil), record.Payload...), nil
		}
		if !errors.Is(err, contentstore.ErrNotFound) {
			return nil, err
		}
	}

	payload, err := r.readFile(filename)
	if err != nil {
		return nil, err
	}

	if r.store != nil {
		if _, err := r.store.Upsert(ctx, contentstore.Record{
			Namespace: seedDataNamespace,
			Key:       filename,
			SavedAt:   time.Now().UTC(),
			Payload:   payload,
		}); err != nil {
			return nil, err
		}
	}

	return payload, nil
}

func (r Repository) readFile(filename string) ([]byte, error) {
	if r.dataDir == "" {
		return nil, os.ErrNotExist
	}

	path := filepath.Clean(filepath.Join(r.dataDir, filename))
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	if !json.Valid(payload) {
		return nil, fmt.Errorf("invalid json payload in %s", filename)
	}

	return payload, nil
}
