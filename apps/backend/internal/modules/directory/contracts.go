package directory

type DirectoryProfessional struct {
	Attributes    map[string]any `json:"attributes"`
	City          string         `json:"city"`
	CoverageAreas []string       `json:"coverageAreas"`
	DisplayName   string         `json:"displayName"`
	ID            string         `json:"id"`
	OfferingCount int            `json:"offeringCount"`
	PlatformID    string         `json:"platformId"`
	Slug          string         `json:"slug"`
	StartingPrice int            `json:"startingPrice"`
	UserID        string         `json:"userId"`
}

type DirectoryProfessionalList struct {
	Professionals []DirectoryProfessional `json:"professionals"`
}

type DirectoryProfessionalDetail struct {
	Availability DirectoryProfessionalAvailabilitySummary `json:"availability"`
	Coverage     DirectoryProfessionalCoverageSummary     `json:"coverage"`
	Credentials  []DirectoryTrustCredential               `json:"credentials"`
	Gallery      []DirectoryProfessionalGalleryItem       `json:"gallery"`
	Offerings    []DirectoryOffering                      `json:"offerings"`
	Portfolio    []DirectoryProfessionalPortfolioItem     `json:"portfolio"`
	Professional DirectoryProfessional                    `json:"professional"`
	Profile      DirectoryProfessionalPublicProfile       `json:"profile"`
	Stories      []DirectoryStory                         `json:"stories"`
	TrustMetrics []DirectoryProfessionalTrustMetric       `json:"trustMetrics"`
}

type DirectoryProfessionalPublicProfile struct {
	Bio              string   `json:"bio"`
	EducationHistory string   `json:"educationHistory"`
	Headline         string   `json:"headline"`
	Languages        []string `json:"languages"`
	LicenseText      string   `json:"licenseText"`
	Specialties      []string `json:"specialties"`
	YearsExperience  int      `json:"yearsExperience"`
}

type DirectoryProfessionalPortfolioItem struct {
	AssetURL    string `json:"assetUrl"`
	Description string `json:"description"`
	ID          string `json:"id"`
	SortOrder   int    `json:"sortOrder"`
	Title       string `json:"title"`
}

type DirectoryProfessionalGalleryItem struct {
	AssetURL  string `json:"assetUrl"`
	Caption   string `json:"caption"`
	FileName  string `json:"fileName"`
	ID        string `json:"id"`
	SortOrder int    `json:"sortOrder"`
}

type DirectoryProfessionalCoverageSummary struct {
	Areas            []string `json:"areas"`
	Cities           []string `json:"cities"`
	PracticeLocation string   `json:"practiceLocation"`
}

type DirectoryProfessionalAvailabilitySummary struct {
	Slots []string `json:"slots"`
	Text  string   `json:"text"`
}

type DirectoryProfessionalTrustMetric struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Value string `json:"value"`
}

type DirectoryOffering struct {
	Currency                string `json:"currency"`
	DeliveryMode            string `json:"deliveryMode"`
	Description             string `json:"description"`
	ID                      string `json:"id"`
	OfferingType            string `json:"offeringType"`
	PlatformID              string `json:"platformId"`
	PriceAmount             int    `json:"priceAmount"`
	ProfessionalDisplayName string `json:"professionalDisplayName"`
	ProfessionalID          string `json:"professionalId"`
	ProfessionalSlug        string `json:"professionalSlug"`
	ProfessionalUserID      string `json:"professionalUserId"`
	Slug                    string `json:"slug"`
	Title                   string `json:"title"`
}

type DirectoryOfferingList struct {
	Offerings []DirectoryOffering `json:"offerings"`
}

type DirectoryOfferingDetail struct {
	Offering DirectoryOffering   `json:"offering"`
	Related  []DirectoryOffering `json:"related"`
}

type DirectoryStory struct {
	Body        string `json:"body"`
	ID          string `json:"id"`
	IsPublished bool   `json:"isPublished"`
	SortOrder   int    `json:"sortOrder"`
	Title       string `json:"title"`
}

type DirectoryTrustCredential struct {
	CredentialCode string `json:"credentialCode"`
	Issuer         string `json:"issuer"`
	Label          string `json:"label"`
}
