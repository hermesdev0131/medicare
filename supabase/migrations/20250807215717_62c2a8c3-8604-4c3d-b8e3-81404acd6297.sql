-- Add access_type to webinars for Free vs Subscribers-only
ALTER TABLE public.webinars
ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'free';

-- Optional: index for filtering by access type
CREATE INDEX IF NOT EXISTS idx_webinars_access_type ON public.webinars (access_type);
