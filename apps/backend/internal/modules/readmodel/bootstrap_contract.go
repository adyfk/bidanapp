package readmodel

type ConsumerProfile struct {
	Index  int    `json:"index"`
	ID     string `json:"id"`
	Name   string `json:"name"`
	Phone  string `json:"phone"`
	Avatar string `json:"avatar"`
}

type Area struct {
	Index     int     `json:"index"`
	ID        string  `json:"id"`
	City      string  `json:"city"`
	District  string  `json:"district"`
	Province  string  `json:"province"`
	Label     string  `json:"label"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type UserContext struct {
	Index             int      `json:"index"`
	ID                string   `json:"id"`
	Area              Area     `json:"area"`
	CurrentArea       string   `json:"currentArea"`
	UserLocation      GeoPoint `json:"userLocation"`
	OnlineStatusLabel string   `json:"onlineStatusLabel"`
}

type AppSectionConfig struct {
	HomeCategoryIDs []string `json:"homeCategoryIds"`
}

type HomeFeedAppointmentSummary struct {
	ID     string            `json:"id"`
	Status AppointmentStatus `json:"status"`
}

type HomeFeedFeaturedAppointment struct {
	Appointment  HomeFeedAppointmentSummary `json:"appointment"`
	DateLabel    string                     `json:"dateLabel"`
	TimeLabel    string                     `json:"timeLabel"`
	Professional Professional               `json:"professional"`
}

type HomeFeedSnapshot struct {
	ID                  string                       `json:"id"`
	Title               string                       `json:"title"`
	CurrentUser         ConsumerProfile              `json:"currentUser"`
	SharedContext       UserContext                  `json:"sharedContext"`
	FeaturedAppointment *HomeFeedFeaturedAppointment `json:"featuredAppointment,omitempty"`
	PopularServices     []GlobalService              `json:"popularServices"`
	NearbyProfessionals []Professional               `json:"nearbyProfessionals"`
}

type BootstrapData struct {
	Catalog            CatalogData      `json:"catalog"`
	CurrentConsumer    ConsumerProfile  `json:"currentConsumer"`
	CurrentUserContext UserContext      `json:"currentUserContext"`
	AppSectionConfig   AppSectionConfig `json:"appSectionConfig"`
	ActiveHomeFeed     HomeFeedSnapshot `json:"activeHomeFeed"`
}
