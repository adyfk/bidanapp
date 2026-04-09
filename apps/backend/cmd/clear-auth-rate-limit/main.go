package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"

	"bidanapp/apps/backend/internal/config"
)

const authRateLimitKeyPattern = "bidanapp:auth-rate-limit:*"

func main() {
	cfg, err := config.Load()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "load backend config: %v\n", err)
		os.Exit(1)
	}

	options, err := redis.ParseURL(cfg.Redis.URL)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "parse redis url: %v\n", err)
		os.Exit(1)
	}

	client := redis.NewClient(options)
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "ping redis: %v\n", err)
		os.Exit(1)
	}

	var (
		cursor uint64
		keys   []string
	)

	for {
		batch, nextCursor, err := client.Scan(ctx, cursor, authRateLimitKeyPattern, 100).Result()
		if err != nil {
			_, _ = fmt.Fprintf(os.Stderr, "scan redis keys: %v\n", err)
			os.Exit(1)
		}

		keys = append(keys, batch...)
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	if len(keys) == 0 {
		fmt.Println("cleared 0 auth rate limit keys")
		return
	}

	deleted, err := client.Del(ctx, keys...).Result()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "delete redis keys: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("cleared %d auth rate limit keys\n", deleted)
}
