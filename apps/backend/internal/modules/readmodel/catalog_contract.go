package readmodel

type ServiceType string

const (
	ServiceTypeVisit        ServiceType = "visit"
	ServiceTypeConsultation ServiceType = "consultation"
)

type Category struct {
	Index          int      `json:"index"`
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	ShortLabel     string   `json:"shortLabel"`
	Description    string   `json:"description,omitempty"`
	Image          string   `json:"image"`
	IconImage      string   `json:"iconImage"`
	CoverImage     string   `json:"coverImage,omitempty"`
	AccentColor    string   `json:"accentColor"`
	OverviewPoints []string `json:"overviewPoints"`
}

type GlobalService struct {
	Index            int         `json:"index"`
	ID               string      `json:"id"`
	Slug             string      `json:"slug"`
	Name             string      `json:"name"`
	CategoryID       string      `json:"categoryId"`
	Description      string      `json:"description"`
	ShortDescription string      `json:"shortDescription"`
	Type             ServiceType `json:"type"`
	Image            string      `json:"image"`
	CoverImage       string      `json:"coverImage"`
	Badge            string      `json:"badge"`
	Tags             []string    `json:"tags"`
	Highlights       []string    `json:"highlights"`
	DefaultMode      string      `json:"defaultMode"`
	ServiceModes     ServiceMode `json:"serviceModes"`
}

type ServiceMode struct {
	Online    bool `json:"online"`
	HomeVisit bool `json:"homeVisit"`
	Onsite    bool `json:"onsite"`
}

type ProfessionalService struct {
	Index        int         `json:"index"`
	ID           string      `json:"id"`
	ServiceID    string      `json:"serviceId"`
	Duration     string      `json:"duration"`
	Price        string      `json:"price"`
	Summary      string      `json:"summary,omitempty"`
	ServiceModes ServiceMode `json:"serviceModes"`
	DefaultMode  string      `json:"defaultMode"`
	BookingFlow  string      `json:"bookingFlow"`
}

type ProfessionalPortfolioStat struct {
	Index  int    `json:"index"`
	Label  string `json:"label"`
	Value  string `json:"value"`
	Detail string `json:"detail"`
}

type ProfessionalCredential struct {
	Index  int    `json:"index"`
	Title  string `json:"title"`
	Issuer string `json:"issuer"`
	Year   string `json:"year"`
	Note   string `json:"note"`
}

type ProfessionalStory struct {
	Index      int    `json:"index"`
	Title      string `json:"title"`
	Image      string `json:"image"`
	CapturedAt string `json:"capturedAt"`
	Location   string `json:"location"`
	Note       string `json:"note"`
}

type ProfessionalPortfolioEntry struct {
	ID          string   `json:"id"`
	Index       int      `json:"index"`
	Title       string   `json:"title"`
	ServiceID   string   `json:"serviceId,omitempty"`
	PeriodLabel string   `json:"periodLabel"`
	Summary     string   `json:"summary"`
	Outcomes    []string `json:"outcomes"`
	Image       string   `json:"image"`
}

type ProfessionalGalleryItem struct {
	ID    string `json:"id"`
	Index int    `json:"index"`
	Image string `json:"image"`
	Alt   string `json:"alt"`
	Label string `json:"label"`
}

type ProfessionalTestimonial struct {
	Index     int     `json:"index"`
	Author    string  `json:"author"`
	Role      string  `json:"role"`
	Rating    float64 `json:"rating"`
	DateLabel string  `json:"dateLabel"`
	Quote     string  `json:"quote"`
	ServiceID string  `json:"serviceId,omitempty"`
	Image     string  `json:"image"`
}

type ProfessionalFeedbackSummary struct {
	RecommendationRate string `json:"recommendationRate"`
	RepeatClientRate   string `json:"repeatClientRate"`
}

type ProfessionalFeedbackMetric struct {
	Index  int    `json:"index"`
	Label  string `json:"label"`
	Value  string `json:"value"`
	Detail string `json:"detail"`
}

type ProfessionalFeedbackBreakdown struct {
	Index      int     `json:"index"`
	Label      string  `json:"label"`
	Total      string  `json:"total"`
	Percentage float64 `json:"percentage"`
}

type ProfessionalRecentActivity struct {
	Index     int    `json:"index"`
	DateLabel string `json:"dateLabel"`
	Title     string `json:"title"`
	Channel   string `json:"channel"`
	Summary   string `json:"summary"`
}

type GeoPoint struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type ProfessionalAvailability struct {
	IsAvailable bool `json:"isAvailable"`
}

type ProfessionalPracticeLocation struct {
	Label       string   `json:"label"`
	Address     string   `json:"address"`
	AreaID      string   `json:"areaId"`
	Coordinates GeoPoint `json:"coordinates"`
}

