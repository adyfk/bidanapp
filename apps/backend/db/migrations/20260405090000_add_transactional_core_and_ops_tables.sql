ALTER TABLE auth_users
  ADD COLUMN status text NOT NULL DEFAULT 'active',
  ADD COLUMN verified_at timestamptz NULL,
  ADD COLUMN verified_channel text NOT NULL DEFAULT '',
  ADD COLUMN disabled_at timestamptz NULL,
  ADD COLUMN deletion_requested_at timestamptz NULL,
  ADD COLUMN retention_state text NOT NULL DEFAULT 'active';

ALTER TABLE auth_users
  ADD CONSTRAINT auth_users_status_check CHECK (status IN ('active', 'disabled', 'pending_verification', 'deleted')),
  ADD CONSTRAINT auth_users_retention_state_check CHECK (retention_state IN ('active', 'pending_deletion', 'deleted')),
  ADD CONSTRAINT auth_users_verified_channel_check CHECK (
    verified_channel = '' OR verified_channel IN ('admin_review', 'otp_sms', 'otp_whatsapp', 'manual')
  );

ALTER TABLE admin_auth_accounts
  DROP CONSTRAINT admin_auth_accounts_focus_area_check;

ALTER TABLE admin_auth_accounts
  ADD CONSTRAINT admin_auth_accounts_focus_area_check CHECK (
    focus_area IN ('catalog', 'ops', 'reviews', 'support', 'finance_ops', 'superadmin', 'internal_ops')
  );

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

