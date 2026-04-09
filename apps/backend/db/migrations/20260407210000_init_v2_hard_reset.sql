CREATE TABLE auth_users (
  id text PRIMARY KEY,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  verified_at timestamptz NULL,
  verified_channel text NOT NULL DEFAULT '',
  disabled_at timestamptz NULL,
  deletion_requested_at timestamptz NULL,
  retention_state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_users_role_check CHECK (role IN ('end_user', 'admin')),
  CONSTRAINT auth_users_status_check CHECK (status IN ('active', 'disabled', 'pending_verification', 'deleted')),
  CONSTRAINT auth_users_retention_state_check CHECK (retention_state IN ('active', 'pending_deletion', 'deleted')),
  CONSTRAINT auth_users_verified_channel_check CHECK (
    verified_channel = '' OR verified_channel IN ('admin_review', 'otp_sms', 'otp_whatsapp', 'manual')
  )
);

CREATE TABLE admin_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  admin_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  focus_area text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_auth_accounts_focus_area_check CHECK (
    focus_area IN ('catalog', 'ops', 'reviews', 'support', 'finance_ops', 'superadmin', 'internal_ops')
  )
);

CREATE TABLE auth_sessions (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role text NOT NULL,
  subject_id text NOT NULL,
  last_login_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  last_visited_route text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  session_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_sessions_role_check CHECK (role IN ('admin', 'viewer'))
);

CREATE INDEX auth_sessions_role_subject_id_idx
  ON auth_sessions (role, subject_id);

CREATE INDEX auth_sessions_expires_at_idx
  ON auth_sessions (expires_at);

