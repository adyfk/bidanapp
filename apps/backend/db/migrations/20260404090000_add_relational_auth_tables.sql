CREATE TABLE auth_users (
  id text PRIMARY KEY,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  consumer_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  phone text NOT NULL,
  phone_normalized text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE professional_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  professional_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  city text NOT NULL DEFAULT '',
  phone text NOT NULL,
  phone_normalized text NOT NULL UNIQUE,
  credential_number text NOT NULL,
  password_hash text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  recovery_requested_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_auth_accounts (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  admin_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  focus_area text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role text NOT NULL,
  subject_id text NOT NULL,
  last_login_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  last_visited_route text NOT NULL DEFAULT '',
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_sessions_role_subject_id_idx
  ON auth_sessions (role, subject_id);
