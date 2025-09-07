
-- 1) Add 'author' role to app_role enum (idempotent)
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
END
$$;

-- 2) Create content_posts table to handle blogs and newsletters with tiered visibility
CREATE TABLE IF NOT EXISTS public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  feature_image_url text,
  -- blog | newsletter
  content_type text NOT NULL DEFAULT 'blog',
  -- draft | published | scheduled
  status text NOT NULL DEFAULT 'draft',
  -- public | subscribers | tiered
  visibility text NOT NULL DEFAULT 'public',
  -- Minimum tier for tiered visibility: Basic | Premium | Enterprise
  required_min_tier text,
  tags text[] DEFAULT '{}'::text[],
  allow_comments boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS content_posts_status_published_at_idx ON public.content_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS content_posts_visibility_idx ON public.content_posts (visibility);
CREATE INDEX IF NOT EXISTS content_posts_author_idx ON public.content_posts (author_id);

-- 3) Keep updated_at current on updates
DROP TRIGGER IF EXISTS set_timestamp_content_posts ON public.content_posts;
CREATE TRIGGER set_timestamp_content_posts
BEFORE UPDATE ON public.content_posts
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- 4) Helper function to compare subscription tiers (idempotent)
CREATE OR REPLACE FUNCTION public.subscription_tier_rank(tier text)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN tier ILIKE 'basic' THEN 1
    WHEN tier ILIKE 'premium' THEN 2
    WHEN tier ILIKE 'enterprise' THEN 3
    ELSE 0
  END
$$;

-- 5) Enable RLS
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

-- 6) Policies

-- Anyone (including anon) can view published public posts
DROP POLICY IF EXISTS public_can_view_published_public_posts ON public.content_posts;
CREATE POLICY public_can_view_published_public_posts
ON public.content_posts
FOR SELECT
TO public
USING (status = 'published' AND visibility = 'public');

-- Authenticated subscribers can view published subscriber/tiered posts when eligible
DROP POLICY IF EXISTS subscribers_can_view_paid_posts_by_tier ON public.content_posts;
CREATE POLICY subscribers_can_view_paid_posts_by_tier
ON public.content_posts
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND visibility IN ('subscribers', 'tiered')
  AND EXISTS (
    SELECT 1
    FROM public.subscribers s
    WHERE (s.user_id = auth.uid() OR s.email = auth.email())
      AND s.subscribed = true
      AND (
        visibility = 'subscribers'
        OR (
          visibility = 'tiered'
          AND public.subscription_tier_rank(s.subscription_tier) >= public.subscription_tier_rank(content_posts.required_min_tier)
        )
      )
  )
);

-- Authors (own posts) and Admins (all) can view any post (draft/published/etc.)
DROP POLICY IF EXISTS authors_and_admins_can_view_manage_posts_select ON public.content_posts;
CREATE POLICY authors_and_admins_can_view_manage_posts_select
ON public.content_posts
FOR SELECT
TO authenticated
USING (
  content_posts.author_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Authors can insert posts for themselves; Admins can also insert
DROP POLICY IF EXISTS authors_and_admins_can_insert_posts ON public.content_posts;
CREATE POLICY authors_and_admins_can_insert_posts
ON public.content_posts
FOR INSERT
TO authenticated
WITH CHECK (
  (content_posts.author_id = auth.uid() AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')))
);

-- Authors can update their own posts; Admins can update any
DROP POLICY IF EXISTS authors_and_admins_can_update_posts ON public.content_posts;
CREATE POLICY authors_and_admins_can_update_posts
ON public.content_posts
FOR UPDATE
TO authenticated
USING (
  (content_posts.author_id = auth.uid() AND public.has_role(auth.uid(), 'author'))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (content_posts.author_id = auth.uid() AND public.has_role(auth.uid(), 'author'))
  OR public.has_role(auth.uid(), 'admin')
);

-- Authors can delete their own posts; Admins can delete any
DROP POLICY IF EXISTS authors_and_admins_can_delete_posts ON public.content_posts;
CREATE POLICY authors_and_admins_can_delete_posts
ON public.content_posts
FOR DELETE
TO authenticated
USING (
  (content_posts.author_id = auth.uid() AND public.has_role(auth.uid(), 'author'))
  OR public.has_role(auth.uid(), 'admin')
);
