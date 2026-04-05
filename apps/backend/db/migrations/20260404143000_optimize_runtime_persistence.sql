ALTER TABLE auth_users
  ADD CONSTRAINT auth_users_role_check CHECK (role IN ('customer', 'professional', 'admin'));

ALTER TABLE auth_sessions
  ADD CONSTRAINT auth_sessions_role_check CHECK (role IN ('customer', 'professional', 'admin'));

CREATE INDEX auth_sessions_expires_at_idx
  ON auth_sessions (expires_at);

CREATE INDEX auth_sessions_active_role_subject_id_idx
  ON auth_sessions (role, subject_id, expires_at DESC)
  WHERE revoked_at IS NULL;

UPDATE support_tickets
SET
  created_at = COALESCE(NULLIF(created_at, ''), NULLIF(updated_at, ''), now()::text),
  updated_at = COALESCE(NULLIF(updated_at, ''), NULLIF(created_at, ''), now()::text);

ALTER TABLE support_tickets
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN updated_at DROP DEFAULT;

ALTER TABLE support_tickets
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz,
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at::timestamptz;

ALTER TABLE support_tickets
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_eta_key_check CHECK (eta_key IN ('normal', 'high', 'urgent')),
  ADD CONSTRAINT support_tickets_preferred_channel_check CHECK (preferred_channel IN ('call', 'email', 'whatsapp')),
  ADD CONSTRAINT support_tickets_reporter_role_check CHECK (reporter_role IN ('customer', 'professional')),
  ADD CONSTRAINT support_tickets_source_surface_check CHECK (
    source_surface IN ('admin_manual', 'profile_customer', 'profile_professional')
  ),
  ADD CONSTRAINT support_tickets_status_check CHECK (status IN ('new', 'triaged', 'reviewing', 'resolved', 'refunded')),
  ADD CONSTRAINT support_tickets_urgency_check CHECK (urgency IN ('normal', 'high', 'urgent'));

CREATE INDEX support_tickets_status_urgency_updated_at_idx
  ON support_tickets (status, urgency, updated_at DESC);

CREATE INDEX support_tickets_assigned_admin_status_updated_at_idx
  ON support_tickets (assigned_admin_id, status, updated_at DESC);

ALTER INDEX readmodel_seed_documents_pkey
  RENAME TO published_readmodel_documents_pkey;
