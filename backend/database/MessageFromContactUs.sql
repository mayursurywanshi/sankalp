BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'ContactMessageStatus' AND e.enumlabel = 'CONTACTED')
    AND NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'ContactMessageStatus' AND e.enumlabel = 'IN_PROGRESS') THEN
    ALTER TYPE "ContactMessageStatus" RENAME VALUE 'CONTACTED' TO 'IN_PROGRESS';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'ContactMessageStatus' AND e.enumlabel = 'CLOSED')
    AND NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'ContactMessageStatus' AND e.enumlabel = 'RESOLVED') THEN
    ALTER TYPE "ContactMessageStatus" RENAME VALUE 'CLOSED' TO 'RESOLVED';
  END IF;
END
$$;

DO $$ BEGIN CREATE TYPE "ContactFollowUpMethod" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ContactRequestActivityEvent" AS ENUM ('RECEIVED', 'DOCTOR_ASSIGNED', 'DOCTOR_REASSIGNED', 'FOLLOW_UP_UPDATED', 'STATUS_CHANGED', 'APPOINTMENT_CREATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  IF to_regclass('public.contact_messages') IS NOT NULL
    AND to_regclass('public.message_from_contact_us') IS NULL THEN
    ALTER TABLE contact_messages RENAME TO message_from_contact_us;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS message_from_contact_us (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NOT NULL,
  subject VARCHAR(120) NOT NULL DEFAULT 'General Enquiry',
  message TEXT NOT NULL,
  status "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
  assigned_doctor_id UUID,
  follow_up_method "ContactFollowUpMethod",
  admin_note VARCHAR(1000),
  resolved_at TIMESTAMPTZ,
  converted_appointment_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT message_from_contact_us_message_length_check
    CHECK (char_length(message) <= 900)
);

ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS subject VARCHAR(120) NOT NULL DEFAULT 'General Enquiry';
ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS assigned_doctor_id UUID;
ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS follow_up_method "ContactFollowUpMethod";
ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS admin_note VARCHAR(1000);
ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS converted_appointment_id UUID;
ALTER TABLE message_from_contact_us ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN ALTER TABLE message_from_contact_us ADD CONSTRAINT message_from_contact_us_doctor_fk FOREIGN KEY (assigned_doctor_id) REFERENCES doctor_details(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE message_from_contact_us ADD CONSTRAINT message_from_contact_us_appointment_fk FOREIGN KEY (converted_appointment_id) REFERENCES appointment_requests(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS message_from_contact_us_converted_appointment_key ON message_from_contact_us (converted_appointment_id) WHERE converted_appointment_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_from_contact_us_message_length_check'
      AND conrelid = 'public.message_from_contact_us'::regclass
  ) THEN
    ALTER TABLE message_from_contact_us
      ADD CONSTRAINT message_from_contact_us_message_length_check
      CHECK (char_length(message) <= 900);
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.contact_messages_status_idx') IS NOT NULL
    AND to_regclass('public.message_from_contact_us_status_idx') IS NULL THEN
    ALTER INDEX contact_messages_status_idx RENAME TO message_from_contact_us_status_idx;
  END IF;

  IF to_regclass('public.contact_messages_created_at_idx') IS NOT NULL
    AND to_regclass('public.message_from_contact_us_created_at_idx') IS NULL THEN
    ALTER INDEX contact_messages_created_at_idx RENAME TO message_from_contact_us_created_at_idx;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS message_from_contact_us_status_idx
  ON message_from_contact_us (status);

CREATE INDEX IF NOT EXISTS message_from_contact_us_created_at_idx
  ON message_from_contact_us (created_at);

CREATE INDEX IF NOT EXISTS message_from_contact_us_doctor_id_idx
  ON message_from_contact_us (assigned_doctor_id);

CREATE TABLE IF NOT EXISTS contact_request_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID NOT NULL REFERENCES message_from_contact_us(id) ON DELETE CASCADE,
  event "ContactRequestActivityEvent" NOT NULL,
  previous_status "ContactMessageStatus",
  new_status "ContactMessageStatus",
  assigned_doctor_id UUID REFERENCES doctor_details(id) ON DELETE SET NULL,
  follow_up_method "ContactFollowUpMethod",
  note VARCHAR(1000),
  performed_by_admin_id UUID REFERENCES admin_login_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE contact_request_activity_logs OWNER TO sankalp;

CREATE INDEX IF NOT EXISTS contact_request_activity_message_created_idx
  ON contact_request_activity_logs (contact_message_id, created_at DESC);

INSERT INTO contact_request_activity_logs (contact_message_id, event, new_status, created_at)
SELECT message.id, 'RECEIVED', message.status, message.created_at
FROM message_from_contact_us message
WHERE NOT EXISTS (
  SELECT 1 FROM contact_request_activity_logs activity
  WHERE activity.contact_message_id = message.id AND activity.event = 'RECEIVED'
);

COMMIT;
