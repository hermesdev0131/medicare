-- 1) Add audit logging for profile changes without breaking existing behavior
-- This helps detect suspicious activity even if an account is compromised

-- Create auditing trigger function
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  ua text;
BEGIN
  -- best-effort extract of user-agent from headers (may be null)
  BEGIN
    ua := (current_setting('request.headers', true)::jsonb ->> 'user-agent');
  EXCEPTION WHEN OTHERS THEN
    ua := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activity_log (user_id, action, details, user_agent, ip_address)
    VALUES (NEW.user_id, 'profile_created', jsonb_build_object('profile_id', NEW.id), ua, NULL);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_activity_log (user_id, action, details, user_agent, ip_address)
    VALUES (NEW.user_id, 'profile_updated', jsonb_build_object('profile_id', NEW.id), ua, NULL);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_activity_log (user_id, action, details, user_agent, ip_address)
    VALUES (OLD.user_id, 'profile_deleted', jsonb_build_object('profile_id', OLD.id), ua, NULL);
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers on profiles
DROP TRIGGER IF EXISTS trg_profiles_audit_ins ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_audit_upd ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_audit_del ON public.profiles;

CREATE TRIGGER trg_profiles_audit_ins
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

CREATE TRIGGER trg_profiles_audit_upd
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

CREATE TRIGGER trg_profiles_audit_del
AFTER DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();


-- 2) Provide a redacted view for safe listing without sensitive data exposure
-- This does not change existing table behavior and is optional for future use
CREATE OR REPLACE VIEW public.profiles_redacted AS
SELECT
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  CASE 
    WHEN p.email IS NULL THEN NULL
    ELSE concat('***', right(p.email, greatest(6, char_length(p.email) - 6)))
  END AS email_masked,
  CASE 
    WHEN p.phone_number IS NULL THEN NULL
    WHEN char_length(p.phone_number) < 4 THEN '***'
    ELSE lpad(right(p.phone_number, 4), char_length(p.phone_number), '*')
  END AS phone_masked,
  p.company_name,
  p.position_title,
  CASE 
    WHEN p.npn IS NULL THEN NULL
    WHEN char_length(p.npn) < 4 THEN '***'
    ELSE lpad(right(p.npn, 4), char_length(p.npn), '*')
  END AS npn_masked,
  CASE 
    WHEN p.license_number IS NULL THEN NULL
    WHEN char_length(p.license_number) < 4 THEN '***'
    ELSE lpad(right(p.license_number, 4), char_length(p.license_number), '*')
  END AS license_number_masked,
  p.license_state,
  p.avatar_url,
  p.bio,
  p.profile_completed,
  p.phone_verified,
  p.email_verified,
  p.npn_verified,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.verification_badges,
  p.onboarding_completed
FROM public.profiles p;