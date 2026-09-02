BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE "DoctorCredentialStatus" AS ENUM ('PENDING', 'ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "AdminLoginEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'SESSION_EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE SEQUENCE IF NOT EXISTS doctor_employee_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS doctor_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id VARCHAR(9) NOT NULL UNIQUE DEFAULT ('DOC' || lpad(nextval('doctor_employee_number_seq')::TEXT, 6, '0')),
  generated_login_id VARCHAR(9) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email CITEXT NOT NULL UNIQUE,
  designation VARCHAR(100) NOT NULL,
  joining_date DATE NOT NULL,
  date_of_birth DATE NOT NULL,
  credential_status "DoctorCredentialStatus" NOT NULL DEFAULT 'PENDING',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT doctor_details_adult_check CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);

CREATE INDEX IF NOT EXISTS doctor_details_credential_status_idx ON doctor_details (credential_status);
CREATE INDEX IF NOT EXISTS doctor_details_is_active_idx ON doctor_details (is_active);

CREATE TABLE IF NOT EXISTS doctor_login_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_details_id UUID NOT NULL UNIQUE REFERENCES doctor_details(id) ON DELETE CASCADE,
  login_id CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL DEFAULT 'Admin.Sankalp',
  updated_by VARCHAR(100) NOT NULL DEFAULT 'Admin.Sankalp'
);

CREATE INDEX IF NOT EXISTS doctor_login_details_is_active_idx ON doctor_login_details (is_active);

CREATE TABLE IF NOT EXISTS doctor_authentication_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_login_details_id UUID NOT NULL REFERENCES doctor_login_details(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS doctor_authentication_sessions_login_id_idx ON doctor_authentication_sessions (doctor_login_details_id);
CREATE INDEX IF NOT EXISTS doctor_authentication_sessions_expires_at_idx ON doctor_authentication_sessions (expires_at);

CREATE TABLE IF NOT EXISTS doctor_login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_login_details_id UUID REFERENCES doctor_login_details(id) ON DELETE SET NULL,
  attempted_login_id CITEXT NOT NULL,
  event "AdminLoginEvent" NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS doctor_login_audit_login_id_idx ON doctor_login_audit (doctor_login_details_id);
CREATE INDEX IF NOT EXISTS doctor_login_audit_created_at_idx ON doctor_login_audit (created_at);

COMMIT;
