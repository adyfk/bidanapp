package config

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func loadEnvFiles(appRoot string) error {
	originalEnv := snapshotEnv()
	mergedValues := map[string]string{}

	baseFiles := []string{
		filepath.Join(appRoot, ".env"),
		filepath.Join(appRoot, ".env.local"),
	}

	for _, path := range baseFiles {
		if err := mergeEnvFile(path, mergedValues); err != nil {
			return err
		}
	}

	environment := firstNonEmpty(originalEnv["APP_ENV"], mergedValues["APP_ENV"], "local")
	envFiles := []string{
		filepath.Join(appRoot, ".env."+environment),
		filepath.Join(appRoot, ".env."+environment+".local"),
	}

	for _, path := range envFiles {
		if err := mergeEnvFile(path, mergedValues); err != nil {
			return err
		}
	}

	for key, value := range mergedValues {
		if _, exists := originalEnv[key]; exists {
			continue
		}

		if err := os.Setenv(key, value); err != nil {
			return fmt.Errorf("set env %q: %w", key, err)
		}
	}

	return nil
}

func mergeEnvFile(path string, destination map[string]string) error {
	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}

		return fmt.Errorf("open %s: %w", path, err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineNumber := 0

	for scanner.Scan() {
		lineNumber++
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			return fmt.Errorf("parse %s:%d: expected KEY=VALUE", path, lineNumber)
		}

		key = strings.TrimSpace(strings.TrimPrefix(key, "export "))
		if key == "" {
			return fmt.Errorf("parse %s:%d: empty key", path, lineNumber)
		}

		destination[key] = parseEnvValue(value)
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("scan %s: %w", path, err)
	}

	return nil
}

func parseEnvValue(raw string) string {
	value := strings.TrimSpace(raw)
	if len(value) < 2 {
		return value
	}

	if strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"") {
		return strings.Trim(value, "\"")
	}

	if strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'") {
		return strings.Trim(value, "'")
	}

	return value
}

func snapshotEnv() map[string]string {
	values := map[string]string{}

	for _, item := range os.Environ() {
		key, value, ok := strings.Cut(item, "=")
		if ok {
			values[key] = value
		}
	}

	return values
}
