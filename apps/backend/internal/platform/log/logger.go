package log

import (
	"log/slog"
	"os"
	"strings"
)

func New(level string, format string) *slog.Logger {
	options := &slog.HandlerOptions{Level: parseLevel(level)}

	if strings.EqualFold(format, "json") {
		return slog.New(slog.NewJSONHandler(os.Stdout, options))
	}

	return slog.New(slog.NewTextHandler(os.Stdout, options))
}

func parseLevel(value string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
