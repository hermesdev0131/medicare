-- Fix remaining function search path issues
-- The remaining function without search_path is update_profile_completion
CREATE OR REPLACE FUNCTION public.update_profile_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Calculate profile completion
  NEW.profile_completion_percentage = (
    SELECT public.calculate_profile_completion(
      NEW.first_name,
      NEW.last_name, 
      NEW.phone_number,
      NEW.company_name,
      NEW.position_title,
      NEW.license_state,
      NEW.avatar_url,
      NEW.bio
    )
  );
  
  -- Check if profile is completed (80% or more)
  NEW.profile_completed = (NEW.profile_completion_percentage >= 80);
  
  -- Update verification badges
  NEW.verification_badges = jsonb_build_array(
    CASE WHEN NEW.email_verified THEN 'email_verified' ELSE NULL END,
    CASE WHEN NEW.phone_verified THEN 'phone_verified' ELSE NULL END,
    CASE WHEN NEW.npn_verified THEN 'npn_verified' ELSE NULL END,
    CASE WHEN NEW.profile_completed THEN 'profile_completed' ELSE NULL END,
    CASE WHEN NEW.avatar_url IS NOT NULL THEN 'avatar_uploaded' ELSE NULL END
  ) - '[null]'::jsonb;
  
  RETURN NEW;
END;
$function$;