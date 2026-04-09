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
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/chat"
	"bidanapp/apps/backend/internal/modules/platformregistry"
	"bidanapp/apps/backend/internal/platform/authstore"
	"bidanapp/apps/backend/internal/platform/database"
	applog "bidanapp/apps/backend/internal/platform/log"
	"bidanapp/apps/backend/internal/platform/ratelimit"
	"bidanapp/apps/backend/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "load backend config: %v\n", err)
		os.Exit(1)
	}

	logger := applog.New(cfg.Observability.LogLevel, cfg.Observability.LogFormat)
	db, err := database.Open(context.Background(), cfg.Database.URL)
	if err != nil {
		logger.Error("database connection failed", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer db.Close()

	authStore := authstore.NewPostgresStore(db)
	platformRegistryService := platformregistry.NewService(db)
	if err := platformRegistryService.EnsureDefaults(context.Background()); err != nil {
		logger.Error("platform registry bootstrap failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	adminAuthService := adminauth.NewService(cfg.AdminAuth, authStore)
	if err := adminAuthService.Bootstrap(context.Background()); err != nil {
		logger.Error("admin auth bootstrap failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	authRateLimiter, err := ratelimit.OpenRedisLimiter(context.Background(), cfg.Redis.URL, cfg.AuthRateLimit)
	if err != nil {
		if cfg.App.Environment == "local" || cfg.App.Environment == "development" || cfg.App.Environment == "test" {
			logger.Warn(
				"redis auth rate limiter unavailable, falling back to in-memory limiter",
				slog.String("error", err.Error()),
				slog.String("env", cfg.App.Environment),
			)
			authRateLimiter = ratelimit.NewMemoryLimiter(cfg.AuthRateLimit)
		} else {
			logger.Error("redis auth rate limiter connection failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}
	if closer, ok := authRateLimiter.(interface{ Close() error }); ok {
		defer func() {
			_ = closer.Close()
		}()
	}

	router := apphttp.NewRouter(cfg, logger, apphttp.Dependencies{
		AuthRateLimiter: authRateLimiter,
		AuthStore:       authStore,
		ChatStore:       chat.NewPostgresStore(db),
		Database:        db,
	})
	httpServer := server.New(cfg, router)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		logger.Info("backend server starting",
			slog.String("service", cfg.App.Name),
			slog.String("version", cfg.App.Version),
			slog.String("env", cfg.App.Environment),
			slog.String("addr", cfg.HTTP.Address()),
			slog.Any("cors_allowed_origins", cfg.CORS.AllowedOrigins),
		)
		errCh <- httpServer.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("backend server failed", slog.String("error", err.Error()))
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

	logger.Info("backend server stopped")
}
