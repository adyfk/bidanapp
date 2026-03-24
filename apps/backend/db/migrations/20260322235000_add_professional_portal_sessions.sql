CREATE TABLE professional_portal_sessions (
  professional_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL,
  is_last_active boolean NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX professional_portal_sessions_last_active_idx
  ON professional_portal_sessions (is_last_active)
  WHERE is_last_active = TRUE;
