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
  message TEXT NOT NULL,
  status "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT message_from_contact_us_message_length_check
    CHECK (char_length(message) <= 900)
);

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

COMMIT;
