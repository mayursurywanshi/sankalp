BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE "AppointmentRequestStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id VARCHAR(32) NOT NULL UNIQUE,
  parent_name VARCHAR(80) NOT NULL,
  child_name VARCHAR(80) NOT NULL,
  child_age VARCHAR(30) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(20) NOT NULL,
  consent BOOLEAN NOT NULL,
  status "AppointmentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT appointment_requests_consent_check CHECK (consent = TRUE)
);

CREATE INDEX IF NOT EXISTS appointment_requests_preferred_date_idx
  ON appointment_requests (preferred_date);

CREATE INDEX IF NOT EXISTS appointment_requests_status_idx
  ON appointment_requests (status);

COMMIT;
