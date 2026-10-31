-- =============================================================================
-- Migration: 20261020000000_base_schema.sql
-- Description:
--   Baseline schema establishing pre-requisite core tables, indexes, storage buckets,
--   and initial RLS policies for a reproducible fresh database deployment.
--
-- Objects established:
--   1. Extension: pgcrypto
--   2. Tables: public.events, public.announcements, public.gallery_items, public.contact_messages
--   3. Storage: storage.buckets 'gallery'
--   4. Row Level Security: enabled on all 4 tables with baseline public policies
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Core Events Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Workshop',
  short_description text NOT NULL,
  description text NOT NULL,
  agenda jsonb DEFAULT '[]'::jsonb,
  prerequisites text[] DEFAULT '{}'::text[],
  venue text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  eligibility text NOT NULL DEFAULT 'Kishkinda University students',
  coordinator_name text NOT NULL,
  registration_opens_at timestamptz DEFAULT now(),
  registration_deadline timestamptz NOT NULL,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts ON public.events(starts_at);

-- ---------------------------------------------------------------------------
-- 2. Announcements Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Gallery Items Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL,
  caption text,
  alt_text text NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_published ON public.gallery_items(published);

-- ---------------------------------------------------------------------------
-- 4. Contact Messages Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  handled boolean NOT NULL DEFAULT false,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_handled ON public.contact_messages(handled);

-- ---------------------------------------------------------------------------
-- 5. Storage Bucket Configuration
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ---------------------------------------------------------------------------
-- 6. Initial Row Level Security & Base Policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT TO public
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can view published announcements" ON public.announcements;
CREATE POLICY "Public can view published announcements"
  ON public.announcements FOR SELECT TO public
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can view published gallery items" ON public.gallery_items;
CREATE POLICY "Public can view published gallery items"
  ON public.gallery_items FOR SELECT TO public
  USING (published = true);

DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) between 1 and 100
    and length(trim(email)) between 5 and 100
    and length(trim(message)) between 5 and 2000
  );

