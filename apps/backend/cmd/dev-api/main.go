package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/devseed"
	apphttp "bidanapp/apps/backend/internal/http"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/chat"
	"bidanapp/apps/backend/internal/modules/customerauth"
	"bidanapp/apps/backend/internal/modules/professionalauth"
	"bidanapp/apps/backend/internal/modules/readmodel"
	"bidanapp/apps/backend/internal/platform/contentstore"
	"bidanapp/apps/backend/internal/platform/documentstore"
	applog "bidanapp/apps/backend/internal/platform/log"
	"bidanapp/apps/backend/internal/platform/portalstore"
	"bidanapp/apps/backend/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "load backend config: %v\n", err)
		os.Exit(1)
	}

	logger := applog.New(cfg.Observability.LogLevel, cfg.Observability.LogFormat)
	deps := apphttp.Dependencies{
		ChatStore:     chat.NewMemoryStore(),
		PortalStore:   portalstore.NewMemoryStore(),
		ContentStore:  contentstore.NewMemoryStore(),
		DocumentStore: documentstore.NewMemoryStore(),
	}
	readModelService := readmodel.NewServiceWithStore(cfg.SeedData.DataDir, deps.ContentStore, deps.PortalStore)
	if err := devseed.SeedAuthRuntime(context.Background(), cfg, devseed.RuntimeServices{
		AdminAuth:        adminauth.NewService(cfg.AdminAuth, deps.DocumentStore),
		CustomerAuth:     customerauth.NewService(cfg.CustomerAuth, deps.DocumentStore),
		ProfessionalAuth: professionalauth.NewService(cfg.ProfessionalAuth, readModelService, deps.DocumentStore),
	}); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "seed backend dev auth runtime: %v\n", err)
		os.Exit(1)
	}

	router := apphttp.NewRouter(cfg, logger, deps)
	httpServer := server.New(cfg, router)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		logger.Info("backend dev server starting",
			slog.String("service", cfg.App.Name),
			slog.String("version", cfg.App.Version),
			slog.String("env", cfg.App.Environment),
			slog.String("addr", cfg.HTTP.Address()),
			slog.Any("cors_allowed_origins", cfg.CORS.AllowedOrigins),
			slog.String("seed_data_dir", cfg.SeedData.DataDir),
		)
		errCh <- httpServer.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("backend dev server failed", slog.String("error", err.Error()))
			return
		}
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.HTTP.ShutdownTimeout)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", slog.String("error", err.Error()))
		return
	}

	logger.Info("backend dev server stopped")
}
