package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"bidanapp/apps/backend/internal/config"
	"bidanapp/apps/backend/internal/platform/database"
	"bidanapp/apps/backend/internal/seeding"
)

func main() {
	var (
		customerPassword     = flag.String("customer-password", "", "seed password for all customer accounts")
		format               = flag.String("format", "text", "seed report format: text or json")
		professionalPassword = flag.String("professional-password", "", "seed password for all professional accounts")
		reset                = flag.Bool("reset", true, "truncate mutable runtime tables before seeding")
		scenario             = flag.String("scenario", "comprehensive", "seed scenario to apply")
	)
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "load backend config: %v\n", err)
		os.Exit(1)
	}

	db, err := database.Open(context.Background(), cfg.Database.URL)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "open database connection: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	summary, err := seeding.Run(context.Background(), cfg, db, nil, seeding.Options{
		CustomerPassword:     *customerPassword,
		ProfessionalPassword: *professionalPassword,
		Reset:                *reset,
		Scenario:             *scenario,
	})
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "run backend seed: %v\n", err)
		os.Exit(1)
	}

	switch *format {
	case "text":
		if err := summary.WriteReport(os.Stdout); err != nil {
			_, _ = fmt.Fprintf(os.Stderr, "write backend seed report: %v\n", err)
			os.Exit(1)
		}
	case "json":
		if err := summary.WriteJSON(os.Stdout); err != nil {
			_, _ = fmt.Fprintf(os.Stderr, "write backend seed json report: %v\n", err)
			os.Exit(1)
		}
	default:
		_, _ = fmt.Fprintf(os.Stderr, "unsupported seed format %q\n", *format)
		os.Exit(1)
	}
}
