package ratelimit

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"bidanapp/apps/backend/internal/config"
)

var allowScript = redis.NewScript(`
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {count, ttl}
`)

type redisLimiter struct {
	client      *redis.Client
	keyPrefix   string
	maxAttempts int
	window      time.Duration
}

func OpenRedisLimiter(ctx context.Context, redisURL string, cfg config.AuthRateLimitConfig) (Limiter, error) {
	options, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(options)
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return nil, err
	}

	return &redisLimiter{
		client:      client,
		keyPrefix:   "bidanapp:auth-rate-limit",
		maxAttempts: cfg.MaxAttempts,
		window:      cfg.Window,
	}, nil
}

func (l *redisLimiter) Allow(ctx context.Context, bucket string, subject string) (Decision, error) {
	if l == nil || l.maxAttempts <= 0 || l.window <= 0 {
		return Decision{Allowed: true}, nil
	}

	key := fmt.Sprintf("%s:%s:%s", l.keyPrefix, bucket, subject)
	result, err := allowScript.Run(ctx, l.client, []string{key}, l.window.Milliseconds()).Result()
	if err != nil {
		return Decision{}, err
	}

	values, ok := result.([]any)
	if !ok || len(values) != 2 {
		return Decision{}, fmt.Errorf("unexpected redis rate limit response: %T", result)
	}

	count, err := toInt64(values[0])
	if err != nil {
		return Decision{}, err
	}

	ttlMilliseconds, err := toInt64(values[1])
	if err != nil {
		return Decision{}, err
	}

	if count > int64(l.maxAttempts) {
		retryAfter := time.Duration(ttlMilliseconds) * time.Millisecond
		if retryAfter < 0 {
			retryAfter = 0
		}

		return Decision{
			Allowed:    false,
			RetryAfter: retryAfter,
		}, nil
	}

	return Decision{Allowed: true}, nil
}

func (l *redisLimiter) Close() error {
	if l == nil || l.client == nil {
		return nil
	}

	return l.client.Close()
}

func toInt64(value any) (int64, error) {
	switch typed := value.(type) {
	case int64:
		return typed, nil
	case int:
		return int64(typed), nil
	case string:
		return strconv.ParseInt(typed, 10, 64)
	default:
		return 0, fmt.Errorf("unexpected integer value type %T", value)
	}
}
