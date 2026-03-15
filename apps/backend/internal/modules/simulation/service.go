package simulation

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

var ErrNotFound = errors.New("resource not found")

type Service struct {
	dataDir string
}

type catalogEnvelope struct {
	Categories    json.RawMessage   `json:"categories"`
	Services      json.RawMessage   `json:"services"`
	Professionals []json.RawMessage `json:"professionals"`
}

type professionalLookup struct {
	Slug string `json:"slug"`
}

func NewService(dataDir string) Service {
	return Service{dataDir: dataDir}
}

func (s Service) Settings(ctx context.Context) (json.RawMessage, error) {
	return s.readRaw(ctx, "settings.json")
}

func (s Service) Catalog(ctx context.Context) (json.RawMessage, error) {
	return s.readRaw(ctx, "catalog.json")
}

func (s Service) Appointments(ctx context.Context) (json.RawMessage, error) {
	return s.readRaw(ctx, "appointments.json")
}

func (s Service) Chat(ctx context.Context) (json.RawMessage, error) {
	return s.readRaw(ctx, "chat.json")
}

func (s Service) Professionals(ctx context.Context) ([]json.RawMessage, error) {
	catalog, err := s.catalog(ctx)
	if err != nil {
		return nil, err
	}

	return catalog.Professionals, nil
}

func (s Service) ProfessionalBySlug(ctx context.Context, slug string) (json.RawMessage, error) {
	professionals, err := s.Professionals(ctx)
	if err != nil {
		return nil, err
	}

	for _, professional := range professionals {
		lookup := professionalLookup{}
		if err := json.Unmarshal(professional, &lookup); err != nil {
			return nil, err
		}

		if lookup.Slug == slug {
			return professional, nil
		}
	}

	return nil, ErrNotFound
}

func (s Service) catalog(ctx context.Context) (catalogEnvelope, error) {
	payload, err := s.Catalog(ctx)
	if err != nil {
		return catalogEnvelope{}, err
	}

	catalog := catalogEnvelope{}
	if err := json.Unmarshal(payload, &catalog); err != nil {
		return catalogEnvelope{}, err
	}

	return catalog, nil
}

func (s Service) readRaw(ctx context.Context, filename string) (json.RawMessage, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	path := filepath.Clean(filepath.Join(s.dataDir, filename))
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	if !json.Valid(bytes) {
		return nil, errors.New("invalid json payload")
	}

	return json.RawMessage(bytes), nil
}