CREATE INDEX auth_sessions_active_role_subject_id_idx
  ON auth_sessions (role, subject_id, last_seen_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE auth_identities (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_subject text NOT NULL,
  identity_type text NOT NULL,
  identity_value text NOT NULL,
  identity_value_normalized text NOT NULL,
  secret_hash text NOT NULL DEFAULT '',
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_identities_provider_check CHECK (provider IN ('phone_password', 'email_password', 'magic_link', 'oauth')),
  CONSTRAINT auth_identities_identity_type_check CHECK (identity_type IN ('phone', 'email', 'external'))
);

CREATE UNIQUE INDEX auth_identities_provider_subject_idx
  ON auth_identities (provider, provider_subject);

CREATE UNIQUE INDEX auth_identities_value_idx
  ON auth_identities (identity_type, identity_value_normalized);

CREATE TABLE auth_challenges (
  id text PRIMARY KEY,
  user_id text NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  identity_id text NULL REFERENCES auth_identities(id) ON DELETE SET NULL,
  challenge_type text NOT NULL,
  channel text NOT NULL,
  destination text NOT NULL DEFAULT '',
  destination_masked text NOT NULL DEFAULT '',
  code_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz NULL,
  consumed_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_challenges_type_check CHECK (challenge_type IN ('password_reset', 'step_up', 'verify_phone')),
  CONSTRAINT auth_challenges_channel_check CHECK (channel IN ('sms')),
  CONSTRAINT auth_challenges_status_check CHECK (status IN ('pending', 'verified', 'consumed', 'expired', 'cancelled'))
);

CREATE INDEX auth_challenges_user_id_idx
  ON auth_challenges (user_id, created_at DESC);

CREATE INDEX auth_challenges_status_expires_at_idx
  ON auth_challenges (status, expires_at);

CREATE TABLE customer_profiles (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  primary_phone text NOT NULL DEFAULT '',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platforms (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platforms_status_check CHECK (status IN ('active', 'paused', 'archived'))
);

CREATE TABLE platform_domains (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  host text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX platform_domains_platform_id_idx
  ON platform_domains (platform_id, is_primary DESC, host ASC);

CREATE TABLE professional_attribute_schemas (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  schema_definition jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_attribute_schemas_version_check CHECK (version >= 1)
);

CREATE UNIQUE INDEX professional_attribute_schemas_platform_version_idx
  ON professional_attribute_schemas (platform_id, version);

CREATE TABLE professional_platform_profiles (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  review_status text NOT NULL DEFAULT 'draft',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_platform_profiles_status_check CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'paused')),
  CONSTRAINT professional_platform_profiles_review_status_check CHECK (review_status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected'))
);

CREATE UNIQUE INDEX professional_platform_profiles_platform_user_idx
  ON professional_platform_profiles (platform_id, user_id);

CREATE UNIQUE INDEX professional_platform_profiles_platform_slug_idx
  ON professional_platform_profiles (platform_id, slug);

CREATE TABLE professional_applications (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  profile_id text NULL REFERENCES professional_platform_profiles(id) ON DELETE SET NULL,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  schema_id text NOT NULL REFERENCES professional_attribute_schemas(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NULL,
  reviewed_at timestamptz NULL,
  review_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_applications_status_check CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected'))
);

CREATE UNIQUE INDEX professional_applications_platform_user_idx
  ON professional_applications (platform_id, user_id);

CREATE TABLE professional_documents (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  profile_id text NULL REFERENCES professional_platform_profiles(id) ON DELETE SET NULL,
  application_id text NULL REFERENCES professional_applications(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  document_key text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  document_url text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_documents_application_idx
  ON professional_documents (application_id, created_at DESC);

CREATE TABLE professional_portfolio_entries (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  asset_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_portfolio_entries_profile_idx
  ON professional_portfolio_entries (profile_id, sort_order ASC, created_at DESC);

CREATE TABLE professional_gallery_assets (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  asset_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_gallery_assets_profile_idx
  ON professional_gallery_assets (profile_id, sort_order ASC, created_at DESC);

CREATE TABLE professional_credentials (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  label text NOT NULL,
  issuer text NOT NULL DEFAULT '',
  credential_code text NOT NULL DEFAULT '',
  issued_at timestamptz NULL,
  expires_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_credentials_profile_idx
  ON professional_credentials (profile_id, created_at DESC);

CREATE TABLE professional_stories (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_stories_profile_idx
  ON professional_stories (profile_id, sort_order ASC, created_at DESC);

CREATE TABLE professional_coverage_areas (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  city text NOT NULL DEFAULT '',
  area_label text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX professional_coverage_areas_profile_idx
  ON professional_coverage_areas (profile_id, created_at DESC);

CREATE TABLE professional_availability_rules (
  id text PRIMARY KEY,
  profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  weekday integer NOT NULL,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  is_unavailable boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_availability_rules_weekday_check CHECK (weekday BETWEEN 0 AND 6)
);

CREATE INDEX professional_availability_rules_profile_idx
  ON professional_availability_rules (profile_id, weekday ASC, start_time ASC);

CREATE TABLE professional_notification_preferences (
  profile_id text PRIMARY KEY REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  web_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE offerings (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  professional_profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  professional_user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  offering_type text NOT NULL,
  delivery_mode text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  price_amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  fulfillment_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offerings_type_check CHECK (offering_type IN ('home_visit', 'online_session', 'digital_product')),
  CONSTRAINT offerings_delivery_mode_check CHECK (delivery_mode IN ('home_visit', 'online', 'digital')),
  CONSTRAINT offerings_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT offerings_price_amount_check CHECK (price_amount >= 0)
);

CREATE UNIQUE INDEX offerings_platform_slug_idx
  ON offerings (platform_id, slug);

CREATE INDEX offerings_platform_professional_user_idx
  ON offerings (platform_id, professional_user_id, updated_at DESC);

CREATE TABLE offering_assets (
  id text PRIMARY KEY,
  offering_id text NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  asset_url text NOT NULL,
  asset_kind text NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offering_assets_kind_check CHECK (asset_kind IN ('image', 'video', 'document'))
);

CREATE INDEX offering_assets_offering_idx
  ON offering_assets (offering_id, sort_order ASC, created_at DESC);

CREATE TABLE orders (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  customer_user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  professional_profile_id text NULL REFERENCES professional_platform_profiles(id) ON DELETE SET NULL,
  professional_user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  offering_id text NOT NULL REFERENCES offerings(id) ON DELETE RESTRICT,
  order_type text NOT NULL,
  status text NOT NULL,
  payment_status text NOT NULL,
  total_amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  fulfillment_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_type_check CHECK (order_type IN ('home_visit', 'online_session', 'digital_product')),
  CONSTRAINT orders_status_check CHECK (status IN ('pending_payment', 'pending_fulfillment', 'completed', 'cancelled', 'refunded')),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed', 'cancelled')),
  CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0)
);

CREATE INDEX orders_platform_customer_created_idx
  ON orders (platform_id, customer_user_id, created_at DESC);

CREATE INDEX orders_platform_professional_created_idx
  ON orders (platform_id, professional_user_id, created_at DESC);

CREATE TABLE order_events (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_kind text NOT NULL,
  actor_id text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_events_actor_kind_check CHECK (actor_kind IN ('customer', 'professional', 'admin', 'system', 'payment')),
  CONSTRAINT order_events_event_type_check CHECK (
    event_type IN ('created', 'confirmed', 'completed', 'cancelled', 'payment_marked_paid', 'payment_failed', 'refunded')
  )
);

CREATE INDEX order_events_order_created_idx
  ON order_events (order_id, created_at ASC);

CREATE TABLE payments (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  provider_reference text NOT NULL DEFAULT '',
  checkout_url text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_provider_check CHECK (provider IN ('xendit', 'manual_test', 'internal')),
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'expired', 'failed', 'cancelled')),
  CONSTRAINT payments_amount_check CHECK (amount >= 0)
);

CREATE INDEX payments_order_created_idx
  ON payments (order_id, created_at DESC);

CREATE INDEX payments_provider_reference_idx
  ON payments (provider, provider_reference);

CREATE TABLE refunds (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id text NULL REFERENCES payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refunds_status_check CHECK (status IN ('pending', 'approved', 'processed', 'failed')),
  CONSTRAINT refunds_amount_check CHECK (amount >= 0)
);

CREATE INDEX refunds_order_created_idx
  ON refunds (order_id, created_at DESC);

CREATE TABLE payouts (
  id text PRIMARY KEY,
  professional_profile_id text NOT NULL REFERENCES professional_platform_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'IDR',
  provider text NOT NULL DEFAULT 'internal',
  provider_reference text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payouts_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  CONSTRAINT payouts_amount_check CHECK (amount >= 0),
  CONSTRAINT payouts_provider_check CHECK (provider IN ('xendit', 'manual_test', 'internal'))
);

CREATE INDEX payouts_profile_created_idx
  ON payouts (professional_profile_id, created_at DESC);

CREATE TABLE outbox_events (
  id text PRIMARY KEY,
  topic text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz NULL,
  CONSTRAINT outbox_events_status_check CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
  CONSTRAINT outbox_events_attempts_check CHECK (attempts >= 0)
);

CREATE INDEX outbox_events_status_available_at_idx
  ON outbox_events (status, available_at ASC);

CREATE TABLE chat_threads (
  id text PRIMARY KEY,
  platform_id text NULL REFERENCES platforms(id) ON DELETE SET NULL,
  order_id text NULL REFERENCES orders(id) ON DELETE SET NULL,
  title text NOT NULL,
  participant_kind text NOT NULL,
  participant_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_threads_participant_kind_check CHECK (
    participant_kind IN ('conversation', 'order')
  )
);

CREATE INDEX chat_threads_platform_updated_idx
  ON chat_threads (platform_id, updated_at DESC);

CREATE TABLE chat_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_kind text NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_sender_kind_check CHECK (
    sender_kind IN ('viewer', 'professional', 'admin', 'system', 'client')
  )
);

CREATE INDEX chat_messages_thread_id_sent_at_idx
  ON chat_messages (thread_id, sent_at DESC);

CREATE TABLE support_tickets (
  id text PRIMARY KEY,
  platform_id text NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  order_id text NULL REFERENCES orders(id) ON DELETE SET NULL,
  reporter_user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  assigned_admin_id text NULL REFERENCES admin_auth_accounts(admin_id) ON DELETE SET NULL,
  chat_thread_id text NULL REFERENCES chat_threads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'normal',
  subject text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_status_check CHECK (status IN ('new', 'triaged', 'reviewing', 'resolved', 'refunded')),
  CONSTRAINT support_tickets_priority_check CHECK (priority IN ('normal', 'high', 'urgent'))
);

CREATE INDEX support_tickets_platform_status_updated_idx
  ON support_tickets (platform_id, status, updated_at DESC);

CREATE TABLE support_ticket_events (
  id text PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_kind text NOT NULL,
  actor_id text NOT NULL DEFAULT '',
  event_type text NOT NULL,
  public_note text NOT NULL DEFAULT '',
  internal_note text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_ticket_events_actor_kind_check CHECK (
    actor_kind IN ('viewer', 'professional', 'admin', 'system')
  ),
  CONSTRAINT support_ticket_events_event_type_check CHECK (
    event_type IN ('created', 'commented', 'assigned', 'status_changed', 'attachment_added', 'refunded')
  )
);

CREATE INDEX support_ticket_events_ticket_created_at_idx
  ON support_ticket_events (ticket_id, created_at ASC);
