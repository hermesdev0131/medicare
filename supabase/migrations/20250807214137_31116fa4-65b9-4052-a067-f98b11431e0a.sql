-- Add Zoom-specific fields to webinars table
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS zoom_webinar_id text;
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS zoom_join_url text;
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS zoom_passcode text;
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS zoom_registration_url text;
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS zoom_meeting_uuid text;
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS recording_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.webinars ADD COLUMN IF NOT EXISTS zoom_created boolean DEFAULT false;