package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"

	"bidanapp/apps/backend/internal/config"
	openapibuilder "bidanapp/apps/backend/internal/platform/openapi"
)

func main() {
	jsonOutput := flag.String("json", "", "path to write OpenAPI JSON")
	flag.Parse()

	if *jsonOutput == "" {
		_, _ = fmt.Fprintln(os.Stderr, "-json is required")
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "load backend config: %v\n", err)
		os.Exit(1)
	}

	api := openapibuilder.Build(http.NewServeMux(), cfg)

	bytes, err := json.MarshalIndent(api.OpenAPI(), "", "  ")
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "marshal openapi json: %v\n", err)
		os.Exit(1)
	}

	if err := os.WriteFile(*jsonOutput, bytes, 0o644); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "write openapi json: %v\n", err)
		os.Exit(1)
	}
}
