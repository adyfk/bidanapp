CREATE TABLE content_documents (
  namespace text NOT NULL,
  document_key text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  PRIMARY KEY (namespace, document_key)
);
