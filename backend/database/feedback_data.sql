BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE "FeedbackInvitationStatus" AS ENUM ('CREATED', 'SENT', 'OPENED', 'SUBMITTED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FeedbackModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS feedback_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id VARCHAR(32) NOT NULL UNIQUE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  patient_db_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_request_id UUID REFERENCES appointment_requests(id) ON DELETE SET NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  personal_message VARCHAR(500),
  status "FeedbackInvitationStatus" NOT NULL DEFAULT 'CREATED',
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_by_admin_id UUID NOT NULL REFERENCES admin_login_logs(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_invitation_id UUID NOT NULL UNIQUE REFERENCES feedback_invitations(id) ON DELETE CASCADE,
  patient_db_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT NOT NULL CHECK (btrim(feedback) <> ''),
  parent_display_name VARCHAR(80) NOT NULL CHECK (btrim(parent_display_name) <> ''),
  consent_to_publish BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status "FeedbackModerationStatus" NOT NULL DEFAULT 'PENDING',
  moderated_by_admin_id UUID REFERENCES admin_login_logs(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Run this script from pgAdmin using the postgres/server-owner account.
-- The application connects as sankalp, so it must own the two feature tables.
ALTER TABLE feedback_invitations OWNER TO sankalp;
ALTER TABLE parent_feedback_responses OWNER TO sankalp;

CREATE INDEX IF NOT EXISTS feedback_invitations_patient_id_idx ON feedback_invitations(patient_db_id);
CREATE INDEX IF NOT EXISTS feedback_invitations_status_created_idx ON feedback_invitations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_invitations_expires_at_idx ON feedback_invitations(expires_at);
CREATE INDEX IF NOT EXISTS parent_feedback_moderation_submitted_idx ON parent_feedback_responses(moderation_status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS parent_feedback_patient_id_idx ON parent_feedback_responses(patient_db_id);

-- Keep previously generated active links consistent with the current
-- 24-hour validity policy. Submitted and cancelled links are left unchanged.
UPDATE feedback_invitations
SET expires_at = LEAST(
  expires_at,
  COALESCE(sent_at, created_at) + INTERVAL '24 hours'
)
WHERE status IN ('CREATED', 'SENT', 'OPENED');

COMMIT;
