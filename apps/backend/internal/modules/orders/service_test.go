package orders

import "testing"

func TestNewIDAddsPrefix(t *testing.T) {
	value, err := newID("ord_")
	if err != nil {
		t.Fatalf("newID returned error: %v", err)
	}
	if len(value) <= len("ord_") || value[:4] != "ord_" {
		t.Fatalf("unexpected id: %s", value)
	}
}
