package ratelimit

import (
	"context"
	"fmt"
	"sync"
	"time"

	"bidanapp/apps/backend/internal/config"
)

type memoryLimiter struct {
	maxAttempts int
	window      time.Duration
	mu          sync.Mutex
	entries     map[string]memoryEntry
}

type memoryEntry struct {
	count     int
	expiresAt time.Time
}

func NewMemoryLimiter(cfg config.AuthRateLimitConfig) Limiter {
	return &memoryLimiter{
		maxAttempts: cfg.MaxAttempts,
		window:      cfg.Window,
		entries:     map[string]memoryEntry{},
	}
}

func (l *memoryLimiter) Allow(_ context.Context, bucket string, subject string) (Decision, error) {
	if l == nil || l.maxAttempts <= 0 || l.window <= 0 {
		return Decision{Allowed: true}, nil
	}

	now := time.Now().UTC()
	key := fmt.Sprintf("%s:%s", bucket, subject)

	l.mu.Lock()
	defer l.mu.Unlock()

	for currentKey, entry := range l.entries {
		if !now.Before(entry.expiresAt) {
			delete(l.entries, currentKey)
		}
	}

	entry, ok := l.entries[key]
	if !ok || !now.Before(entry.expiresAt) {
		l.entries[key] = memoryEntry{
			count:     1,
			expiresAt: now.Add(l.window),
		}
		return Decision{Allowed: true}, nil
	}

	if entry.count >= l.maxAttempts {
		return Decision{
			Allowed:    false,
			RetryAfter: time.Until(entry.expiresAt),
		}, nil
	}

	entry.count++
	l.entries[key] = entry
	return Decision{Allowed: true}, nil
}
