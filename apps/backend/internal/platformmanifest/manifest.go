package platformmanifest

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime"
)

type Manifest struct {
	Version   int                  `json:"version"`
	Platforms []PlatformDefinition `json:"platforms"`
}

type PlatformDefinition struct {
	DefaultLocale              string                                `json:"defaultLocale"`
	Description                string                                `json:"description"`
	Domains                    []string                              `json:"domains"`
	FeatureFlags               PlatformFeatureFlags                  `json:"featureFlags"`
	ID                         string                                `json:"id"`
	Name                       string                                `json:"name"`
	RegistrationSchema         PlatformRegistrationSchema            `json:"registrationSchema"`
	RegistrationSchemaByLocale map[string]PlatformRegistrationSchema `json:"registrationSchemaByLocale"`
	SEO                        PlatformSEOData                       `json:"seo"`
	SEOByLocale                map[string]PlatformSEOData            `json:"seoByLocale"`
	Slug                       string                                `json:"slug"`
	Summary                    string                                `json:"summary"`
	SupportedLocales           []string                              `json:"supportedLocales"`
	Theme                      PlatformThemeData                     `json:"theme"`
}

type PlatformFeatureFlags struct {
	AdminReview            bool `json:"adminReview"`
	Payments               bool `json:"payments"`
	ProfessionalDocuments  bool `json:"professionalDocuments"`
	ProfessionalOnboarding bool `json:"professionalOnboarding"`
}

type PlatformRegistrationSchema struct {
	Description string                    `json:"description"`
	Fields      []ProfessionalSchemaField `json:"fields"`
	Title       string                    `json:"title"`
	Version     int                       `json:"version"`
}

type ProfessionalSchemaField struct {
	HelperText  string `json:"helperText,omitempty"`
	Key         string `json:"key"`
	Label       string `json:"label"`
	Placeholder string `json:"placeholder,omitempty"`
	Required    bool   `json:"required"`
	Type        string `json:"type"`
}

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

func (p PlatformDefinition) ResolvedDefaultLocale() string {
	if p.DefaultLocale == "en" {
		return "en"
	}
	return "id"
}

func (p PlatformDefinition) ResolvedSupportedLocales() []string {
	if len(p.SupportedLocales) == 0 {
		return []string{p.ResolvedDefaultLocale()}
	}

	locales := make([]string, 0, len(p.SupportedLocales))
	seen := map[string]struct{}{}
	for _, locale := range append([]string{p.ResolvedDefaultLocale()}, p.SupportedLocales...) {
		resolved := normalizeLocale(locale)
		if _, ok := seen[resolved]; ok {
			continue
		}
		seen[resolved] = struct{}{}
		locales = append(locales, resolved)
	}
	return locales
}

func (p PlatformDefinition) ResolvedSEOFor(locale string) PlatformSEOData {
	if item, ok := p.SEOByLocale[normalizeLocale(locale)]; ok {
		return item
	}
	if item, ok := p.SEOByLocale[p.ResolvedDefaultLocale()]; ok {
		return item
	}
	return p.SEO
}

func (p PlatformDefinition) ResolvedRegistrationSchemaFor(locale string) PlatformRegistrationSchema {
	if item, ok := p.RegistrationSchemaByLocale[normalizeLocale(locale)]; ok {
		return item
	}
	if item, ok := p.RegistrationSchemaByLocale[p.ResolvedDefaultLocale()]; ok {
		return item
	}
	return p.RegistrationSchema
}

func Load() (Manifest, error) {
	path, err := manifestPath()
	if err != nil {
		return Manifest{}, err
	}

	payload, err := os.ReadFile(path)
	if err != nil {
		return Manifest{}, err
	}

	var manifest Manifest
	if err := json.Unmarshal(payload, &manifest); err != nil {
		return Manifest{}, err
	}

	return manifest, nil
}

func manifestPath() (string, error) {
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", errors.New("determine manifest path: runtime caller unavailable")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(currentFile), "../../../..", "config", "platform-manifest.json")), nil
}

func normalizeLocale(value string) string {
	if value == "en" {
		return "en"
	}
	return "id"
}
