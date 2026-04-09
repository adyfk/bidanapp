package platformregistry

type PlatformThemeData struct {
	Accent              string `json:"accent"`
	Background          string `json:"background"`
	Border              string `json:"border"`
	BorderStrong        string `json:"borderStrong"`
	Danger              string `json:"danger"`
	FocusRing           string `json:"focusRing"`
	HeroGradient        string `json:"heroGradient"`
	HeroOverlay         string `json:"heroOverlay"`
	Info                string `json:"info"`
	Muted               string `json:"muted"`
	NavActiveBackground string `json:"navActiveBackground"`
	NavActiveText       string `json:"navActiveText"`
	PillBackground      string `json:"pillBackground"`
	PillText            string `json:"pillText"`
	Primary             string `json:"primary"`
	Secondary           string `json:"secondary"`
	Success             string `json:"success"`
	Surface             string `json:"surface"`
	SurfaceElevated     string `json:"surfaceElevated"`
	SurfaceMuted        string `json:"surfaceMuted"`
	Text                string `json:"text"`
	TextMuted           string `json:"textMuted"`
	TextStrong          string `json:"textStrong"`
	Warning             string `json:"warning"`
}

type PlatformSEOData struct {
	Description   string `json:"description"`
	OGDescription string `json:"ogDescription"`
	OGTitle       string `json:"ogTitle"`
	Title         string `json:"title"`
}

type PlatformFeatureFlags struct {
	AdminReview            bool `json:"adminReview"`
	Payments               bool `json:"payments"`
	ProfessionalDocuments  bool `json:"professionalDocuments"`
	ProfessionalOnboarding bool `json:"professionalOnboarding"`
}

type PlatformDefinition struct {
	ActiveSchemaVersion int                  `json:"activeSchemaVersion"`
	DefaultLocale       string               `json:"defaultLocale"`
	Description         string               `json:"description"`
	Domains             []string             `json:"domains"`
	FeatureFlags        PlatformFeatureFlags `json:"featureFlags"`
	ID                  string               `json:"id"`
	Name                string               `json:"name"`
	SEO                 PlatformSEOData      `json:"seo"`
	Slug                string               `json:"slug"`
	Status              string               `json:"status"`
	Summary             string               `json:"summary"`
	SupportedLocales    []string             `json:"supportedLocales"`
	Theme               PlatformThemeData    `json:"theme"`
}

type ProfessionalSchemaField struct {
	HelperText  string `json:"helperText,omitempty"`
	Key         string `json:"key"`
	Label       string `json:"label"`
	Placeholder string `json:"placeholder,omitempty"`
	Required    bool   `json:"required"`
	Type        string `json:"type"`
}

type PlatformProfessionalSchema struct {
	Description string                    `json:"description"`
	Fields      []ProfessionalSchemaField `json:"fields"`
	PlatformID  string                    `json:"platformId"`
	Title       string                    `json:"title"`
	Version     int                       `json:"version"`
}