WITH portal_records AS (
  SELECT
    professional_id AS state_professional_id,
    record.value AS appointment_record
  FROM professional_portal_states
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(appointment_records, '[]'::jsonb)) AS record(value)
),
normalized_portal_records AS (
  SELECT
    COALESCE(NULLIF(appointment_record->>'id', ''), '') AS appointment_id,
    COALESCE(NULLIF(appointment_record->>'consumerId', ''), '') AS consumer_id,
    COALESCE(
      NULLIF(appointment_record->>'professionalId', ''),
      NULLIF(state_professional_id, ''),
      ''
    ) AS professional_id,
    COALESCE(
      NULLIF(appointment_record->>'serviceId', ''),
      NULLIF(appointment_record #>> '{serviceSnapshot,serviceId}', ''),
      ''
    ) AS service_id,
    COALESCE(
      NULLIF(appointment_record->>'serviceOfferingId', ''),
      NULLIF(appointment_record #>> '{serviceSnapshot,serviceOfferingId}', ''),
      ''
    ) AS service_offering_id,
    COALESCE(NULLIF(appointment_record->>'areaId', ''), '') AS area_id,
    CASE
      WHEN COALESCE(
        NULLIF(appointment_record->>'bookingFlow', ''),
        NULLIF(appointment_record #>> '{serviceSnapshot,bookingFlow}', '')
      ) IN ('instant', 'request')
      THEN COALESCE(
        NULLIF(appointment_record->>'bookingFlow', ''),
        NULLIF(appointment_record #>> '{serviceSnapshot,bookingFlow}', '')
      )
      ELSE 'request'
    END AS booking_flow,
    CASE
      WHEN COALESCE(NULLIF(appointment_record->>'requestedMode', ''), '') IN ('home_visit', 'online', 'onsite')
      THEN appointment_record->>'requestedMode'
      ELSE 'home_visit'
    END AS requested_mode,
    COALESCE(appointment_record->>'requestNote', '') AS request_note,
    CASE
      WHEN NULLIF(appointment_record->>'requestedAt', '') IS NOT NULL THEN (appointment_record->>'requestedAt')::timestamptz
      ELSE now()
    END AS requested_at,
    CASE COALESCE(appointment_record->>'status', 'requested')
      WHEN 'approved_waiting_payment' THEN 'awaiting_payment'
      WHEN 'paid' THEN 'confirmed'
      WHEN 'requested' THEN 'requested'
      WHEN 'awaiting_payment' THEN 'awaiting_payment'
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'in_service' THEN 'in_service'
      WHEN 'completed' THEN 'completed'
      WHEN 'cancelled' THEN 'cancelled'
      WHEN 'rejected' THEN 'rejected'
      WHEN 'expired' THEN 'expired'
      ELSE 'requested'
    END AS status,
    CASE
      WHEN COALESCE(appointment_record #>> '{serviceSnapshot,priceAmount}', '') ~ '^[0-9]+$'
      THEN (appointment_record #>> '{serviceSnapshot,priceAmount}')::integer
      ELSE 0
    END AS total_price_amount,
    COALESCE(
      NULLIF(appointment_record #>> '{serviceSnapshot,priceLabel}', ''),
      ''
    ) AS total_price_label,
    COALESCE(
      NULLIF(appointment_record #>> '{serviceSnapshot,priceCurrency}', ''),
      'IDR'
    ) AS currency,
    COALESCE(appointment_record->'serviceSnapshot', '{}'::jsonb) AS service_snapshot,
    COALESCE(appointment_record->'scheduleSnapshot', '{}'::jsonb) AS schedule_snapshot,
    COALESCE(appointment_record->'cancellationPolicySnapshot', '{}'::jsonb) AS cancellation_policy_snapshot,
    COALESCE(appointment_record->'cancellationResolution', 'null'::jsonb) AS cancellation_resolution
  FROM portal_records
  WHERE COALESCE(NULLIF(appointment_record->>'id', ''), '') <> ''
)
INSERT INTO appointments (
  id,
  consumer_id,
  professional_id,
  service_id,
  service_offering_id,
  area_id,
  booking_flow,
  requested_mode,
  request_note,
  requested_at,
  status,
  total_price_amount,
  total_price_label,
  currency,
  latest_payment_request_id,
  service_snapshot,
  schedule_snapshot,
  pricing_snapshot,
  cancellation_policy_snapshot,
  cancellation_resolution,
  recent_activity,
  customer_feedback,
  created_at,
  updated_at
)
SELECT
  appointment_id,
  consumer_id,
  professional_id,
  service_id,
  service_offering_id,
  area_id,
  booking_flow,
  requested_mode,
  request_note,
  requested_at,
  status,
  total_price_amount,
  total_price_label,
  currency,
  '',
  service_snapshot,
  schedule_snapshot,
  jsonb_build_object(
    'amount', total_price_amount,
    'currency', currency,
    'label', total_price_label
  ),
  cancellation_policy_snapshot,
  cancellation_resolution,
  'null'::jsonb,
  'null'::jsonb,
  requested_at,
  requested_at
FROM normalized_portal_records
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (
  id,
  consumer_id,
  professional_id,
  service_id,
  service_offering_id,
  area_id,
  booking_flow,
  requested_mode,
  request_note,
  requested_at,
  status,
  total_price_amount,
  total_price_label,
  currency,
  latest_payment_request_id,
  service_snapshot,
  schedule_snapshot,
  pricing_snapshot,
  cancellation_policy_snapshot,
  cancellation_resolution,
  recent_activity,
  customer_feedback,
  created_at,
  updated_at
)
SELECT
  execution.appointment_id,
  execution.consumer_id,
  execution.professional_id,
  '',
  '',
  '',
  'request',
  'home_visit',
  '',
  COALESCE(
    execution.departed_at,
    execution.service_started_at,
    execution.closed_at,
    execution.updated_at,
    execution.created_at
  ),
  CASE execution.execution_status
    WHEN 'service_started' THEN 'in_service'
    WHEN 'closed' THEN 'completed'
    ELSE 'confirmed'
  END,
  0,
  '',
  'IDR',
  '',
  '{}'::jsonb,
  jsonb_build_object('scheduledTimeLabel', ''),
  jsonb_build_object('amount', 0, 'currency', 'IDR', 'label', ''),
  '{}'::jsonb,
  'null'::jsonb,
  'null'::jsonb,
  'null'::jsonb,
  execution.created_at,
  execution.updated_at
FROM appointment_home_visit_executions AS execution
LEFT JOIN appointments AS existing_appointments
  ON existing_appointments.id = execution.appointment_id
WHERE existing_appointments.id IS NULL;

WITH portal_records AS (
  SELECT record.value AS appointment_record
  FROM professional_portal_states
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(appointment_records, '[]'::jsonb)) AS record(value)
),
timeline_records AS (
  SELECT
    COALESCE(NULLIF(appointment_record->>'id', ''), '') AS appointment_id,
    timeline_event.value AS timeline_event,
    row_number() OVER (
      PARTITION BY COALESCE(NULLIF(appointment_record->>'id', ''), '')
      ORDER BY
        COALESCE(
          CASE
            WHEN NULLIF(timeline_event.value->>'createdAt', '') IS NOT NULL
            THEN (timeline_event.value->>'createdAt')::timestamptz
            ELSE NULL
          END,
          now()
        ),
        COALESCE(NULLIF(timeline_event.value->>'id', ''), '')
    ) AS event_ordinal
  FROM portal_records
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(appointment_record->'timeline', '[]'::jsonb)) AS timeline_event(value)
  WHERE COALESCE(NULLIF(appointment_record->>'id', ''), '') <> ''
)
INSERT INTO appointment_status_history (
  id,
  appointment_id,
  from_status,
  to_status,
  actor_kind,
  actor_id,
  actor_name,
  customer_summary,
  internal_note,
  evidence_url,
  created_at,
  created_at_label
)
SELECT
  appointment_id || '-' || COALESCE(
    NULLIF(timeline_event->>'id', ''),
    'timeline-' || event_ordinal::text
  ),
  appointment_id,
  CASE COALESCE(timeline_event->>'fromStatus', '')
    WHEN '' THEN NULL
    WHEN 'approved_waiting_payment' THEN 'awaiting_payment'
    WHEN 'paid' THEN 'confirmed'
    WHEN 'requested' THEN 'requested'
    WHEN 'awaiting_payment' THEN 'awaiting_payment'
    WHEN 'confirmed' THEN 'confirmed'
    WHEN 'in_service' THEN 'in_service'
    WHEN 'completed' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'expired' THEN 'expired'
    ELSE NULL
  END,
  CASE COALESCE(timeline_event->>'toStatus', 'requested')
    WHEN 'approved_waiting_payment' THEN 'awaiting_payment'
    WHEN 'paid' THEN 'confirmed'
    WHEN 'requested' THEN 'requested'
    WHEN 'awaiting_payment' THEN 'awaiting_payment'
    WHEN 'confirmed' THEN 'confirmed'
    WHEN 'in_service' THEN 'in_service'
    WHEN 'completed' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'expired' THEN 'expired'
    ELSE 'requested'
  END,
  CASE
    WHEN COALESCE(NULLIF(timeline_event->>'actor', ''), '') IN ('system', 'customer', 'professional', 'admin', 'payment')
    THEN timeline_event->>'actor'
    ELSE 'system'
  END,
  '',
  COALESCE(NULLIF(timeline_event->>'actor', ''), 'system'),
  COALESCE(timeline_event->>'customerSummary', ''),
  COALESCE(timeline_event->>'internalNote', ''),
  COALESCE(timeline_event->>'evidenceUrl', ''),
  CASE
    WHEN NULLIF(timeline_event->>'createdAt', '') IS NOT NULL THEN (timeline_event->>'createdAt')::timestamptz
    ELSE now()
  END,
  COALESCE(timeline_event->>'createdAtLabel', '')
FROM timeline_records;

INSERT INTO appointment_status_history (
  id,
  appointment_id,
  from_status,
  to_status,
  actor_kind,
  actor_id,
  actor_name,
  customer_summary,
  internal_note,
  evidence_url,
  created_at,
  created_at_label
)
SELECT
  appointments.id || '-imported',
  appointments.id,
  NULL,
  appointments.status,
  'system',
  '',
  'system',
  'Appointment imported into the transactional store.',
  'Backfilled from the pre-transactional appointment runtime.',
  '',
  appointments.requested_at,
  ''
FROM appointments
WHERE NOT EXISTS (
  SELECT 1
  FROM appointment_status_history
  WHERE appointment_status_history.appointment_id = appointments.id
);

INSERT INTO appointment_participants (
  appointment_id,
  participant_kind,
  participant_id,
  display_name,
  created_at
)
SELECT
  id,
  'customer',
  consumer_id,
  '',
  created_at
FROM appointments
WHERE consumer_id <> ''
ON CONFLICT (appointment_id, participant_kind, participant_id) DO NOTHING;

INSERT INTO appointment_participants (
  appointment_id,
  participant_kind,
  participant_id,
  display_name,
  created_at
)
SELECT
  id,
  'professional',
  professional_id,
  '',
  created_at
FROM appointments
WHERE professional_id <> ''
ON CONFLICT (appointment_id, participant_kind, participant_id) DO NOTHING;

INSERT INTO appointment_operational_events (
  id,
  appointment_id,
  event_type,
  actor_kind,
  actor_id,
  payload,
  created_at
)
SELECT
  appointment_status_history.id || '-event',
  appointment_status_history.appointment_id,
  CASE
    WHEN appointment_status_history.to_status = 'requested' THEN 'created'
    WHEN appointment_status_history.to_status = 'awaiting_payment' THEN 'payment_requested'
    WHEN appointment_status_history.to_status = 'confirmed' AND appointment_status_history.from_status = 'awaiting_payment'
    THEN 'payment_confirmed'
    WHEN appointment_status_history.to_status = 'confirmed' THEN 'approved'
    WHEN appointment_status_history.to_status = 'rejected' THEN 'rejected'
    WHEN appointment_status_history.to_status = 'cancelled' THEN 'cancelled'
    WHEN appointment_status_history.to_status = 'expired' THEN 'payment_expired'
    WHEN appointment_status_history.to_status = 'in_service' THEN 'service_started'
    WHEN appointment_status_history.to_status = 'completed' THEN 'completed'
    ELSE 'created'
  END,
  appointment_status_history.actor_kind,
  appointment_status_history.actor_id,
  jsonb_build_object(
    'customerSummary', appointment_status_history.customer_summary,
    'internalNote', appointment_status_history.internal_note,
    'fromStatus', COALESCE(appointment_status_history.from_status, ''),
    'toStatus', appointment_status_history.to_status
  ),
  appointment_status_history.created_at
FROM appointment_status_history;

INSERT INTO appointment_operational_events (
  id,
  appointment_id,
  event_type,
  actor_kind,
  actor_id,
  payload,
  created_at
)
SELECT
  appointment_home_visit_executions.appointment_id || '-departed',
  appointment_home_visit_executions.appointment_id,
  'departed',
  'professional',
  appointment_home_visit_executions.professional_id,
  jsonb_build_object(
    'executionStatus', appointment_home_visit_executions.execution_status,
    'etaMinutesHint', appointment_home_visit_executions.eta_minutes_hint,
    'distanceKmHint', appointment_home_visit_executions.distance_km_hint
  ),
  COALESCE(
    appointment_home_visit_executions.departed_at,
    appointment_home_visit_executions.updated_at,
    appointment_home_visit_executions.created_at
  )
FROM appointment_home_visit_executions
WHERE appointment_home_visit_executions.departed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE appointment_home_visit_executions
  ADD CONSTRAINT appointment_home_visit_executions_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
