-- Create initial chat tables for future persistent realtime messaging.
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
