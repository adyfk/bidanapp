CREATE TABLE professional_portal_states (
  professional_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  appointment_records jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_last_active boolean NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX professional_portal_states_last_active_idx
  ON professional_portal_states (is_last_active)
  WHERE is_last_active = TRUE;

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
  command_center jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE support_tickets (
  id text PRIMARY KEY,
  sort_index integer NOT NULL DEFAULT 0,
  assigned_admin_id text NOT NULL DEFAULT '',
  category_id text NOT NULL DEFAULT '',
  contact_value text NOT NULL DEFAULT '',
  created_at text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  eta_key text NOT NULL DEFAULT '',
  preferred_channel text NOT NULL DEFAULT '',
  reference_code text NOT NULL DEFAULT '',
  related_appointment_id text NOT NULL DEFAULT '',
  related_professional_id text NOT NULL DEFAULT '',
  reporter_name text NOT NULL DEFAULT '',
  reporter_phone text NOT NULL DEFAULT '',
  reporter_role text NOT NULL DEFAULT '',
  source_surface text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  updated_at text NOT NULL DEFAULT '',
  urgency text NOT NULL DEFAULT ''
);

CREATE INDEX support_tickets_sort_idx
  ON support_tickets (sort_index, id);

CREATE TABLE admin_console_states (
  document_key text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1
);

CREATE TABLE admin_console_tables (
  table_name text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1
);

CREATE TABLE admin_console_table_rows (
  table_name text NOT NULL REFERENCES admin_console_tables(table_name) ON DELETE CASCADE,
  row_index integer NOT NULL,
  row_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (table_name, row_index)
);

INSERT INTO professional_portal_states (
  professional_id,
  saved_at,
  state,
  review_state,
  appointment_records,
  is_last_active
)
SELECT
  professional_id,
  saved_at,
  COALESCE(snapshot->'state', '{}'::jsonb),
  COALESCE(snapshot->'reviewStatesByProfessionalId'->professional_id, jsonb_build_object('status', 'published')),
  COALESCE(snapshot->'appointmentRecordsByProfessionalId'->professional_id, '[]'::jsonb),
  is_last_active
FROM professional_portal_sessions
ON CONFLICT (professional_id) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    state = EXCLUDED.state,
    review_state = EXCLUDED.review_state,
    appointment_records = EXCLUDED.appointment_records,
    is_last_active = EXCLUDED.is_last_active;

INSERT INTO viewer_session_states (document_key, saved_at, snapshot)
SELECT document_key, saved_at, snapshot
FROM app_state_documents
WHERE namespace = 'viewer_session'
ON CONFLICT (document_key) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    snapshot = EXCLUDED.snapshot;

INSERT INTO customer_notification_states (consumer_id, saved_at, snapshot)
SELECT document_key, saved_at, snapshot
FROM app_state_documents
WHERE namespace = 'customer_notifications'
ON CONFLICT (consumer_id) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    snapshot = EXCLUDED.snapshot;

INSERT INTO professional_notification_states (professional_id, saved_at, snapshot)
SELECT document_key, saved_at, snapshot
FROM app_state_documents
WHERE namespace = 'professional_notifications'
ON CONFLICT (professional_id) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    snapshot = EXCLUDED.snapshot;

INSERT INTO consumer_preference_states (consumer_id, saved_at, snapshot)
SELECT document_key, saved_at, snapshot
FROM app_state_documents
WHERE namespace = 'consumer_preferences'
ON CONFLICT (consumer_id) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    snapshot = EXCLUDED.snapshot;

INSERT INTO admin_session_states (document_key, saved_at, snapshot)
SELECT document_key, saved_at, snapshot
FROM app_state_documents
WHERE namespace = 'admin_session'
ON CONFLICT (document_key) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    snapshot = EXCLUDED.snapshot;

INSERT INTO admin_support_desk_states (
  document_key,
  saved_at,
  schema_version,
  command_center
)
SELECT
  document_key,
  saved_at,
  CASE
    WHEN jsonb_typeof(snapshot->'schemaVersion') = 'number' THEN (snapshot->>'schemaVersion')::integer
    ELSE 1
  END,
  COALESCE(snapshot->'commandCenter', '{}'::jsonb)
FROM app_state_documents
WHERE namespace = 'admin_support_desk'
ON CONFLICT (document_key) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    schema_version = EXCLUDED.schema_version,
    command_center = EXCLUDED.command_center;

INSERT INTO support_tickets (
  id,
  sort_index,
  assigned_admin_id,
  category_id,
  contact_value,
  created_at,
  details,
  eta_key,
  preferred_channel,
  reference_code,
  related_appointment_id,
  related_professional_id,
  reporter_name,
  reporter_phone,
  reporter_role,
  source_surface,
  status,
  summary,
  updated_at,
  urgency
)
SELECT
  COALESCE(ticket.value->>'id', 'support-ticket-' || ticket.ordinality::text),
  ticket.ordinality::integer - 1,
  COALESCE(ticket.value->>'assignedAdminId', ''),
  COALESCE(ticket.value->>'categoryId', ''),
  COALESCE(ticket.value->>'contactValue', ''),
  COALESCE(ticket.value->>'createdAt', ''),
  COALESCE(ticket.value->>'details', ''),
  COALESCE(ticket.value->>'etaKey', ''),
  COALESCE(ticket.value->>'preferredChannel', ''),
  COALESCE(ticket.value->>'referenceCode', ''),
  COALESCE(ticket.value->>'relatedAppointmentId', ''),
  COALESCE(ticket.value->>'relatedProfessionalId', ''),
  COALESCE(ticket.value->>'reporterName', ''),
  COALESCE(ticket.value->>'reporterPhone', ''),
  COALESCE(ticket.value->>'reporterRole', ''),
  COALESCE(ticket.value->>'sourceSurface', ''),
  COALESCE(ticket.value->>'status', ''),
  COALESCE(ticket.value->>'summary', ''),
  COALESCE(ticket.value->>'updatedAt', ''),
  COALESCE(ticket.value->>'urgency', '')
FROM app_state_documents doc
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(doc.snapshot->'tickets', '[]'::jsonb)) WITH ORDINALITY AS ticket(value, ordinality)
WHERE doc.namespace = 'admin_support_desk'
ON CONFLICT (id) DO UPDATE
SET sort_index = EXCLUDED.sort_index,
    assigned_admin_id = EXCLUDED.assigned_admin_id,
    category_id = EXCLUDED.category_id,
    contact_value = EXCLUDED.contact_value,
    created_at = EXCLUDED.created_at,
    details = EXCLUDED.details,
    eta_key = EXCLUDED.eta_key,
    preferred_channel = EXCLUDED.preferred_channel,
    reference_code = EXCLUDED.reference_code,
    related_appointment_id = EXCLUDED.related_appointment_id,
    related_professional_id = EXCLUDED.related_professional_id,
    reporter_name = EXCLUDED.reporter_name,
    reporter_phone = EXCLUDED.reporter_phone,
    reporter_role = EXCLUDED.reporter_role,
    source_surface = EXCLUDED.source_surface,
    status = EXCLUDED.status,
    summary = EXCLUDED.summary,
    updated_at = EXCLUDED.updated_at,
    urgency = EXCLUDED.urgency;

