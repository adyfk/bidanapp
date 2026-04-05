package pushstore

import (
	"context"
	"sync"
	"time"
)

type MemoryStore struct {
	mu            sync.RWMutex
	subscriptions map[string]CustomerSubscription
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		subscriptions: map[string]CustomerSubscription{},
	}
}

func (s *MemoryStore) ListCustomerSubscriptions(_ context.Context, consumerID string) ([]CustomerSubscription, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]CustomerSubscription, 0)
	for _, subscription := range s.subscriptions {
		if subscription.ConsumerID == consumerID {
			result = append(result, subscription)
		}
	}

	return cloneSubscriptions(result), nil
}

func (s *MemoryStore) UpsertCustomerSubscription(
	_ context.Context,
	subscription CustomerSubscription,
) (CustomerSubscription, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	existing, ok := s.subscriptions[subscription.Endpoint]
	if ok {
		subscription.CreatedAt = existing.CreatedAt
	} else if subscription.CreatedAt.IsZero() {
		subscription.CreatedAt = now
	}
	if subscription.UpdatedAt.IsZero() {
		subscription.UpdatedAt = now
	}

	s.subscriptions[subscription.Endpoint] = subscription
	return subscription, nil
}

func (s *MemoryStore) DeleteCustomerSubscription(_ context.Context, consumerID string, endpoint string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	subscription, ok := s.subscriptions[endpoint]
	if !ok {
		return nil
	}
	if subscription.ConsumerID != consumerID {
		return ErrNotFound
	}

	delete(s.subscriptions, endpoint)
	return nil
}

func (s *MemoryStore) DeleteSubscriptionEndpoint(_ context.Context, endpoint string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.subscriptions, endpoint)
	return nil
}

func cloneSubscriptions(subscriptions []CustomerSubscription) []CustomerSubscription {
	if len(subscriptions) == 0 {
		return []CustomerSubscription{}
	}
	cloned := make([]CustomerSubscription, len(subscriptions))
	copy(cloned, subscriptions)
	return cloned
}
