ALTER TABLE chat_threads
  ADD CONSTRAINT chat_threads_participant_kind_check CHECK (
    participant_kind IN ('appointment', 'professional', 'conversation')
  );

ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_sender_kind_check CHECK (
    sender_kind IN ('user', 'professional', 'system', 'client')
  );

ALTER TABLE professional_portal_states
  ADD COLUMN schema_version integer NOT NULL DEFAULT 10;

ALTER TABLE professional_portal_states
  ADD CONSTRAINT professional_portal_states_schema_version_check CHECK (schema_version >= 1);

ALTER TABLE professional_portal_runtime_state
  ALTER COLUMN last_active_professional_id DROP NOT NULL,
  ALTER COLUMN last_active_professional_id DROP DEFAULT;

UPDATE professional_portal_runtime_state
SET last_active_professional_id = NULLIF(last_active_professional_id, '');

ALTER TABLE professional_portal_runtime_state
  ADD CONSTRAINT professional_portal_runtime_state_last_active_professional_id_fkey
    FOREIGN KEY (last_active_professional_id)
    REFERENCES professional_portal_states(professional_id)
    ON DELETE SET NULL;

ALTER TABLE admin_support_desk_states
  ADD COLUMN revision bigint NOT NULL DEFAULT 1;

ALTER TABLE admin_console_states
  ADD COLUMN revision bigint NOT NULL DEFAULT 1;

ALTER TABLE admin_console_tables
  ADD COLUMN revision bigint NOT NULL DEFAULT 1;

ALTER TABLE published_readmodel_documents
  ADD COLUMN revision bigint NOT NULL DEFAULT 1;

ALTER TABLE admin_auth_accounts
  ADD CONSTRAINT admin_auth_accounts_focus_area_check
    CHECK (focus_area IN ('catalog', 'ops', 'reviews', 'support'));

ALTER TABLE support_tickets
  ALTER COLUMN assigned_admin_id DROP NOT NULL,
  ALTER COLUMN assigned_admin_id DROP DEFAULT,
  ALTER COLUMN related_professional_id DROP NOT NULL,
  ALTER COLUMN related_professional_id DROP DEFAULT;

UPDATE support_tickets
SET
  assigned_admin_id = NULLIF(assigned_admin_id, ''),
  related_professional_id = NULLIF(related_professional_id, '');

ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_assigned_admin_id_fkey
    FOREIGN KEY (assigned_admin_id)
    REFERENCES admin_auth_accounts(admin_id)
    ON DELETE SET NULL,
  ADD CONSTRAINT support_tickets_related_professional_id_fkey
    FOREIGN KEY (related_professional_id)
    REFERENCES professional_auth_accounts(professional_id)
    ON DELETE SET NULL;
