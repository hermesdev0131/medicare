-- 1) Add 'author' role to app_role enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'author'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'author';
  END IF;
END$$;

-- 2) Create content_posts table
CREATE TABLE IF NOT EXISTS public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  feature_image_url text,
  content_type text NOT NULL DEFAULT 'blog', -- 'blog' | 'newsletter'
  status text NOT NULL DEFAULT 'draft',      -- 'draft' | 'published' | 'scheduled'
  visibility text NOT NULL DEFAULT 'public', -- 'public' | 'subscribers' | 'tiered'
  required_min_tier text,
  tags jsonb NOT NULL DEFAULT '[]',
  allow_comments boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional FK to profiles.user_id (avoids referencing auth.users directly)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'content_posts_author_id_fkey'
  ) THEN
    ALTER TABLE public.content_posts
    ADD CONSTRAINT content_posts_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END$$;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_content_posts_author_id ON public.content_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_status_visibility ON public.content_posts(status, visibility);
CREATE INDEX IF NOT EXISTS idx_content_posts_published_at ON public.content_posts(published_at);

-- 4) Enable RLS
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

-- 5) Policies
DROP POLICY IF EXISTS "Authors and admins can manage their posts" ON public.content_posts;
CREATE POLICY "Authors and admins can manage their posts"
ON public.content_posts
FOR ALL
USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view published public posts" ON public.content_posts;
CREATE POLICY "Anyone can view published public posts"
ON public.content_posts
FOR SELECT
USING (status = 'published' AND visibility = 'public');

-- 6) Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_content_posts_updated_at ON public.content_posts;
CREATE TRIGGER update_content_posts_updated_at
BEFORE UPDATE ON public.content_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();