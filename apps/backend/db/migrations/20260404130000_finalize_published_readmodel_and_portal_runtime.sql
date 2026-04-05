CREATE TABLE IF NOT EXISTS professional_portal_runtime_state (
  document_key text PRIMARY KEY,
  last_active_professional_id text NOT NULL DEFAULT ''
);

INSERT INTO professional_portal_runtime_state (document_key, last_active_professional_id)
VALUES (
  'default',
  COALESCE(
    (
      SELECT professional_id
      FROM professional_portal_states
      WHERE is_last_active = TRUE
      ORDER BY saved_at DESC, professional_id ASC
      LIMIT 1
    ),
    ''
  )
)
ON CONFLICT (document_key) DO UPDATE
SET last_active_professional_id = EXCLUDED.last_active_professional_id;

DROP INDEX IF EXISTS professional_portal_states_last_active_idx;

ALTER TABLE professional_portal_states
DROP COLUMN IF EXISTS is_last_active;

ALTER TABLE IF EXISTS readmodel_seed_documents
RENAME TO published_readmodel_documents;
