-- Phase 3: Data Integrity and Validation Enhancements
-- Add missing triggers and validation functions

-- 1. Ensure consistent updated_at timestamp handling across all tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add missing updated_at triggers for tables that have updated_at columns
DO $$
DECLARE
  table_name text;
  tables_with_updated_at text[] := ARRAY[
    'profiles', 'certifications', 'learning_goals', 'learning_paths',
    'courses', 'course_modules', 'course_lessons', 'assessments',
    'content_posts', 'subscribers', 'user_roles'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format('
      CREATE TRIGGER IF NOT EXISTS update_%I_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
    ', table_name, table_name);
  END LOOP;
END $$;

-- 2. Add profile completion calculation trigger (if not exists)
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
AS $$
DECLARE
  completion_score integer := 0;
  total_fields integer := 8;
BEGIN
  IF _first_name IS NOT NULL AND _first_name != '' THEN completion_score := completion_score + 1; END IF;
  IF _last_name IS NOT NULL AND _last_name != '' THEN completion_score := completion_score + 1; END IF;
  IF _phone_number IS NOT NULL AND _phone_number != '' THEN completion_score := completion_score + 1; END IF;
  IF _company_name IS NOT NULL AND _company_name != '' THEN completion_score := completion_score + 1; END IF;
  IF _position_title IS NOT NULL AND _position_title != '' THEN completion_score := completion_score + 1; END IF;
  IF _license_state IS NOT NULL AND _license_state != '' THEN completion_score := completion_score + 1; END IF;
  IF _avatar_url IS NOT NULL AND _avatar_url != '' THEN completion_score := completion_score + 1; END IF;
  IF _bio IS NOT NULL AND _bio != '' THEN completion_score := completion_score + 1; END IF;
  
  RETURN ROUND((completion_score::FLOAT / total_fields::FLOAT) * 100);
END;
$$;

-- 3. Add data validation constraints
-- Ensure course progress percentages are valid
ALTER TABLE public.course_enrollments 
ADD CONSTRAINT IF NOT EXISTS check_progress_percentage 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Ensure module progress percentages are valid  
ALTER TABLE public.module_progress
ADD CONSTRAINT IF NOT EXISTS check_module_progress_percentage
CHECK (score IS NULL OR (score >= 0 AND score <= 100));

-- Ensure assessment scores are valid
ALTER TABLE public.user_assessment_attempts
ADD CONSTRAINT IF NOT EXISTS check_assessment_score
CHECK (score IS NULL OR (score >= 0 AND score <= 100));

-- Ensure time spent is reasonable (not negative)
ALTER TABLE public.lesson_progress
ADD CONSTRAINT IF NOT EXISTS check_time_spent_positive
CHECK (time_spent_minutes IS NULL OR time_spent_minutes >= 0);

-- 4. Add enrollment count update trigger for courses
CREATE OR REPLACE FUNCTION public.update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses 
    SET enrollment_count = enrollment_count + 1 
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses 
    SET enrollment_count = GREATEST(0, enrollment_count - 1) 
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_course_enrollment_count_trigger
AFTER INSERT OR DELETE ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_course_enrollment_count();