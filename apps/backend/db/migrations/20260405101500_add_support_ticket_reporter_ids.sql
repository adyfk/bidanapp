ALTER TABLE support_tickets
  ADD COLUMN reporter_id text NOT NULL DEFAULT '';

UPDATE support_tickets t
SET reporter_id = COALESCE(
  CASE
    WHEN t.reporter_role = 'professional' THEN COALESCE(
      NULLIF(t.related_professional_id, ''),
      (
        SELECT p.professional_id
        FROM professional_auth_accounts p
        WHERE p.phone_normalized = regexp_replace(t.reporter_phone, '[^0-9+]', '', 'g')
        LIMIT 1
      ),
      (
        SELECT p.professional_id
        FROM professional_auth_accounts p
        WHERE lower(p.display_name) = lower(t.reporter_name)
        LIMIT 1
      ),
      ''
    )
    WHEN t.reporter_role = 'customer' THEN COALESCE(
      (
        SELECT a.consumer_id
        FROM appointments a
        WHERE a.id = t.related_appointment_id
        LIMIT 1
      ),
      (
        SELECT c.consumer_id
        FROM customer_auth_accounts c
        WHERE c.phone_normalized = regexp_replace(t.reporter_phone, '[^0-9+]', '', 'g')
        LIMIT 1
      ),
      (
        SELECT c.consumer_id
        FROM customer_auth_accounts c
        WHERE lower(c.display_name) = lower(t.reporter_name)
        LIMIT 1
      ),
      ''
    )
    ELSE ''
  END,
  ''
)
WHERE reporter_id = '';

CREATE INDEX support_tickets_reporter_role_id_updated_at_idx
  ON support_tickets (reporter_role, reporter_id, updated_at DESC);
