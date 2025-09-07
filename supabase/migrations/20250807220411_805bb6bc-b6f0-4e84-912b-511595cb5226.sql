-- Fix function search path security issues
-- Update calculate_profile_completion function
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(_first_name text, _last_name text, _phone_number text, _company_name text, _position_title text, _license_state text, _avatar_url text, _bio text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  completion_score integer := 0;
  total_fields integer := 8;
BEGIN
  -- Calculate completion based on filled fields
  IF _first_name IS NOT NULL AND _first_name != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _last_name IS NOT NULL AND _last_name != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _phone_number IS NOT NULL AND _phone_number != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _company_name IS NOT NULL AND _company_name != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _position_title IS NOT NULL AND _position_title != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _license_state IS NOT NULL AND _license_state != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _avatar_url IS NOT NULL AND _avatar_url != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  IF _bio IS NOT NULL AND _bio != '' THEN
    completion_score := completion_score + 1;
  END IF;
  
  RETURN ROUND((completion_score::FLOAT / total_fields::FLOAT) * 100);
END;
$function$;

-- Update calculate_course_progress function
CREATE OR REPLACE FUNCTION public.calculate_course_progress(p_user_id uuid, p_course_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Get total number of required modules
  SELECT COUNT(*) INTO total_modules
  FROM public.course_modules
  WHERE course_id = p_course_id AND is_required = true;
  
  -- Get number of completed required modules
  SELECT COUNT(*) INTO completed_modules
  FROM public.module_progress mp
  JOIN public.course_modules cm ON mp.module_id = cm.id
  WHERE mp.user_id = p_user_id 
    AND mp.course_id = p_course_id 
    AND mp.completed = true
    AND cm.is_required = true;
  
  -- Calculate percentage
  IF total_modules = 0 THEN
    progress_percentage := 100;
  ELSE
    progress_percentage := ROUND((completed_modules::FLOAT / total_modules::FLOAT) * 100);
  END IF;
  
  RETURN progress_percentage;
END;
$function$;

-- Update update_course_progress function
CREATE OR REPLACE FUNCTION public.update_course_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_progress INTEGER;
BEGIN
  -- Calculate new progress
  new_progress := public.calculate_course_progress(NEW.user_id, NEW.course_id);
  
  -- Update enrollment progress
  UPDATE public.course_enrollments
  SET 
    progress_percentage = new_progress,
    completed_at = CASE WHEN new_progress = 100 THEN now() ELSE NULL END,
    last_accessed_at = now()
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  
  RETURN NEW;
END;
$function$;