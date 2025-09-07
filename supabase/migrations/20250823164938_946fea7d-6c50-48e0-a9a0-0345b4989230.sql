-- Phase 1: Critical Security Fixes
-- 1) Harden RLS on subscribers (fix overly-permissive UPDATE and unrestricted INSERT)

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if they exist
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Allow users and admins to insert their own subscription row; edge functions using service role bypass RLS
CREATE POLICY "insert_own_subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (email = auth.email())
);

-- Restrict updates to owners or admins only
CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (email = auth.email())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (email = auth.email())
);

-- 2) Tighten INSERT on user_activity_log (prevent arbitrary inserts)
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert activity logs" ON public.user_activity_log;

CREATE POLICY "Users can insert their own activity logs"
ON public.user_activity_log
FOR INSERT
WITH CHECK (user_id = auth.uid());