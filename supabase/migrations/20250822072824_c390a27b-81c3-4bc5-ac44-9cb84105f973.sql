-- Harden security for sensitive user data in public.profiles
-- 1) Enforce RLS strictly (even table owner must obey policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 2) Restrict privileges: remove any access from anon and public; keep minimal grants for authenticated (RLS still applies)
DO $$
BEGIN
  -- Revoke broad access if previously granted
  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'anon'
  ) THEN
    REVOKE ALL ON TABLE public.profiles FROM anon;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
  ) THEN
    -- Ensure only required minimal privileges for app clients
    GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
  END IF;

  -- Revoke from the SPECIAL "public" role in case anything was granted broadly
  REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
END $$;

-- 3) Add audit logging trigger for profile changes (function already exists per project config)
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- Note: Existing RLS policies already restrict SELECT/INSERT/UPDATE to the row owner.
-- This migration enforces RLS and least-privilege grants without changing app behavior.