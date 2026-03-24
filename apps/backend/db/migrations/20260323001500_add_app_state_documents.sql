CREATE TABLE app_state_documents (
  namespace text NOT NULL,
  document_key text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (namespace, document_key)
);
