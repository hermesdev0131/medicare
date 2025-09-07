-- Adjust audit function to run without SECURITY DEFINER to satisfy linter
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
-- Removed SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  ua text;
BEGIN
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