package professionalonboarding

import (
	"testing"

	"bidanapp/apps/backend/internal/modules/platformregistry"
)

func TestValidateAttributesRequiresConfiguredFields(t *testing.T) {
	schema := platformregistry.PlatformProfessionalSchema{
		Fields: []platformregistry.ProfessionalSchemaField{
			{Key: "str_number", Type: "text", Required: true},
		},
	}

	err := validateAttributes(schema, map[string]any{})
	if err == nil {
		t.Fatal("expected validation error")
	}
}
