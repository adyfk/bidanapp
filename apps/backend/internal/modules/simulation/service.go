package simulation

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
)

var ErrNotFound = errors.New("resource not found")
var ErrInvalidSlug = errors.New("invalid slug")

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type Service struct {
	dataDir string
}

func NewService(dataDir string) Service {
	return Service{dataDir: dataDir}
}

func (s Service) Settings(ctx context.Context) (AppSettings, error) {
	return readJSON[AppSettings](ctx, s.dataDir, "settings.json")
}

func (s Service) Catalog(ctx context.Context) (CatalogData, error) {
	return readJSON[CatalogData](ctx, s.dataDir, "catalog.json")
}

func (s Service) Appointments(ctx context.Context) (AppointmentData, error) {
	return readJSON[AppointmentData](ctx, s.dataDir, "appointments.json")
}

func (s Service) Chat(ctx context.Context) (ChatData, error) {
	return readJSON[ChatData](ctx, s.dataDir, "chat.json")
}

func (s Service) Professionals(ctx context.Context) ([]Professional, error) {
	catalog, err := s.Catalog(ctx)
	if err != nil {
		return nil, err
	}

	return catalog.Professionals, nil
}

func (s Service) ProfessionalBySlug(ctx context.Context, slug string) (Professional, error) {
	if !slugPattern.MatchString(slug) {
		return Professional{}, ErrInvalidSlug
	}

	professionals, err := s.Professionals(ctx)
	if err != nil {
		return Professional{}, err
	}

	for _, professional := range professionals {
		if professional.Slug == slug {
			return professional, nil
		}
	}

	return Professional{}, ErrNotFound
}

func readJSON[T any](ctx context.Context, dataDir string, filename string) (T, error) {
	var zero T

	select {
	case <-ctx.Done():
		return zero, ctx.Err()
	default:
	}

	path := filepath.Clean(filepath.Join(dataDir, filename))
	bytes, err := os.ReadFile(path)
	if err != nil {
		return zero, err
	}

	if !json.Valid(bytes) {
		return zero, errors.New("invalid json payload")
	}

	var payload T
	if err := json.Unmarshal(bytes, &payload); err != nil {
		return zero, err
	}

	return payload, nil
}