type ProfessionalCoverage struct {
	AreaIDs           []string `json:"areaIds"`
	HomeVisitRadiusKm int      `json:"homeVisitRadiusKm"`
	Center            GeoPoint `json:"center"`
}

type ProfessionalWeeklyAvailabilityWindow struct {
	EndTime             string `json:"endTime"`
	ID                  string `json:"id"`
	Index               int    `json:"index"`
	IsEnabled           bool   `json:"isEnabled"`
	SlotIntervalMinutes int    `json:"slotIntervalMinutes"`
	StartTime           string `json:"startTime"`
	Weekday             string `json:"weekday"`
}

type ProfessionalAvailabilityDateOverride struct {
	DateISO             string `json:"dateIso"`
	EndTime             string `json:"endTime,omitempty"`
	ID                  string `json:"id"`
	Index               int    `json:"index"`
	IsClosed            bool   `json:"isClosed"`
	Note                string `json:"note,omitempty"`
	SlotIntervalMinutes *int   `json:"slotIntervalMinutes,omitempty"`
	StartTime           string `json:"startTime,omitempty"`
}

type ProfessionalAvailabilityRules struct {
	DateOverrides      []ProfessionalAvailabilityDateOverride `json:"dateOverrides"`
	MinimumNoticeHours int                                    `json:"minimumNoticeHours"`
	WeeklyHours        []ProfessionalWeeklyAvailabilityWindow `json:"weeklyHours"`
}

type ProfessionalCancellationPolicy struct {
	CustomerPaidCancelCutoffHours int    `json:"customerPaidCancelCutoffHours"`
	ProfessionalCancelOutcome     string `json:"professionalCancelOutcome"`
	BeforeCutoffOutcome           string `json:"beforeCutoffOutcome"`
	AfterCutoffOutcome            string `json:"afterCutoffOutcome"`
}

type Professional struct {
	Index                      int                                       `json:"index"`
	ID                         string                                    `json:"id"`
	Slug                       string                                    `json:"slug"`
	Name                       string                                    `json:"name"`
	Title                      string                                    `json:"title"`
	Gender                     string                                    `json:"gender"`
	CategoryID                 string                                    `json:"categoryId"`
	Location                   string                                    `json:"location"`
	Rating                     float64                                   `json:"rating"`
	Reviews                    string                                    `json:"reviews"`
	Experience                 string                                    `json:"experience"`
	ClientsServed              string                                    `json:"clientsServed"`
	Image                      string                                    `json:"image"`
	CoverImage                 string                                    `json:"coverImage,omitempty"`
	BadgeLabel                 string                                    `json:"badgeLabel"`
	AvailabilityLabel          string                                    `json:"availabilityLabel"`
	Availability               ProfessionalAvailability                  `json:"availability"`
	ResponseTime               string                                    `json:"responseTime"`
	Specialties                []string                                  `json:"specialties"`
	Languages                  []string                                  `json:"languages"`
	AddressLines               []string                                  `json:"addressLines"`
	PracticeLocation           *ProfessionalPracticeLocation             `json:"practiceLocation,omitempty"`
	Coverage                   ProfessionalCoverage                      `json:"coverage"`
	About                      string                                    `json:"about"`
	PortfolioStats             []ProfessionalPortfolioStat               `json:"portfolioStats"`
	Credentials                []ProfessionalCredential                  `json:"credentials"`
	ActivityStories            []ProfessionalStory                       `json:"activityStories"`
	PortfolioEntries           []ProfessionalPortfolioEntry              `json:"portfolioEntries"`
	Gallery                    []ProfessionalGalleryItem                 `json:"gallery"`
	Testimonials               []ProfessionalTestimonial                 `json:"testimonials"`
	FeedbackSummary            ProfessionalFeedbackSummary               `json:"feedbackSummary"`
	FeedbackMetrics            []ProfessionalFeedbackMetric              `json:"feedbackMetrics"`
	FeedbackBreakdown          []ProfessionalFeedbackBreakdown           `json:"feedbackBreakdown"`
	RecentActivities           []ProfessionalRecentActivity              `json:"recentActivities"`
	AvailabilityRulesByMode    map[string]ProfessionalAvailabilityRules  `json:"availabilityRulesByMode,omitempty"`
	CancellationPoliciesByMode map[string]ProfessionalCancellationPolicy `json:"cancellationPoliciesByMode,omitempty"`
	Services                   []ProfessionalService                     `json:"services"`
}

type CatalogData struct {
	Areas         []Area          `json:"areas"`
	Categories    []Category      `json:"categories"`
	Services      []GlobalService `json:"services"`
	Professionals []Professional  `json:"professionals"`
}
