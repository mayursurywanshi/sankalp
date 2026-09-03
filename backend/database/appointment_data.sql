BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppointmentRequestStatus') THEN
    CREATE TYPE "AppointmentRequestStatus" AS ENUM ('REQUESTED', 'ASSIGNED', 'COMPLETED', 'CANCELLED');
  ELSIF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'AppointmentRequestStatus' AND e.enumlabel = 'CONFIRMED')
    AND NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'AppointmentRequestStatus' AND e.enumlabel = 'ASSIGNED') THEN
    ALTER TYPE "AppointmentRequestStatus" RENAME VALUE 'CONFIRMED' TO 'ASSIGNED';
  ELSIF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'AppointmentRequestStatus' AND e.enumlabel = 'ASSIGNED') THEN
    ALTER TYPE "AppointmentRequestStatus" ADD VALUE 'ASSIGNED';
  END IF;
END
$$;

DO $$ BEGIN CREATE TYPE "AppointmentLogEvent" AS ENUM ('REQUEST_CREATED','DOCTOR_ASSIGNED','DOCTOR_REASSIGNED','STATUS_CHANGED','APPOINTMENT_COMPLETED','APPOINTMENT_CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AppointmentActorRole" AS ENUM ('PUBLIC','ADMIN','DOCTOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS patient_number_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(9) NOT NULL UNIQUE DEFAULT ('PAT' || lpad(nextval('patient_number_seq')::TEXT, 6, '0')),
  patient_name VARCHAR(80) NOT NULL,
  normalized_patient_name VARCHAR(80) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  parent_name VARCHAR(80) NOT NULL,
  primary_phone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT patients_name_phone_key UNIQUE (normalized_patient_name, primary_phone)
);

CREATE INDEX IF NOT EXISTS patients_primary_phone_idx ON patients (primary_phone);

CREATE TABLE IF NOT EXISTS appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id VARCHAR(32) NOT NULL UNIQUE,
  parent_name VARCHAR(80) NOT NULL,
  child_name VARCHAR(80) NOT NULL,
  child_age VARCHAR(30) NOT NULL,
  child_date_of_birth DATE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(20) NOT NULL,
  consent BOOLEAN NOT NULL,
  status "AppointmentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  patient_db_id UUID,
  assigned_doctor_id UUID,
  scheduled_date DATE,
  scheduled_time VARCHAR(20),
  assignment_note VARCHAR(500),
  assigned_at TIMESTAMPTZ,
  assigned_by_admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT appointment_requests_consent_check CHECK (consent = TRUE)
);

ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS child_date_of_birth DATE;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS patient_db_id UUID;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS scheduled_time VARCHAR(20);
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS assignment_note VARCHAR(500);
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS assigned_by_admin_id UUID;
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO patients (patient_name, normalized_patient_name, parent_name, primary_phone, email)
SELECT DISTINCT ON (lower(trim(child_name)), phone) child_name, lower(trim(child_name)), parent_name, phone, email
FROM appointment_requests
WHERE patient_db_id IS NULL
ON CONFLICT (normalized_patient_name, primary_phone) DO NOTHING;

UPDATE appointment_requests a SET patient_db_id = p.id
FROM patients p WHERE a.patient_db_id IS NULL AND p.normalized_patient_name = lower(trim(a.child_name)) AND p.primary_phone = a.phone;

ALTER TABLE appointment_requests ALTER COLUMN patient_db_id SET NOT NULL;

DO $$ BEGIN ALTER TABLE appointment_requests ADD CONSTRAINT appointment_requests_patient_fk FOREIGN KEY (patient_db_id) REFERENCES patients(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE appointment_requests ADD CONSTRAINT appointment_requests_doctor_fk FOREIGN KEY (assigned_doctor_id) REFERENCES doctor_details(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE appointment_requests ADD CONSTRAINT appointment_requests_admin_fk FOREIGN KEY (assigned_by_admin_id) REFERENCES admin_login_logs(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS appointment_requests_preferred_date_idx ON appointment_requests (preferred_date);
CREATE INDEX IF NOT EXISTS appointment_requests_status_idx ON appointment_requests (status);
CREATE INDEX IF NOT EXISTS appointment_requests_patient_id_idx ON appointment_requests (patient_db_id);
CREATE INDEX IF NOT EXISTS appointment_requests_doctor_id_idx ON appointment_requests (assigned_doctor_id);
CREATE INDEX IF NOT EXISTS appointment_requests_scheduled_date_idx ON appointment_requests (scheduled_date);
CREATE UNIQUE INDEX IF NOT EXISTS appointment_requests_active_doctor_slot_key ON appointment_requests (assigned_doctor_id, scheduled_date, scheduled_time) WHERE status = 'ASSIGNED';

CREATE TABLE IF NOT EXISTS appointment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID NOT NULL REFERENCES appointment_requests(id) ON DELETE CASCADE,
  patient_db_id UUID REFERENCES patients(id) ON DELETE RESTRICT,
  previous_status "AppointmentRequestStatus",
  new_status "AppointmentRequestStatus" NOT NULL,
  previous_doctor_id UUID REFERENCES doctor_details(id) ON DELETE RESTRICT,
  assigned_doctor_id UUID REFERENCES doctor_details(id) ON DELETE RESTRICT,
  event "AppointmentLogEvent" NOT NULL,
  note VARCHAR(500),
  performed_by_id UUID,
  performed_by_role "AppointmentActorRole" NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS appointment_logs_appointment_id_idx ON appointment_logs (appointment_request_id);
CREATE INDEX IF NOT EXISTS appointment_logs_patient_id_idx ON appointment_logs (patient_db_id);
CREATE INDEX IF NOT EXISTS appointment_logs_created_at_idx ON appointment_logs (created_at);

INSERT INTO appointment_logs (appointment_request_id, patient_db_id, new_status, event, performed_by_role, created_at)
SELECT a.id, a.patient_db_id, a.status, 'REQUEST_CREATED', 'PUBLIC', a.created_at FROM appointment_requests a
WHERE NOT EXISTS (SELECT 1 FROM appointment_logs l WHERE l.appointment_request_id = a.id);

CREATE TABLE IF NOT EXISTS patient_case_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_db_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_request_id UUID NOT NULL UNIQUE REFERENCES appointment_requests(id) ON DELETE RESTRICT,
  appointment_number INTEGER NOT NULL,
  appointment_date DATE NOT NULL,
  next_appointment_date DATE,
  attending_doctor_id UUID NOT NULL REFERENCES doctor_details(id) ON DELETE RESTRICT,
  presenting_concern TEXT,
  medical_history TEXT,
  assessment TEXT,
  treatment_provided TEXT,
  therapy_goals TEXT,
  progress_notes TEXT,
  home_program TEXT,
  recommendations TEXT,
  case_history TEXT NOT NULL,
  additional_notes TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_doctor_id UUID NOT NULL REFERENCES doctor_details(id) ON DELETE RESTRICT,
  updated_by_doctor_id UUID NOT NULL REFERENCES doctor_details(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT patient_case_history_appointment_number_key UNIQUE (patient_db_id, appointment_number)
);

CREATE INDEX IF NOT EXISTS patient_case_history_doctor_id_idx ON patient_case_history (attending_doctor_id);
CREATE INDEX IF NOT EXISTS patient_case_history_appointment_date_idx ON patient_case_history (appointment_date);

COMMIT;
