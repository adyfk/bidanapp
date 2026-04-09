package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/devseed"
	"bidanapp/apps/backend/internal/platform/database"
	applog "bidanapp/apps/backend/internal/platform/log"
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

	summary, err := devseed.SeedBidanDemo(context.Background(), db, cfg)
	if err != nil {
		logger.Error("seed bidan demo failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	fmt.Println("[seed] Bidan demo workspace ready")
	fmt.Println("[seed] Viewer password:", summary.ViewerPassword)
	fmt.Println("[seed] Customer login:", summary.CustomerPhone)
	fmt.Println("[seed] Approved professional login:", summary.ApprovedProfessionalPhone, "(", summary.ApprovedProfessionalName, ")")
	fmt.Println("[seed] Submitted professional login:", summary.SubmittedProfessionalPhone)
	if len(summary.AdminEmails) > 0 {
		fmt.Println("[seed] Admin password:", "AdminDemo#2026")
		fmt.Println("[seed] Admin emails:", strings.Join(summary.AdminEmails, ", "))
	}
}
