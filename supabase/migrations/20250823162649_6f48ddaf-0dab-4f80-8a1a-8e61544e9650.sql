-- Add delivery_method column to content_posts table
ALTER TABLE public.content_posts 
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'dashboard' CHECK (delivery_method IN ('email', 'dashboard', 'both'));