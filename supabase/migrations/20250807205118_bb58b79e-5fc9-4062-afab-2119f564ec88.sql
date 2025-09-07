-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(
  _first_name text,
  _last_name text,
  _phone_number text,
  _company_name text,
  _position_title text,
  _license_state text,
  _avatar_url text,
  _bio text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;