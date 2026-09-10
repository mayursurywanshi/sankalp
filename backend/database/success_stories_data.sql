BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE "OurImpactPostType" AS ENUM ('SUCCESS_STORY', 'PARENT_FEEDBACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OurImpactMediaType" AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OurImpactPostStatus" AS ENUM ('PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS our_impact_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type "OurImpactPostType" NOT NULL,
  title VARCHAR(150) NOT NULL,
  story TEXT NOT NULL,
  media_type "OurImpactMediaType" NOT NULL,
  media_url TEXT NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  status "OurImpactPostStatus" NOT NULL DEFAULT 'PUBLISHED',
  created_by UUID REFERENCES admin_login_logs(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT our_impact_posts_title_not_blank CHECK (btrim(title) <> ''),
  CONSTRAINT our_impact_posts_story_not_blank CHECK (btrim(story) <> '')
);

CREATE INDEX IF NOT EXISTS our_impact_posts_type_status_published_idx
  ON our_impact_posts (post_type, status, published_at DESC);

COMMIT;
