CREATE TABLE readmodel_seed_documents (
  file_name text PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT 'null'::jsonb
);

INSERT INTO readmodel_seed_documents (file_name, saved_at, payload)
SELECT document_key, saved_at, payload
FROM content_documents
WHERE namespace = 'seeddata'
ON CONFLICT (file_name) DO UPDATE
SET saved_at = EXCLUDED.saved_at,
    payload = EXCLUDED.payload;
