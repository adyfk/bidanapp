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

const publishedReadModelNamespace = "published_readmodel"

type DocumentRepository interface {
	Read(ctx context.Context, filename string) ([]byte, error)
	ReadMany(ctx context.Context, filenames []string) (map[string][]byte, error)
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

		if _, err := r.store.Read(ctx, publishedReadModelNamespace, entry.Name()); err == nil {
			continue
		} else if !errors.Is(err, contentstore.ErrNotFound) {
			return err
		}

		payload, err := r.readFile(entry.Name())
		if err != nil {
			return err
		}

		if _, err := r.store.Upsert(ctx, contentstore.Record{
			Namespace: publishedReadModelNamespace,
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
		record, err := r.store.Read(ctx, publishedReadModelNamespace, filename)
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
			Namespace: publishedReadModelNamespace,
			Key:       filename,
			SavedAt:   time.Now().UTC(),
			Payload:   payload,
		}); err != nil {
			return nil, err
		}
	}

	return payload, nil
}

func (r Repository) ReadMany(ctx context.Context, filenames []string) (map[string][]byte, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	orderedFilenames := uniqueFilenames(filenames)
	results := make(map[string][]byte, len(orderedFilenames))
	missing := append([]string(nil), orderedFilenames...)

	if r.store != nil {
		if batchReader, ok := r.store.(contentstore.BatchReader); ok {
			records, err := batchReader.ReadMany(ctx, publishedReadModelNamespace, orderedFilenames)
			if err != nil {
				return nil, err
			}

			nextMissing := make([]string, 0, len(orderedFilenames))
			for _, filename := range orderedFilenames {
				record, ok := records[filename]
				if !ok {
					nextMissing = append(nextMissing, filename)
					continue
				}
				results[filename] = append([]byte(nil), record.Payload...)
			}
			missing = nextMissing
		} else {
			nextMissing := make([]string, 0, len(orderedFilenames))
			for _, filename := range orderedFilenames {
				record, err := r.store.Read(ctx, publishedReadModelNamespace, filename)
				if err == nil {
					results[filename] = append([]byte(nil), record.Payload...)
					continue
				}
				if !errors.Is(err, contentstore.ErrNotFound) {
					return nil, err
				}
				nextMissing = append(nextMissing, filename)
			}
			missing = nextMissing
		}
	}

	now := time.Now().UTC()
	for _, filename := range missing {
		payload, err := r.readFile(filename)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			return nil, err
		}

		if r.store != nil {
			if _, err := r.store.Upsert(ctx, contentstore.Record{
				Namespace: publishedReadModelNamespace,
				Key:       filename,
				SavedAt:   now,
				Payload:   payload,
			}); err != nil {
				return nil, err
			}
		}

		results[filename] = payload
	}

	return results, nil
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

func uniqueFilenames(filenames []string) []string {
	seen := make(map[string]struct{}, len(filenames))
	ordered := make([]string, 0, len(filenames))
	for _, filename := range filenames {
		if filename == "" {
			continue
		}
		if _, ok := seen[filename]; ok {
			continue
		}
		seen[filename] = struct{}{}
		ordered = append(ordered, filename)
	}
	return ordered
}
