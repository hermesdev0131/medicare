-- Add RLS policies to the redacted view to fix linter warning
-- Only authenticated users can access the redacted view
CREATE POLICY "Authenticated users can view redacted profiles" ON public.profiles_redacted
FOR SELECT TO authenticated
USING (true);

-- Enable RLS on the view
ALTER VIEW public.profiles_redacted ENABLE ROW LEVEL SECURITY;