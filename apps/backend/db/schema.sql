CREATE TABLE chat_threads (
  id text PRIMARY KEY,
  title text NOT NULL,
  participant_kind text NOT NULL,
  participant_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_kind text NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_thread_id_sent_at_idx
  ON chat_messages (thread_id, sent_at DESC);

CREATE TABLE professional_portal_sessions (
  professional_id text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL,
  is_last_active boolean NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX professional_portal_sessions_last_active_idx
  ON professional_portal_sessions (is_last_active)
  WHERE is_last_active = TRUE;

CREATE TABLE app_state_documents (
  namespace text NOT NULL,
  document_key text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (namespace, document_key)
);

CREATE TABLE content_documents (
  namespace text NOT NULL,
  document_key text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  PRIMARY KEY (namespace, document_key)
);
