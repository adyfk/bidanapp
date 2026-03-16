package simulation

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
