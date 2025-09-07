-- Phase 3 (fix): Safely add constraints and triggers without IF NOT EXISTS

-- 1) Add validation constraints only if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_progress_percentage' 
      AND conrelid = 'public.course_enrollments'::regclass
  ) THEN
    ALTER TABLE public.course_enrollments 
      ADD CONSTRAINT check_progress_percentage 
      CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_module_progress_percentage' 
      AND conrelid = 'public.module_progress'::regclass
  ) THEN
    ALTER TABLE public.module_progress
      ADD CONSTRAINT check_module_progress_percentage
      CHECK (score IS NULL OR (score >= 0 AND score <= 100));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_assessment_score' 
      AND conrelid = 'public.user_assessment_attempts'::regclass
  ) THEN
    ALTER TABLE public.user_assessment_attempts
      ADD CONSTRAINT check_assessment_score
      CHECK (score IS NULL OR (score >= 0 AND score <= 100));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_time_spent_positive' 
      AND conrelid = 'public.lesson_progress'::regclass
  ) THEN
    ALTER TABLE public.lesson_progress
      ADD CONSTRAINT check_time_spent_positive
      CHECK (time_spent_minutes IS NULL OR time_spent_minutes >= 0);
  END IF;
END $$;

-- 2) Ensure updated_at trigger exists for key tables
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['profiles','certifications','learning_goals','learning_paths','courses','course_modules','course_lessons','assessments','content_posts','subscribers','user_roles']) AS tbl
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = format('update_%s_updated_at', t.tbl)
        AND tgrelid = format('public.%s', t.tbl)::regclass
    ) THEN
      EXECUTE format('CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t.tbl);
    END IF;
  END LOOP;
END $$;