INSERT INTO admin_console_states (document_key, saved_at, schema_version)
SELECT
  document_key,
  saved_at,
  CASE
    WHEN jsonb_typeof(snapshot->'schemaVersion') = 'number' THEN (snapshot->>'schemaVersion')::integer
    ELSE 1
  END
FROM app_state_documents
WHERE namespace = 'admin_console'
ON CONFLICT (document_key) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    schema_version = EXCLUDED.schema_version;

INSERT INTO admin_console_tables (table_name, saved_at, schema_version)
SELECT
  document_key,
  saved_at,
  CASE
    WHEN jsonb_typeof(snapshot->'schemaVersion') = 'number' THEN (snapshot->>'schemaVersion')::integer
    ELSE 1
  END
FROM app_state_documents
WHERE namespace = 'admin_console_table'
ON CONFLICT (table_name) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    schema_version = EXCLUDED.schema_version;

INSERT INTO admin_console_tables (table_name, saved_at, schema_version)
SELECT
  table_entry.key,
  doc.saved_at,
  CASE
    WHEN jsonb_typeof(doc.snapshot->'schemaVersion') = 'number' THEN (doc.snapshot->>'schemaVersion')::integer
    ELSE 1
  END
FROM app_state_documents doc
CROSS JOIN LATERAL jsonb_each(COALESCE(doc.snapshot->'tables', '{}'::jsonb)) AS table_entry(key, value)
WHERE doc.namespace = 'admin_console'
ON CONFLICT (table_name) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    schema_version = EXCLUDED.schema_version;

INSERT INTO admin_console_table_rows (table_name, row_index, row_payload)
SELECT
  doc.document_key,
  row_item.ordinality::integer - 1,
  row_item.value
FROM app_state_documents doc
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(doc.snapshot->'rows', '[]'::jsonb)) WITH ORDINALITY AS row_item(value, ordinality)
WHERE doc.namespace = 'admin_console_table'
ON CONFLICT (table_name, row_index) DO UPDATE
SET row_payload = EXCLUDED.row_payload;

INSERT INTO admin_console_table_rows (table_name, row_index, row_payload)
SELECT
  table_entry.key,
  row_item.ordinality::integer - 1,
  row_item.value
FROM app_state_documents doc
CROSS JOIN LATERAL jsonb_each(COALESCE(doc.snapshot->'tables', '{}'::jsonb)) AS table_entry(key, value)
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(table_entry.value, '[]'::jsonb)) WITH ORDINALITY AS row_item(value, ordinality)
WHERE doc.namespace = 'admin_console'
ON CONFLICT (table_name, row_index) DO UPDATE
SET row_payload = EXCLUDED.row_payload;
