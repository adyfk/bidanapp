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
	apphttp "bidanapp/apps/backend/internal/http"
	applog "bidanapp/apps/backend/internal/platform/log"
	"bidanapp/apps/backend/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "load backend config: %v\n", err)
		os.Exit(1)
	}

	logger := applog.New(cfg.Observability.LogLevel, cfg.Observability.LogFormat)
	router := apphttp.NewRouter(cfg, logger)
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
