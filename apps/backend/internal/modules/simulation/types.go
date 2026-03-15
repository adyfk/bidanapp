package simulation

type AppTerms struct {
	Professional string `json:"professional"`
	Category     string `json:"category"`
	Service      string `json:"service"`
	Location     string `json:"location"`
	Experience   string `json:"experience"`
	Patients     string `json:"patients"`
}

type AppColors struct {
	Primary      string `json:"primary"`
	PrimaryDark  string `json:"primaryDark"`
	PrimaryLight string `json:"primaryLight"`
	Secondary    string `json:"secondary"`
	Accent       string `json:"accent"`
	Success      string `json:"success"`
	Warning      string `json:"warning"`
	Danger       string `json:"danger"`
	DarkNav      string `json:"darkNav"`
	TextMain     string `json:"textMain"`
	TextMuted    string `json:"textMuted"`
	BgLight      string `json:"bgLight"`
}

type AppBranding struct {
	AppName        string `json:"appName"`
	SEODescription string `json:"seoDescription"`
	BaseURL        string `json:"baseUrl"`
	OGImage        string `json:"ogImage"`
}

type AppSettings struct {
	Branding AppBranding `json:"branding"`
	Terms    AppTerms    `json:"terms"`
	Colors   AppColors   `json:"colors"`
}

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
}

type ProfessionalService struct {
	Index     int    `json:"index"`
	ServiceID string `json:"serviceId"`
	Duration  string `json:"duration"`
	Price     string `json:"price"`
	Summary   string `json:"summary,omitempty"`
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
	Index       int      `json:"index"`
	Title       string   `json:"title"`
	ServiceID   string   `json:"serviceId,omitempty"`
	PeriodLabel string   `json:"periodLabel"`
	Summary     string   `json:"summary"`
	Outcomes    []string `json:"outcomes"`
	Image       string   `json:"image"`
}

type ProfessionalGalleryItem struct {
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

type Professional struct {
	Index             int                             `json:"index"`
	ID                string                          `json:"id"`
	Slug              string                          `json:"slug"`
	Name              string                          `json:"name"`
	Title             string                          `json:"title"`
	CategoryID        string                          `json:"categoryId"`
	Location          string                          `json:"location"`
	Rating            float64                         `json:"rating"`
	Reviews           string                          `json:"reviews"`
	Experience        string                          `json:"experience"`
	ClientsServed     string                          `json:"clientsServed"`
	Image             string                          `json:"image"`
	CoverImage        string                          `json:"coverImage,omitempty"`
	BadgeLabel        string                          `json:"badgeLabel"`
	AvailabilityLabel string                          `json:"availabilityLabel"`
	ResponseTime      string                          `json:"responseTime"`
	Specialties       []string                        `json:"specialties"`
	Languages         []string                        `json:"languages"`
	AddressLines      []string                        `json:"addressLines"`
	About             string                          `json:"about"`
	PortfolioStats    []ProfessionalPortfolioStat     `json:"portfolioStats"`
	Credentials       []ProfessionalCredential        `json:"credentials"`
	ActivityStories   []ProfessionalStory             `json:"activityStories"`
	PortfolioEntries  []ProfessionalPortfolioEntry    `json:"portfolioEntries"`
	Gallery           []ProfessionalGalleryItem       `json:"gallery"`
	Testimonials      []ProfessionalTestimonial       `json:"testimonials"`
	FeedbackSummary   ProfessionalFeedbackSummary     `json:"feedbackSummary"`
	FeedbackMetrics   []ProfessionalFeedbackMetric    `json:"feedbackMetrics"`
	FeedbackBreakdown []ProfessionalFeedbackBreakdown `json:"feedbackBreakdown"`
	RecentActivities  []ProfessionalRecentActivity    `json:"recentActivities"`
	Services          []ProfessionalService           `json:"services"`
}

type CatalogData struct {
	Categories    []Category      `json:"categories"`
	Services      []GlobalService `json:"services"`
	Professionals []Professional  `json:"professionals"`
}

type AppointmentStatus string

const (
	AppointmentStatusRequested              AppointmentStatus = "requested"
	AppointmentStatusApprovedWaitingPayment AppointmentStatus = "approved_waiting_payment"
	AppointmentStatusPaid                   AppointmentStatus = "paid"
	AppointmentStatusConfirmed              AppointmentStatus = "confirmed"
	AppointmentStatusInService              AppointmentStatus = "in_service"
	AppointmentStatusCompleted              AppointmentStatus = "completed"
	AppointmentStatusCancelled              AppointmentStatus = "cancelled"
	AppointmentStatusRejected               AppointmentStatus = "rejected"
	AppointmentStatusExpired                AppointmentStatus = "expired"
)

type AppointmentSeed struct {
	Index          int               `json:"index"`
	ID             string            `json:"id"`
	ProfessionalID string            `json:"professionalId"`
	ServiceID      string            `json:"serviceId"`
	Time           string            `json:"time"`
	Status         AppointmentStatus `json:"status"`
	TotalPrice     string            `json:"totalPrice"`
}

type AppointmentData struct {
	Appointments []AppointmentSeed `json:"appointments"`
}

type ChatSender string

const (
	ChatSenderUser         ChatSender = "user"
	ChatSenderProfessional ChatSender = "professional"
)

type ChatMessage struct {
	ID     int        `json:"id"`
	Text   string     `json:"text"`
	Sender ChatSender `json:"sender"`
	Time   string     `json:"time"`
	IsRead bool       `json:"isRead"`
}

type ChatThread struct {
	Index            int           `json:"index"`
	ID               string        `json:"id"`
	ProfessionalSlug string        `json:"professionalSlug"`
	AppointmentID    string        `json:"appointmentId,omitempty"`
	DayLabel         string        `json:"dayLabel"`
	InputPlaceholder string        `json:"inputPlaceholder"`
	AutoReplyText    string        `json:"autoReplyText,omitempty"`
	Messages         []ChatMessage `json:"messages"`
}

type ChatData struct {
	DirectThreads      []ChatThread `json:"directThreads"`
	AppointmentThreads []ChatThread `json:"appointmentThreads"`
}
