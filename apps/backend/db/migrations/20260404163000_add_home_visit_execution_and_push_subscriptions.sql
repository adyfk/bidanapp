CREATE TABLE appointment_home_visit_executions (
  appointment_id text PRIMARY KEY,
  professional_id text NOT NULL,
  consumer_id text NOT NULL,
  requested_mode text NOT NULL DEFAULT 'home_visit',
  execution_status text NOT NULL DEFAULT 'pending_departure',
  departure_origin_lat double precision NULL,
  departure_origin_lng double precision NULL,
  destination_lat double precision NULL,
  destination_lng double precision NULL,
  distance_km_hint double precision NULL,
  eta_minutes_hint integer NULL,
  departed_at timestamptz NULL,
  service_started_at timestamptz NULL,
  closed_at timestamptz NULL,
  last_computed_at timestamptz NULL,
  departure_notification_sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointment_home_visit_executions_requested_mode_check CHECK (requested_mode = 'home_visit'),
  CONSTRAINT appointment_home_visit_executions_status_check CHECK (
    execution_status IN ('pending_departure', 'departed', 'service_started', 'closed')
  ),
  CONSTRAINT appointment_home_visit_executions_origin_pair_check CHECK (
    (departure_origin_lat IS NULL) = (departure_origin_lng IS NULL)
  ),
  CONSTRAINT appointment_home_visit_executions_destination_pair_check CHECK (
    (destination_lat IS NULL) = (destination_lng IS NULL)
  ),
  CONSTRAINT appointment_home_visit_executions_distance_km_hint_check CHECK (
    distance_km_hint IS NULL OR distance_km_hint >= 0
  ),
  CONSTRAINT appointment_home_visit_executions_eta_minutes_hint_check CHECK (
    eta_minutes_hint IS NULL OR eta_minutes_hint >= 0
  )
);

CREATE INDEX appointment_home_visit_executions_consumer_status_updated_idx
  ON appointment_home_visit_executions (consumer_id, execution_status, updated_at DESC);

CREATE INDEX appointment_home_visit_executions_professional_status_updated_idx
  ON appointment_home_visit_executions (professional_id, execution_status, updated_at DESC);

CREATE TABLE customer_push_subscriptions (
  endpoint text PRIMARY KEY,
  consumer_id text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  locale text NOT NULL DEFAULT 'id',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_push_subscriptions_consumer_updated_idx
  ON customer_push_subscriptions (consumer_id, updated_at DESC);
