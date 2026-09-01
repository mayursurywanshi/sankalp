BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "AdminLoginEvent" AS ENUM (
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGOUT',
    'SESSION_EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id CITEXT NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_login_logs_role_idx
  ON admin_login_logs (role);

CREATE TABLE IF NOT EXISTS admin_login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_login_logs(id) ON DELETE SET NULL,
  attempted_login_id CITEXT NOT NULL,
  event "AdminLoginEvent" NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_login_audit_admin_id_idx
  ON admin_login_audit (admin_id);

CREATE INDEX IF NOT EXISTS admin_login_audit_created_at_idx
  ON admin_login_audit (created_at);

CREATE TABLE IF NOT EXISTS admin_authentication_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_login_logs(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_authentication_sessions_admin_id_idx
  ON admin_authentication_sessions (admin_id);

CREATE INDEX IF NOT EXISTS admin_authentication_sessions_expires_at_idx
  ON admin_authentication_sessions (expires_at);

INSERT INTO admin_login_logs (login_id, full_name, password_hash, role)
VALUES (
  'Admin.Sankalp',
  'Sankalp Administrator',
  '$2b$12$5nvkpi.urID03Lds6Nmvge//SzdJ32sg.YZ2/YElNevIXP8SQhGae',
  'ADMIN'
)
ON CONFLICT (login_id) DO NOTHING;

COMMIT;
