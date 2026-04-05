CREATE TABLE chat_threads (
  id text PRIMARY KEY,
  title text NOT NULL,
  participant_kind text NOT NULL,
  participant_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_threads_participant_kind_check CHECK (
    participant_kind IN ('appointment', 'professional', 'conversation')
  )
);

CREATE TABLE chat_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_kind text NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_sender_kind_check CHECK (
    sender_kind IN ('user', 'professional', 'system', 'client')
  )
);

CREATE INDEX chat_messages_thread_id_sent_at_idx
  ON chat_messages (thread_id, sent_at DESC);

CREATE TABLE professional_portal_states (
  professional_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 10,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  appointment_records jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT professional_portal_states_schema_version_check CHECK (schema_version >= 1)
);

CREATE TABLE professional_portal_runtime_state (
  document_key text PRIMARY KEY,
  last_active_professional_id text NULL REFERENCES professional_portal_states(professional_id) ON DELETE SET NULL
);

CREATE TABLE viewer_session_states (
  document_key text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE customer_notification_states (
  consumer_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE professional_notification_states (
  professional_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE consumer_preference_states (
  consumer_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE admin_session_states (
  document_key text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE admin_support_desk_states (
  document_key text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1,
  revision bigint NOT NULL DEFAULT 1,
  command_center jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE support_tickets (
  id text PRIMARY KEY,
  sort_index integer NOT NULL DEFAULT 0,
  assigned_admin_id text NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE SET NULL,
  category_id text NOT NULL DEFAULT '',
  contact_value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  details text NOT NULL DEFAULT '',
  eta_key text NOT NULL DEFAULT '',
  preferred_channel text NOT NULL DEFAULT '',
  reference_code text NOT NULL DEFAULT '',
  related_appointment_id text NOT NULL DEFAULT '',
  related_professional_id text NULL REFERENCES professional_auth_accounts(professional_id) ON DELETE SET NULL,
  reporter_id text NOT NULL DEFAULT '',
  reporter_name text NOT NULL DEFAULT '',
  reporter_phone text NOT NULL DEFAULT '',
  reporter_role text NOT NULL DEFAULT '',
  source_surface text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  urgency text NOT NULL DEFAULT '',
  CONSTRAINT support_tickets_eta_key_check CHECK (eta_key IN ('normal', 'high', 'urgent')),
  CONSTRAINT support_tickets_preferred_channel_check CHECK (preferred_channel IN ('call', 'email', 'whatsapp')),
  CONSTRAINT support_tickets_reporter_role_check CHECK (reporter_role IN ('customer', 'professional')),
  CONSTRAINT support_tickets_source_surface_check CHECK (
    source_surface IN ('admin_manual', 'profile_customer', 'profile_professional')
  ),
  CONSTRAINT support_tickets_status_check CHECK (status IN ('new', 'triaged', 'reviewing', 'resolved', 'refunded')),
  CONSTRAINT support_tickets_urgency_check CHECK (urgency IN ('normal', 'high', 'urgent'))
);

CREATE INDEX support_tickets_sort_idx
  ON support_tickets (sort_index, id);

CREATE INDEX support_tickets_status_urgency_updated_at_idx
  ON support_tickets (status, urgency, updated_at DESC);

CREATE INDEX support_tickets_assigned_admin_status_updated_at_idx
  ON support_tickets (assigned_admin_id, status, updated_at DESC);

CREATE INDEX support_tickets_reporter_role_id_updated_at_idx
  ON support_tickets (reporter_role, reporter_id, updated_at DESC);

CREATE TABLE admin_console_states (
  document_key text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1,
  revision bigint NOT NULL DEFAULT 1
);

CREATE TABLE admin_console_tables (
  table_name text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1,
  revision bigint NOT NULL DEFAULT 1
);

CREATE TABLE admin_console_table_rows (
  table_name text NOT NULL REFERENCES admin_console_tables(table_name) ON DELETE CASCADE,
  row_index integer NOT NULL,
  row_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (table_name, row_index)
);

CREATE TABLE published_readmodel_documents (
  file_name text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  revision bigint NOT NULL DEFAULT 1,
  payload jsonb NOT NULL DEFAULT 'null'::jsonb
);

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

CREATE TABLE auth_users (
  id text PRIMARY KEY,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  verified_at timestamptz NULL,
  verified_channel text NOT NULL DEFAULT '',
  disabled_at timestamptz NULL,
  deletion_requested_at timestamptz NULL,
  retention_state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_users_role_check CHECK (role IN ('customer', 'professional', 'admin')),
  CONSTRAINT auth_users_status_check CHECK (status IN ('active', 'disabled', 'pending_verification', 'deleted')),
  CONSTRAINT auth_users_retention_state_check CHECK (retention_state IN ('active', 'pending_deletion', 'deleted')),
  CONSTRAINT auth_users_verified_channel_check CHECK (
    verified_channel = '' OR verified_channel IN ('admin_review', 'otp_sms', 'otp_whatsapp', 'manual')
  )
);

CREATE TABLE customer_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  consumer_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  phone text NOT NULL,
  phone_normalized text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE professional_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  professional_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  phone text NOT NULL,
  phone_normalized text NOT NULL UNIQUE,
  credential_number text NOT NULL,
  password_hash text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  recovery_requested_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  admin_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  focus_area text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_auth_accounts_focus_area_check CHECK (
    focus_area IN ('catalog', 'ops', 'reviews', 'support', 'finance_ops', 'superadmin', 'internal_ops')
  )
);

CREATE TABLE auth_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role text NOT NULL,
  subject_id text NOT NULL,
  last_login_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  last_visited_route text NOT NULL DEFAULT '',
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_sessions_role_check CHECK (role IN ('customer', 'professional', 'admin'))
);

CREATE INDEX auth_sessions_role_subject_id_idx
  ON auth_sessions (role, subject_id);

CREATE INDEX auth_sessions_expires_at_idx
  ON auth_sessions (expires_at);

CREATE INDEX auth_sessions_active_role_subject_id_idx
  ON auth_sessions (role, subject_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE professional_draft_revisions (
  id text PRIMARY KEY,
  professional_id text NOT NULL UNIQUE,
  draft_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id text PRIMARY KEY,
  consumer_id text NOT NULL,
  professional_id text NOT NULL,
  service_id text NOT NULL,
  service_offering_id text NOT NULL,
  area_id text NOT NULL DEFAULT '',
  booking_flow text NOT NULL,
  requested_mode text NOT NULL,
  request_note text NOT NULL DEFAULT '',
  requested_at timestamptz NOT NULL,
  status text NOT NULL,
  total_price_amount integer NOT NULL DEFAULT 0,
  total_price_label text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'IDR',
  latest_payment_request_id text NOT NULL DEFAULT '',
  service_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  cancellation_policy_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  cancellation_resolution jsonb NOT NULL DEFAULT 'null'::jsonb,
  recent_activity jsonb NOT NULL DEFAULT 'null'::jsonb,
  customer_feedback jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_booking_flow_check CHECK (booking_flow IN ('instant', 'request')),
  CONSTRAINT appointments_requested_mode_check CHECK (requested_mode IN ('home_visit', 'online', 'onsite')),
  CONSTRAINT appointments_status_check CHECK (
    status IN ('requested', 'awaiting_payment', 'confirmed', 'in_service', 'completed', 'cancelled', 'rejected', 'expired')
  ),
  CONSTRAINT appointments_total_price_amount_check CHECK (total_price_amount >= 0)
);

CREATE INDEX appointments_consumer_requested_at_idx
  ON appointments (consumer_id, requested_at DESC);

CREATE INDEX appointments_professional_status_requested_at_idx
  ON appointments (professional_id, status, requested_at DESC);

CREATE INDEX appointments_status_requested_at_idx
  ON appointments (status, requested_at DESC);

CREATE TABLE appointment_status_history (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status text NULL,
  to_status text NOT NULL,
  actor_kind text NOT NULL,
  actor_id text NOT NULL DEFAULT '',
  actor_name text NOT NULL DEFAULT '',
  customer_summary text NOT NULL DEFAULT '',
  internal_note text NOT NULL DEFAULT '',
  evidence_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL,
  created_at_label text NOT NULL DEFAULT '',
  CONSTRAINT appointment_status_history_to_status_check CHECK (
    to_status IN ('requested', 'awaiting_payment', 'confirmed', 'in_service', 'completed', 'cancelled', 'rejected', 'expired')
  ),
  CONSTRAINT appointment_status_history_from_status_check CHECK (
    from_status IS NULL OR from_status IN ('requested', 'awaiting_payment', 'confirmed', 'in_service', 'completed', 'cancelled', 'rejected', 'expired')
  ),
  CONSTRAINT appointment_status_history_actor_kind_check CHECK (
    actor_kind IN ('system', 'customer', 'professional', 'admin', 'payment')
  )
);

CREATE INDEX appointment_status_history_appointment_created_at_idx
  ON appointment_status_history (appointment_id, created_at ASC);

CREATE TABLE appointment_change_requests (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  requested_by_kind text NOT NULL,
  requested_by_id text NOT NULL DEFAULT '',
  change_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  requested_mode text NOT NULL DEFAULT '',
  requested_schedule_snapshot jsonb NOT NULL DEFAULT 'null'::jsonb,
  reason text NOT NULL DEFAULT '',
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  CONSTRAINT appointment_change_requests_requested_by_kind_check CHECK (
    requested_by_kind IN ('customer', 'professional', 'admin')
  ),
  CONSTRAINT appointment_change_requests_change_type_check CHECK (
    change_type IN ('reschedule', 'mode_change', 'general_update')
  ),
  CONSTRAINT appointment_change_requests_status_check CHECK (
    status IN ('open', 'approved', 'rejected', 'withdrawn')
  ),
  CONSTRAINT appointment_change_requests_requested_mode_check CHECK (
    requested_mode = '' OR requested_mode IN ('home_visit', 'online', 'onsite')
  )
);

CREATE INDEX appointment_change_requests_appointment_status_created_at_idx
  ON appointment_change_requests (appointment_id, status, created_at DESC);

CREATE TABLE appointment_participants (
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  participant_kind text NOT NULL,
  participant_id text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (appointment_id, participant_kind, participant_id),
  CONSTRAINT appointment_participants_kind_check CHECK (
    participant_kind IN ('customer', 'professional', 'admin', 'support')
  )
);

CREATE TABLE appointment_operational_events (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_kind text NOT NULL,
  actor_id text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointment_operational_events_event_type_check CHECK (
    event_type IN (
      'created',
      'approved',
      'rejected',
      'payment_requested',
      'payment_confirmed',
      'payment_expired',
      'cancelled',
      'departed',
      'service_started',
      'completed',
      'change_requested',
      'change_approved',
      'change_rejected'
    )
  ),
  CONSTRAINT appointment_operational_events_actor_kind_check CHECK (
    actor_kind IN ('system', 'customer', 'professional', 'admin', 'payment')
  )
);

CREATE INDEX appointment_operational_events_appointment_created_at_idx
  ON appointment_operational_events (appointment_id, created_at ASC);

CREATE TABLE payment_requests (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_id text NOT NULL UNIQUE,
  status text NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  amount integer NOT NULL,
  checkout_url text NOT NULL DEFAULT '',
  provider_reference_id text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT '',
  expires_at timestamptz NULL,
  paid_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_requests_provider_check CHECK (provider IN ('xendit', 'manual_test')),
  CONSTRAINT payment_requests_status_check CHECK (
    status IN ('pending', 'requires_action', 'paid', 'expired', 'failed', 'cancelled')
  ),
  CONSTRAINT payment_requests_amount_check CHECK (amount >= 0)
);

CREATE INDEX payment_requests_appointment_created_at_idx
  ON payment_requests (appointment_id, created_at DESC);

CREATE INDEX payment_requests_status_updated_at_idx
  ON payment_requests (status, updated_at DESC);

CREATE TABLE payment_events (
  id text PRIMARY KEY,
  payment_request_id text NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  external_event_id text NOT NULL,
  payment_status text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_events_provider_check CHECK (provider IN ('xendit', 'manual_test')),
  UNIQUE (provider, external_event_id)
);

CREATE INDEX payment_events_payment_request_received_at_idx
  ON payment_events (payment_request_id, received_at DESC);

CREATE TABLE refund_requests (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  payment_request_id text NULL REFERENCES payment_requests(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  requested_by_kind text NOT NULL,
  requested_by_id text NOT NULL DEFAULT '',
  approved_by_admin_id text NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refund_requests_amount_check CHECK (amount >= 0),
  CONSTRAINT refund_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
  CONSTRAINT refund_requests_requested_by_kind_check CHECK (
    requested_by_kind IN ('customer', 'professional', 'admin', 'system')
  )
);

CREATE INDEX refund_requests_appointment_status_created_at_idx
  ON refund_requests (appointment_id, status, created_at DESC);

CREATE TABLE refund_events (
  id text PRIMARY KEY,
  refund_request_id text NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  external_event_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refund_events_provider_check CHECK (provider IN ('xendit', 'manual_test', 'internal')),
  UNIQUE (provider, external_event_id)
);

CREATE INDEX refund_events_refund_request_received_at_idx
  ON refund_events (refund_request_id, received_at DESC);

CREATE TABLE professional_earnings_ledger (
  id text PRIMARY KEY,
  professional_id text NOT NULL,
  appointment_id text NULL REFERENCES appointments(id) ON DELETE SET NULL,
  entry_type text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  status text NOT NULL DEFAULT 'pending',
  available_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_earnings_ledger_entry_type_check CHECK (
    entry_type IN ('earning', 'refund_adjustment', 'payout', 'payout_reversal')
  ),
  CONSTRAINT professional_earnings_ledger_status_check CHECK (
    status IN ('pending', 'available', 'settled', 'reversed')
  )
);

CREATE INDEX professional_earnings_ledger_professional_status_created_at_idx
  ON professional_earnings_ledger (professional_id, status, created_at DESC);

CREATE TABLE payout_batches (
  id text PRIMARY KEY,
  professional_id text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'IDR',
  external_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz NULL,
  CONSTRAINT payout_batches_provider_check CHECK (provider IN ('xendit', 'manual_test')),
  CONSTRAINT payout_batches_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed'))
);

CREATE INDEX payout_batches_professional_status_created_at_idx
  ON payout_batches (professional_id, status, created_at DESC);

CREATE TABLE support_ticket_events (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_kind text NOT NULL,
  actor_id text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  public_note text NOT NULL DEFAULT '',
  internal_note text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_ticket_events_actor_kind_check CHECK (
    actor_kind IN ('customer', 'professional', 'admin', 'system')
  ),
  CONSTRAINT support_ticket_events_event_type_check CHECK (
    event_type IN ('created', 'commented', 'assigned', 'status_changed', 'attachment_added', 'refunded')
  )
);

CREATE INDEX support_ticket_events_ticket_created_at_idx
  ON support_ticket_events (ticket_id, created_at ASC);

CREATE TABLE support_ticket_assignments (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  admin_id text NOT NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE CASCADE,
  assigned_by_admin_id text NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz NULL
);

CREATE INDEX support_ticket_assignments_ticket_active_idx
  ON support_ticket_assignments (ticket_id, is_active, assigned_at DESC);

CREATE TABLE support_ticket_attachments (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  file_name text NOT NULL,
  content_type text NOT NULL,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_by_kind text NOT NULL,
  uploaded_by_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_ticket_attachments_uploaded_by_kind_check CHECK (
    uploaded_by_kind IN ('customer', 'professional', 'admin')
  ),
  CONSTRAINT support_ticket_attachments_file_size_check CHECK (file_size_bytes >= 0)
);

CREATE INDEX support_ticket_attachments_ticket_created_at_idx
  ON support_ticket_attachments (ticket_id, created_at DESC);

CREATE TABLE support_ticket_notifications (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  recipient_kind text NOT NULL,
  recipient_id text NOT NULL DEFAULT '',
  channel text NOT NULL,
  template_key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  CONSTRAINT support_ticket_notifications_recipient_kind_check CHECK (
    recipient_kind IN ('customer', 'professional', 'admin')
  ),
  CONSTRAINT support_ticket_notifications_channel_check CHECK (channel IN ('web_push', 'email', 'whatsapp')),
  CONSTRAINT support_ticket_notifications_status_check CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

CREATE INDEX support_ticket_notifications_ticket_status_created_at_idx
  ON support_ticket_notifications (ticket_id, status, created_at DESC);

CREATE TABLE admin_roles (
  role_id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_role_assignments (
  admin_id text NOT NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES admin_roles(role_id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_id, role_id)
);

CREATE TABLE admin_audit_logs (
  id text PRIMARY KEY,
  admin_id text NOT NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_logs_admin_created_at_idx
  ON admin_audit_logs (admin_id, created_at DESC);

CREATE INDEX admin_audit_logs_resource_created_at_idx
  ON admin_audit_logs (resource_type, resource_id, created_at DESC);

CREATE TABLE outbox_events (
  id text PRIMARY KEY,
  topic text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz NULL,
  CONSTRAINT outbox_events_status_check CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
  CONSTRAINT outbox_events_attempts_check CHECK (attempts >= 0)
);

CREATE INDEX outbox_events_status_available_at_idx
  ON outbox_events (status, available_at ASC);
